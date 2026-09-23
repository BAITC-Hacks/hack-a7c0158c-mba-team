"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { READINESS_DESCRIPTIONS, READINESS_LABELS, scoreTask } from "@/features/tasks/scoring";
import type { ReadinessLevel, TaskFields } from "@/features/tasks/types";
import { STORAGE_KEYS, subscribeToStorageChanges } from "@/lib/storage";
import styles from "./catalog.module.css";

type ReadinessFilter = "all" | ReadinessLevel;
type SortOrder = "score-desc" | "score-asc";
type PublishedTask = TaskFields & { id: string; status: "published" };

const readinessOrder: ReadinessLevel[] = ["draft", "working", "ready", "priority"];
const taskFieldKeys: (keyof TaskFields)[] = [
  "title", "industry", "context", "need", "users", "dataMaterials", "constraints",
  "expectedOutcome", "successCriteria", "contact", "interactionFormat",
];

const readinessClassNames: Record<ReadinessLevel, string> = {
  draft: styles.readinessDraft,
  working: styles.readinessWorking,
  ready: styles.readinessReady,
  priority: styles.readinessPriority,
};

function isPublishedTask(value: unknown): value is PublishedTask {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const task = value as Record<string, unknown>;
  return task.status === "published" && typeof task.id === "string" &&
    taskFieldKeys.every((key) => typeof task[key] === "string");
}

function readPublishedTasks(): PublishedTask[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.tasks) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(isPublishedTask);
  } catch {
    return [];
  }
}

export default function Catalog() {
  const [tasks, setTasks] = useState<PublishedTask[]>([]);
  const [industry, setIndustry] = useState("all");
  const [readiness, setReadiness] = useState<ReadinessFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("score-desc");

  useEffect(() => {
    const refresh = () => setTasks(readPublishedTasks());
    refresh();
    const unsubscribe = subscribeToStorageChanges(refresh);
    window.addEventListener("focus", refresh);
    return () => {
      unsubscribe();
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
    <section className={styles.catalogPage}>
      <p className="eyebrow">Открытый пул задач</p>
      <h1>Каталог задач</h1>
      <p className={styles.catalogIntro}>Выбирайте задачу по теме и готовности. Низкий рейтинг означает, что бизнесу ещё есть что уточнить, но откликнуться можно на любую опубликованную задачу.</p>

      <div className={styles.catalogToolbar} aria-label="Фильтры каталога">
        <label className={styles.filterControl}>
          <span>Тема</span>
          <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
            <option value="all">Все темы</option>
            {industries.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className={styles.filterControl}>
          <span>Готовность</span>
          <select value={readiness} onChange={(event) => setReadiness(event.target.value as ReadinessFilter)}>
            <option value="all">Любой уровень</option>
            {readinessOrder.map((level) => <option key={level} value={level}>{READINESS_LABELS[level]}</option>)}
          </select>
        </label>
        <label className={styles.filterControl}>
          <span>Сортировка</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
            <option value="score-desc">Сначала высокий рейтинг</option>
            <option value="score-asc">Сначала низкий рейтинг</option>
          </select>
        </label>
        <p className={styles.catalogCount} aria-live="polite">Найдено: {visibleTasks.length}</p>
      </div>

      {visibleTasks.length === 0 ? (
        <div className={styles.catalogEmpty}>
          <h2>{tasks.length ? "По этим фильтрам задач нет" : "Пока нет опубликованных задач"}</h2>
          <p>{tasks.length ? "Измените фильтры, чтобы увидеть другие задачи." : "Создайте карточку и подтвердите публикацию — задача появится здесь."}</p>
          {!tasks.length && <Link className="button" href="/business/new">Создать задачу</Link>}
        </div>
      ) : (
        <div className={styles.taskGrid}>
          {visibleTasks.map(({ task, result }) => (
            <article className={styles.taskCard} key={task.id}>
              <div className={styles.taskCardHeading}>
                <div>
                  <p className={styles.taskIndustry}>{task.industry || "Отрасль не указана"}</p>
                  <h2>{task.title || "Без названия"}</h2>
                </div>
                <span className={`${styles.readinessBadge} ${readinessClassNames[result.readinessLevel]}`}>{READINESS_LABELS[result.readinessLevel]}</span>
              </div>
              <p className={styles.taskSummary}>{task.need || task.context || "Описание задачи пока не добавлено."}</p>
              <div className={styles.scoreRow}>
                <strong>{result.score}<span>/100</span></strong>
                <span>Рейтинг готовности</span>
              </div>
              <div className={styles.scoreTrack} role="progressbar" aria-label="Рейтинг готовности задачи" aria-valuemin={0} aria-valuemax={100} aria-valuenow={result.score}>
                <span style={{ width: `${result.score}%` }} />
              </div>
              <p className={styles.readinessDescription}>{READINESS_DESCRIPTIONS[result.readinessLevel]}</p>
              {result.suggestions.length > 0 && (
                <details className={styles.scoreDetails}>
                  <summary>Как повысить рейтинг ({result.suggestions.length})</summary>
                  <ul>{result.suggestions.map((hint) => <li key={hint}>{hint}</li>)}</ul>
                </details>
              )}
              <div className={styles.scoreBreakdown}>
                <p className={styles.scoreBreakdownTitle}>Баллы по критериям</p>
                {result.details.map((item) => (
                  <div className={styles.scoreDetailRow} key={item.key}>
                    <span>{item.label}</span><span>{item.points}/{item.maxPoints}</span>
                  </div>
                ))}
              </div>
              <div className={styles.taskCardFooter}>
                <span>{result.missing.length ? `Нужно уточнить: ${result.missing.length}` : "Карточка заполнена"}</span>
                <Link className="text-link" href={`/catalog/${task.id}/respond`}>Откликнуться</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
