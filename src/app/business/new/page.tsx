"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { BusinessTask, TaskFields } from "@/features/tasks/types";
import { TaskFieldsEditor } from "@/features/tasks/TaskFieldsEditor";
import { TaskReadinessPreview } from "@/features/tasks/TaskReadinessPreview";
import { demoDraftDescriptions } from "@/lib/demo-data";
import { createTask } from "@/lib/storage";

type QuestionField = Exclude<keyof TaskFields, "title" | "industry">;
type ClarificationQuestion = { field: QuestionField; text: string };
type ClarificationResult = {
  mode: "openai" | "fallback";
  prompt: string;
  input: { description: string; industry: string };
  questions: ClarificationQuestion[];
  suggestedFields: TaskFields;
  warning?: string;
};
type Step = "draft" | "questions" | "card" | "published";

const emptyTask: TaskFields = {
  title: "",
  industry: "",
  context: "",
  need: "",
  users: "",
  dataMaterials: "",
  constraints: "",
  expectedOutcome: "",
  successCriteria: "",
  contact: "",
  interactionFormat: "",
};

const industries = ["Образование", "Розничная торговля", "Финансы", "Здравоохранение", "Производство", "Энергетика", "Логистика", "Другое"];

export default function NewBusinessTaskPage() {
  const [step, setStep] = useState<Step>("draft");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [draftExampleId, setDraftExampleId] = useState("");
  const [clarification, setClarification] = useState<ClarificationResult | null>(null);
  const [answers, setAnswers] = useState<Partial<Record<QuestionField, string>>>({});
  const [card, setCard] = useState<TaskFields>(emptyTask);
  const [publishedTask, setPublishedTask] = useState<BusinessTask | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function requestQuestions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, industry }),
      });
      const result = await response.json() as ClarificationResult & { error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось обработать описание.");
      if (!Array.isArray(result.questions) || result.questions.length < 3) {
        throw new Error("Сервис вернул меньше трёх уточняющих вопросов. Попробуйте ещё раз.");
      }

      setClarification(result);
      setAnswers({});
      setCard({ ...emptyTask, ...result.suggestedFields, industry });
      setStep("questions");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось обработать описание.");
    } finally {
      setBusy(false);
    }
  }

  function buildCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clarification) return;

    const nextCard = { ...card };
    for (const question of clarification.questions) {
      const answer = (answers[question.field] || "").trim();
      if (answer) nextCard[question.field] = answer;
    }
    if (!nextCard.title.trim()) {
      nextCard.title = (description.split(/[.!?\n]/)[0] || description).trim().slice(0, 80);
    }
    setCard(nextCard);
    setStep("card");
  }

  function updateCard(key: keyof TaskFields, value: string) {
    setCard((current) => ({ ...current, [key]: value }));
  }

  async function confirmAndPublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const task = await createTask(card);
      setPublishedTask(task);
      setStep("published");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить задачу.");
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    setStep("draft");
    setDescription("");
    setIndustry("");
    setDraftExampleId("");
    setClarification(null);
    setAnswers({});
    setCard(emptyTask);
    setPublishedTask(null);
    setError("");
  }

  return (
    <section className="task-flow">
      <div className="task-page-heading">
        <div className="task-page-copy">
          <p className="eyebrow">AI Sana · для бизнеса</p>
          <h1>Превратите запрос в понятную задачу для команды</h1>
          <p className="task-intro">Начните с короткого описания. Уточните важные детали, проверьте карточку и подтвердите публикацию.</p>
        </div>
        <aside className="task-overview" aria-label="Как создаётся задача">
          <p className="task-overview-kicker">Путь до каталога</p>
          <h2>Четыре простых шага</h2>
          <ol>
            <li><span>01</span><div><strong>Черновик</strong><small>Опишите потребность своими словами</small></div></li>
            <li><span>02</span><div><strong>Уточнение</strong><small>Ответьте на вопросы помощника</small></div></li>
            <li><span>03</span><div><strong>Проверка</strong><small>Отредактируйте карточку задачи</small></div></li>
            <li><span>04</span><div><strong>Публикация</strong><small>Подтвердите размещение в каталоге</small></div></li>
          </ol>
        </aside>
      </div>

      <ol className="task-steps" aria-label="Этапы создания задачи">
        <li aria-current={step === "draft" ? "step" : undefined} className={step === "draft" ? "is-current" : "is-done"}>Черновик</li>
        <li aria-current={step === "questions" ? "step" : undefined} className={step === "questions" ? "is-current" : ["card", "published"].includes(step) ? "is-done" : ""}>Уточнение</li>
        <li aria-current={step === "card" ? "step" : undefined} className={step === "card" ? "is-current" : step === "published" ? "is-done" : ""}>Карточка</li>
        <li aria-current={step === "published" ? "step" : undefined} className={step === "published" ? "is-current" : ""}>Публикация</li>
      </ol>

      {error && <p className="task-error" role="alert">{error}</p>}

      {step === "draft" && (
        <form className="task-panel" onSubmit={requestQuestions}>
          <h2>1. Черновик задачи</h2>
          <label className="task-field">
            <span>Кратко опишите потребность или проблему</span>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Например: сотрудники тратят много времени на ручную обработку заявок…"
            />
            <small>От 10 символов. Не указывайте персональные или конфиденциальные данные.</small>
          </label>
          <label className="task-field task-field-short">
            <span>Тема или отрасль</span>
            <select required value={industry} onChange={(event) => setIndustry(event.target.value)}>
              <option value="">Выберите тему</option>
              {industries.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="task-field task-field-short">
            <span>Или выберите синтетический пример</span>
            <select
              value={draftExampleId}
              onChange={(event) => {
                const example = demoDraftDescriptions.find((item) => item.id === event.target.value);
                setDraftExampleId(event.target.value);
                if (example) {
                  setDescription(example.description);
                  setIndustry(example.industry);
                }
              }}
            >
              <option value="">Выберите пример для demo</option>
              {demoDraftDescriptions.map((example) => <option key={example.id} value={example.id}>{example.label}</option>)}
            </select>
          </label>
          <button className="button" type="submit" disabled={busy}>
            {busy ? "Анализируем…" : "Найти, чего не хватает"}
          </button>
        </form>
      )}

      {step === "questions" && clarification && (
        <form className="task-panel" onSubmit={buildCard}>
          <div className="task-panel-heading">
            <div>
              <h2>2. Уточните детали</h2>
              <p className="muted">Ответы попадут в соответствующие поля карточки. Их можно будет отредактировать.</p>
            </div>
            <span className={`ai-mode ai-mode-${clarification.mode}`}>
              {clarification.mode === "openai" ? "AI-анализ" : "Демо-режим"}
            </span>
          </div>

          {clarification.warning && <p className="task-notice" role="status">{clarification.warning}</p>}
          {clarification.mode === "fallback" && <p className="task-notice">Подключение AI недоступно. Используются безопасные демонстрационные вопросы; исходный текст не дополняется выдуманными фактами.</p>}

          {clarification.questions.map((question, index) => (
            <label className="task-field" key={`${question.field}-${index}`}>
              <span>{question.text}</span>
              <textarea
                rows={3}
                maxLength={2000}
                value={answers[question.field] || ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [question.field]: event.target.value }))}
                placeholder="Добавьте известные детали; если ответа пока нет, оставьте поле пустым"
              />
            </label>
          ))}

          <div className="task-actions">
            <button className="button button-secondary" type="button" onClick={() => setStep("draft")}>Назад</button>
            <button className="button" type="submit">Сформировать карточку</button>
          </div>

          <details className="task-ai-details">
            <summary>Промпт и формат AI для демонстрации</summary>
            <p><strong>Входные данные:</strong></p>
            <pre>{JSON.stringify(clarification.input, null, 2)}</pre>
            <p><strong>Промпт:</strong></p>
            <pre>{clarification.prompt}</pre>
            <p><strong>Полученный структурированный ответ:</strong></p>
            <pre>{JSON.stringify({ questions: clarification.questions, suggestedFields: clarification.suggestedFields }, null, 2)}</pre>
          </details>
        </form>
      )}

      {step === "card" && (
        <form className="task-panel" onSubmit={confirmAndPublish}>
          <div>
            <p className="task-panel-kicker">Этап 3 из 4</p>
            <h2>Проверьте и отредактируйте карточку</h2>
            <p className="muted task-panel-copy">Пустые поля можно дополнить сейчас или позже. Перед публикацией проверьте предложенный текст.</p>
          </div>
          <div className="task-callout">
            <strong>Решение остаётся за вами</strong>
            <span>Карточка появится в каталоге только после вашего подтверждения. Низкая готовность не скроет задачу.</span>
          </div>
          <TaskReadinessPreview task={card} />
          <TaskFieldsEditor value={card} onChange={updateCard} />
          <div className="task-actions">
            <button className="button button-secondary" type="button" onClick={() => setStep("questions")}>Назад к ответам</button>
            <button className="button" type="submit" disabled={busy}>{busy ? "Публикуем…" : "Подтвердить и опубликовать"}</button>
          </div>
        </form>
      )}

      {step === "published" && publishedTask && (
        <div className="task-panel task-success" role="status">
          <span className="task-success-mark" aria-hidden="true">✓</span>
          <h2>Задача опубликована</h2>
          <p><strong>{publishedTask.title}</strong> добавлена в общий каталог. Вы сможете сравнить отклики и принять решение вручную.</p>
          <p className="muted">Рейтинг готовности: {publishedTask.score}/100. Карточка доступна всем, кто откроет каталог этого сервера.</p>
          <div className="task-actions">
            <Link className="button" href="/catalog">Перейти в каталог</Link>
            <Link className="button button-secondary" href={`/business/tasks/${publishedTask.id}/edit`}>Редактировать карточку</Link>
            <Link className="button button-secondary" href={`/business/tasks/${publishedTask.id}/responses`}>Посмотреть отклики</Link>
            <button className="button button-secondary" type="button" onClick={startOver}>Создать ещё задачу</button>
          </div>
        </div>
      )}
    </section>
  );
}
