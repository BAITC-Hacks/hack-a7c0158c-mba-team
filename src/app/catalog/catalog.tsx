"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { READINESS_DESCRIPTIONS, READINESS_LABELS, scoreTask } from "@/features/tasks/scoring";
import type { BusinessTask, ReadinessLevel, TaskFields } from "@/features/tasks/types";
import { STORAGE_KEYS } from "@/lib/storage";

type ReadinessFilter = "all" | ReadinessLevel;
type SortOrder = "score-desc" | "score-asc";

const readinessOrder: ReadinessLevel[] = ["draft", "working", "ready", "priority"];

function readPublishedTasks(): BusinessTask[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.tasks) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((task): task is BusinessTask =>
      task && typeof task === "object" && task.status === "published" &&
      typeof task.id === "string" && typeof task.title === "string",
    );
  } catch {
    return [];
  }
}

export default function Catalog() {
  const [tasks, setTasks] = useState<BusinessTask[]>([]);
  const [industry, setIndustry] = useState("all");
  const [readiness, setReadiness] = useState<ReadinessFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("score-desc");

  useEffect(() => {
    const refresh = () => setTasks(readPublishedTasks());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const industries = useMemo(
    () => [...new Set(tasks.map((task) => task.industry.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru")),
    [tasks],
  );

  const visibleTasks = useMemo(() => tasks
    .map((task) => ({ task, result: scoreTask(task as TaskFields) }))
    .filter(({ task, result }) => (industry === "all" || task.industry === industry) &&
      (readiness === "all" || result.readinessLevel === readiness))
    .sort((a, b) => sortOrder === "score-desc" ? b.result.score - a.result.score : a.result.score - b.result.score),
  [tasks, industry, readiness, sortOrder]);

  return (
    <section className="catalog-page">
      <p className="eyebrow">Открытый пул задач</p>
      <h1>Каталог задач</h1>
      <p className="catalog-intro">Выбирайте задачу по теме и готовности. Низкий рейтинг означает, что бизнесу ещё есть что уточнить, но откликнуться можно на любую опубликованную задачу.</p>

      <div className="catalog-toolbar" aria-label="Фильтры каталога">
        <label className="filter-control">
          <span>Тема</span>
          <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
            <option value="all">Все темы</option>
            {industries.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="filter-control">
          <span>Готовность</span>
          <select value={readiness} onChange={(event) => setReadiness(event.target.value as ReadinessFilter)}>
            <option value="all">Любой уровень</option>
            {readinessOrder.map((level) => <option key={level} value={level}>{READINESS_LABELS[level]}</option>)}
          </select>
        </label>
        <label className="filter-control">
          <span>Сортировка</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
            <option value="score-desc">Сначала высокий рейтинг</option>
            <option value="score-asc">Сначала низкий рейтинг</option>
          </select>
        </label>
        <p className="catalog-count" aria-live="polite">Найдено: {visibleTasks.length}</p>
      </div>

      {visibleTasks.length === 0 ? (
        <div className="catalog-empty">
          <h2>{tasks.length ? "По этим фильтрам задач нет" : "Пока нет опубликованных задач"}</h2>
          <p>{tasks.length ? "Измените фильтры, чтобы увидеть другие задачи." : "Создайте карточку и подтвердите публикацию — задача появится здесь."}</p>
          {!tasks.length && <Link className="button" href="/business/new">Создать задачу</Link>}
        </div>
      ) : (
        <div className="task-grid">
          {visibleTasks.map(({ task, result }) => (
            <article className="task-card" key={task.id}>
              <div className="task-card-heading">
                <div>
                  <p className="task-industry">{task.industry || "Отрасль не указана"}</p>
                  <h2>{task.title || "Без названия"}</h2>
                </div>
                <span className={`readiness-badge readiness-${result.readinessLevel}`}>{READINESS_LABELS[result.readinessLevel]}</span>
              </div>
              <p className="task-summary">{task.need || task.context || "Описание задачи пока не добавлено."}</p>
              <div className="score-row">
                <strong>{result.score}<span>/100</span></strong>
                <span>Рейтинг готовности</span>
              </div>
              <div className="score-track" role="progressbar" aria-label="Рейтинг готовности задачи" aria-valuemin={0} aria-valuemax={100} aria-valuenow={result.score}>
                <span style={{ width: `${result.score}%` }} />
              </div>
              <p className="readiness-description">{READINESS_DESCRIPTIONS[result.readinessLevel]}</p>
              {result.suggestions.length > 0 && (
                <details className="score-details">
                  <summary>Как повысить рейтинг ({result.suggestions.length})</summary>
                  <ul>{result.suggestions.map((hint) => <li key={hint}>{hint}</li>)}</ul>
                </details>
              )}
              <div className="score-breakdown">
                <p className="score-breakdown-title">Баллы по критериям</p>
                {result.details.map((item) => (
                  <div className="score-detail-row" key={item.key}>
                    <span>{item.label}</span><span>{item.points}/{item.maxPoints}</span>
                  </div>
                ))}
              </div>
              <div className="task-card-footer">
                <span>{result.missing.length ? `Нужно уточнить: ${result.missing.length}` : "Карточка заполнена"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
