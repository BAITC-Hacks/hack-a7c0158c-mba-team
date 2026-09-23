"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { BusinessTask, TaskFields } from "@/features/tasks/types";
import { TaskFieldsEditor } from "@/features/tasks/TaskFieldsEditor";
import { TaskReadinessPreview } from "@/features/tasks/TaskReadinessPreview";
import { getTask, updateTask } from "@/lib/storage";

export function TaskEditor({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<BusinessTask | null>(null);
  const [fields, setFields] = useState<TaskFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void getTask(taskId).then((loaded) => {
      if (!active) return;
      if (loaded.status !== "published") {
        setError("Можно редактировать только опубликованные карточки.");
        return;
      }
      setTask(loaded);
      setFields({
        title: loaded.title,
        industry: loaded.industry,
        context: loaded.context,
        need: loaded.need,
        users: loaded.users,
        dataMaterials: loaded.dataMaterials,
        constraints: loaded.constraints,
        expectedOutcome: loaded.expectedOutcome,
        successCriteria: loaded.successCriteria,
        contact: loaded.contact,
        interactionFormat: loaded.interactionFormat,
      });
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Не удалось загрузить карточку.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [taskId]);

  function changeField(key: keyof TaskFields, value: string) {
    setFields((current) => current ? { ...current, [key]: value } : current);
    setSaved(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fields) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const updated = await updateTask(taskId, fields);
      setTask(updated);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить карточку.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="placeholder">Загружаем карточку…</p>;
  if (!fields || !task) {
    return <div className="placeholder"><p>{error || "Карточка не найдена."}</p><Link className="button" href="/catalog">Открыть каталог</Link></div>;
  }

  return (
    <section className="task-flow">
      <div className="task-page-heading">
        <div className="task-page-copy">
          <p className="eyebrow">Редактирование опубликованной задачи</p>
          <h1>Обновите карточку и её рейтинг</h1>
          <p className="task-intro">Баллы пересчитываются по мере изменения полей. После сохранения обновлённые карточка и позиция появятся в общем каталоге.</p>
        </div>
        <aside className="task-overview">
          <p className="task-overview-kicker">Сейчас опубликована</p>
          <h2>{task.title}</h2>
          <p>Текущий рейтинг: {task.score}/100</p>
        </aside>
      </div>

      {error && <p className="task-error" role="alert">{error}</p>}
      {saved && <p className="task-notice" role="status">Карточка и рейтинг сохранены. Каталог обновится автоматически.</p>}
      <form className="task-panel" onSubmit={handleSave}>
        <TaskReadinessPreview task={fields} />
        <TaskFieldsEditor value={fields} onChange={changeField} />
        <div className="task-actions">
          <Link className="button button-secondary" href={`/business/tasks/${task.id}/responses`}>Вернуться к откликам</Link>
          <button className="button" type="submit" disabled={busy}>{busy ? "Сохраняем…" : "Подтвердить изменения"}</button>
        </div>
      </form>
    </section>
  );
}
