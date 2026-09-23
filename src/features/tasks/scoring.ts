import type { ReadinessLevel, TaskFields } from "./types";

export const SCORE_CRITERIA = [
  { key: "contextNeed", weight: 20, label: "Контекст и потребность", fields: ["context", "need"] },
  { key: "dataMaterials", weight: 20, label: "Данные и материалы", fields: ["dataMaterials"] },
  { key: "expectedOutcome", weight: 15, label: "Ожидаемый результат", fields: ["expectedOutcome"] },
  { key: "successCriteria", weight: 15, label: "Критерии успеха", fields: ["successCriteria"] },
  { key: "constraints", weight: 10, label: "Ограничения", fields: ["constraints"] },
  { key: "users", weight: 10, label: "Пользователи", fields: ["users"] },
  { key: "businessContact", weight: 10, label: "Связь с бизнесом", fields: ["contact", "interactionFormat"] },
] as const;

export const READINESS_LABELS: Record<ReadinessLevel, string> = {
  draft: "Черновик",
  working: "Рабочая",
  ready: "Готовая",
  priority: "Приоритетная",
};

export const READINESS_DESCRIPTIONS: Record<ReadinessLevel, string> = {
  draft: "Задача видна в каталоге, но пока требует уточнений.",
  working: "Команды могут откликаться; описание уже помогает начать работу.",
  ready: "Хорошо подготовленная задача получает более высокую позицию.",
  priority: "Задача подробно описана и готова к работе.",
};

export function scoreTask(task: TaskFields) {
  const details = SCORE_CRITERIA.map(({ key, weight, label, fields }) => ({
    key,
    label,
    points: fields.every((field) => typeof task[field as keyof TaskFields] === "string" && task[field as keyof TaskFields].trim().length > 0) ? weight : 0,
    maxPoints: weight,
  }));
  const score = details.reduce((sum, item) => sum + item.points, 0);
  const readinessLevel: ReadinessLevel = score < 40 ? "draft" : score < 70 ? "working" : score < 90 ? "ready" : "priority";

  return {
    score,
    readinessLevel,
    details,
    missing: details.filter((item) => item.points === 0).map((item) => item.label),
    suggestions: details
      .filter((item) => item.points === 0)
      .map((item) => `Добавьте сведения: ${item.label.toLowerCase()} (+${item.maxPoints} баллов).`),
  };
}
