import type { ReadinessLevel, TaskFields } from "./types";

const criteria = [
  { key: "contextNeed", weight: 20, label: "Контекст и потребность", fields: ["context", "need"] },
  { key: "dataMaterials", weight: 20, label: "Данные и материалы", fields: ["dataMaterials"] },
  { key: "expectedOutcome", weight: 15, label: "Ожидаемый результат", fields: ["expectedOutcome"] },
  { key: "successCriteria", weight: 15, label: "Критерии успеха", fields: ["successCriteria"] },
  { key: "constraints", weight: 10, label: "Ограничения", fields: ["constraints"] },
  { key: "users", weight: 10, label: "Пользователи", fields: ["users"] },
  { key: "businessContact", weight: 10, label: "Связь с бизнесом", fields: ["contact", "interactionFormat"] },
] as const;

export function scoreTask(task: TaskFields) {
  const details = criteria.map(({ key, weight, label, fields }) => ({
    key,
    label,
    points: fields.every((field) => task[field as keyof TaskFields].trim()) ? weight : 0,
    maxPoints: weight,
  }));
  const score = details.reduce((sum, item) => sum + item.points, 0);
  const readinessLevel: ReadinessLevel = score < 40 ? "draft" : score < 70 ? "working" : score < 90 ? "ready" : "priority";

  return {
    score,
    readinessLevel,
    details,
    missing: details.filter((item) => item.points === 0).map((item) => item.label),
  };
}
