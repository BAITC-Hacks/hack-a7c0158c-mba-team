"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { scoreTask } from "@/features/tasks/scoring";
import type { BusinessTask, TaskFields } from "@/features/tasks/types";
import { STORAGE_KEYS } from "@/lib/storage";

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

const fields: { key: keyof TaskFields; label: string; hint: string; short?: boolean }[] = [
  { key: "title", label: "Название задачи", hint: "Коротко и по делу", short: true },
  { key: "industry", label: "Тема или отрасль", hint: "Например: образование, торговля, финансы", short: true },
  { key: "context", label: "Контекст", hint: "Что происходит сейчас?" },
  { key: "need", label: "Потребность или проблема", hint: "Что нужно изменить или решить?" },
  { key: "users", label: "Пользователи", hint: "Для кого создаётся решение?" },
  { key: "dataMaterials", label: "Данные и материалы", hint: "Какие данные, примеры или источники доступны?" },
  { key: "constraints", label: "Ограничения", hint: "Сроки, технологии, доступы и другие границы" },
  { key: "expectedOutcome", label: "Ожидаемый результат", hint: "Что команда должна передать в конце?" },
  { key: "successCriteria", label: "Критерии успеха", hint: "По каким признакам вы примете результат?" },
  { key: "contact", label: "Контакт со стороны бизнеса", hint: "Имя или роль контактного человека" },
  { key: "interactionFormat", label: "Формат взаимодействия", hint: "Как часто и каким способом команда получит обратную связь?" },
];

const industries = ["Образование", "Розничная торговля", "Финансы", "Здравоохранение", "Производство", "Другое"];

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `task-${Date.now()}`;
}

export default function NewBusinessTaskPage() {
  const [step, setStep] = useState<Step>("draft");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
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

  function updateCard<K extends keyof TaskFields>(key: K, value: TaskFields[K]) {
    setCard((current) => ({ ...current, [key]: value }));
  }

  function confirmAndPublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.tasks);
      const existing: unknown = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(existing)) throw new Error("В хранилище задач некорректный формат.");

      const readiness = scoreTask(card);
      const task: BusinessTask = {
        ...card,
        id: makeId(),
        score: readiness.score,
        readinessLevel: readiness.readinessLevel,
        status: "published",
        confirmedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify([task, ...existing]));
      setPublishedTask(task);
      setStep("published");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить задачу.");
    }
  }

  function startOver() {
    setStep("draft");
    setDescription("");
    setIndustry("");
    setClarification(null);
    setAnswers({});
    setCard(emptyTask);
    setPublishedTask(null);
    setError("");
  }

  return (
    <section className="task-flow">
      <p className="eyebrow">Бизнес · создание задачи</p>
      <h1>Опишите задачу — мы поможем её уточнить</h1>
      <p className="task-intro">Заполните черновик, ответьте на вопросы и проверьте карточку. Публикация произойдёт только после вашего подтверждения.</p>

      <ol className="task-steps" aria-label="Этапы создания задачи">
        <li className={step === "draft" ? "is-current" : "is-done"}>1. Черновик</li>
        <li className={step === "questions" ? "is-current" : ["card", "published"].includes(step) ? "is-done" : ""}>2. Уточнение</li>
        <li className={step === "card" ? "is-current" : step === "published" ? "is-done" : ""}>3. Карточка</li>
        <li className={step === "published" ? "is-current" : ""}>4. Подтверждение</li>
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
          <h2>3. Проверьте и отредактируйте карточку</h2>
          <p className="muted">Пустые поля можно заполнить сейчас или позже. Проверьте предложенный текст: AI не заменяет ваше подтверждение.</p>
          <div className="task-field-grid">
            {fields.map(({ key, label, hint, short }) => (
              <label className={`task-field${short ? " task-field-short" : ""}`} key={key}>
                <span>{label}</span>
                {short ? (
                  <input
                    required={key === "title" || key === "industry"}
                    maxLength={key === "title" ? 120 : 120}
                    value={card[key]}
                    onChange={(event) => updateCard(key, event.target.value)}
                    placeholder={hint}
                  />
                ) : (
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={card[key]}
                    onChange={(event) => updateCard(key, event.target.value)}
                    placeholder={hint}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="task-actions">
            <button className="button button-secondary" type="button" onClick={() => setStep("questions")}>Назад к ответам</button>
            <button className="button" type="submit">Подтвердить и опубликовать</button>
          </div>
        </form>
      )}

      {step === "published" && publishedTask && (
        <div className="task-panel task-success" role="status">
          <span className="task-success-mark" aria-hidden="true">✓</span>
          <h2>Задача опубликована</h2>
          <p><strong>{publishedTask.title}</strong> добавлена в общий каталог. Вы сможете сравнить отклики и принять решение вручную.</p>
          <p className="muted">Рейтинг готовности: {publishedTask.score}/100. Карточка сохранена в этом браузере.</p>
          <div className="task-actions">
            <Link className="button" href="/catalog">Перейти в каталог</Link>
            <Link className="button button-secondary" href={`/business/tasks/${publishedTask.id}/responses`}>Посмотреть отклики</Link>
            <button className="button button-secondary" type="button" onClick={startOver}>Создать ещё задачу</button>
          </div>
        </div>
      )}
    </section>
  );
}
