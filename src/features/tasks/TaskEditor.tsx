"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { READINESS_LABELS, scoreTask } from "@/features/tasks/scoring";
import type { BusinessTask, TaskFields } from "@/features/tasks/types";
import { notifyServerCollectionChanged } from "@/lib/use-server-collection";

const fields: { key: keyof TaskFields; label: string; hint: string; short?: boolean }[] = [
  { key: "title", label: "Название задачи", hint: "Коротко и по делу", short: true },
  { key: "industry", label: "Тема или отрасль", hint: "Например, образование или торговля", short: true },
  { key: "context", label: "Контекст", hint: "Что происходит сейчас?" },
  { key: "need", label: "Потребность или проблема", hint: "Что нужно изменить или решить?" },
  { key: "users", label: "Пользователи", hint: "Для кого создаётся решение?" },
  { key: "dataMaterials", label: "Данные и материалы", hint: "Какие материалы доступны команде?" },
  { key: "constraints", label: "Ограничения", hint: "Сроки, технологии и другие границы" },
  { key: "expectedOutcome", label: "Ожидаемый результат", hint: "Что команда должна передать?" },
  { key: "successCriteria", label: "Критерии успеха", hint: "Как оценить результат?" },
  { key: "contact", label: "Контакт со стороны бизнеса", hint: "Можно указать только роль" },
  { key: "interactionFormat", label: "Формат взаимодействия", hint: "Как команда получит обратную связь?" },
];

export function TaskEditor({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<BusinessTask | null>(null);
  const [form, setForm] = useState<TaskFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const score = useMemo(() => form ? scoreTask(form) : null, [form]);

  useEffect(() => {
    let active = true;
    void fetch("/api/tasks", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Не удалось загрузить задачи.");
        return response.json() as Promise<BusinessTask[]>;
      })
      .then((tasks) => {
        if (!active) return;
        const found = tasks.find((item) => item.id === taskId && item.status === "published");
        if (!found) setError("Опубликованная задача не найдена.");
        else {
          setTask(found);
          setForm({ title: found.title, industry: found.industry, context: found.context, need: found.need, users: found.users, dataMaterials: found.dataMaterials, constraints: found.constraints, expectedOutcome: found.expectedOutcome, successCriteria: found.successCriteria, contact: found.contact, interactionFormat: found.interactionFormat });
        }
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Не удалось загрузить задачу."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [taskId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json() as BusinessTask & { error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить карточку.");
      setTask(result);
      setForm({ title: result.title, industry: result.industry, context: result.context, need: result.need, users: result.users, dataMaterials: result.dataMaterials, constraints: result.constraints, expectedOutcome: result.expectedOutcome, successCriteria: result.successCriteria, contact: result.contact, interactionFormat: result.interactionFormat });
      setSaved(true);
      notifyServerCollectionChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить карточку.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="placeholder">Загружаем карточку…</p>;
  if (!task || !form || !score) return <div className="placeholder"><p>{error || "Задача не найдена."}</p><Link className="text-link" href="/business/responses">К списку задач</Link></div>;

  return (
    <section>
      <p className="eyebrow">Бизнес · Карточка задачи</p>
      <h1>Обновить описание задачи</h1>
      <p className="muted">После сохранения рейтинг пересчитывается по тем же критериям, а карточка остаётся опубликованной.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {saved && <p className="success-message" role="status">Изменения опубликованы. Новый рейтинг: {task.score}/100 · {READINESS_LABELS[task.readinessLevel]}.</p>}
      <form className="task-panel" onSubmit={save}>
        <div className="task-callout">
          <strong>Текущая готовность: {score.score}/100 · {READINESS_LABELS[score.readinessLevel]}</strong>
          <span>Добавьте недостающие сведения: {score.missing.length ? score.missing.join(", ") : "все поля рейтинга заполнены"}.</span>
        </div>
        <div className="task-field-grid">
          {fields.map(({ key, label, hint, short }) => (
            <label className={`task-field${short ? " task-field-short" : ""}`} key={key}>
              <span>{label}</span>
              {short ? (
                <input required={key === "title" || key === "industry"} maxLength={120} value={form[key]} onChange={(event) => setForm((current) => current ? { ...current, [key]: event.target.value } : current)} placeholder={hint} />
              ) : (
                <textarea rows={3} maxLength={2000} value={form[key]} onChange={(event) => setForm((current) => current ? { ...current, [key]: event.target.value } : current)} placeholder={hint} />
              )}
            </label>
          ))}
        </div>
        <div className="score-breakdown">
          <p className="score-breakdown-title">Баллы по критериям</p>
          {score.details.map((item) => <div className="score-detail-row" key={item.key}><span>{item.label}</span><span>{item.points}/{item.maxPoints}</span></div>)}
        </div>
        <div className="task-actions">
          <Link className="button button-secondary" href={`/business/tasks/${taskId}/responses`}>К откликам</Link>
          <button className="button" type="submit" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить и обновить рейтинг"}</button>
        </div>
      </form>
    </section>
  );
}
