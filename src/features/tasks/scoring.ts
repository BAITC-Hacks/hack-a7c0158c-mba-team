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

const FIELD_LABELS: Record<keyof TaskFields, string> = {
  title: "Название задачи",
  industry: "Тема или отрасль",
  context: "Контекст",
  need: "Потребность или проблема",
  users: "Пользователи",
  dataMaterials: "Данные и материалы",
  constraints: "Ограничения",
  expectedOutcome: "Ожидаемый результат",
  successCriteria: "Критерии успеха",
  contact: "Контакт со стороны бизнеса",
  interactionFormat: "Формат взаимодействия",
};

export function scoreTask(task: TaskFields) {
  const details = SCORE_CRITERIA.map(({ key, weight, label, fields }) => {
    const fieldPoints = weight / fields.length;
    const filledFields = fields.filter((field) => {
      const value = task[field as keyof TaskFields];
      return typeof value === "string" && value.trim().length > 0;
    });
    const missingFields = fields.filter((field) => !filledFields.includes(field));

    return {
      key,
      label,
      points: filledFields.length * fieldPoints,
      maxPoints: weight,
      pointsPerField: fieldPoints,
      missingFields,
    };
  });
  const score = details.reduce((sum, item) => sum + item.points, 0);
  const readinessLevel: ReadinessLevel = score < 40 ? "draft" : score < 70 ? "working" : score < 90 ? "ready" : "priority";
  const missing = details.flatMap((item) => item.missingFields.map((field) => FIELD_LABELS[field as keyof TaskFields]));
  const suggestions = details.flatMap((item) =>
    item.missingFields.map((field) => `Заполните поле «${FIELD_LABELS[field as keyof TaskFields]}» (+${item.pointsPerField} баллов).`),
  );

  return {
    score,
    readinessLevel,
    details,
    missing,
    suggestions,
  };
}
