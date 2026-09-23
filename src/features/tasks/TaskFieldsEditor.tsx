"use client";

import type { TaskFields } from "@/features/tasks/types";

const fieldSections: {
  title: string;
  description: string;
  fields: { key: keyof TaskFields; label: string; hint: string; short?: boolean }[];
}[] = [
  {
    title: "О задаче",
    description: "Помогите командам быстро понять проблему и для кого нужно решение.",
    fields: [
      { key: "title", label: "Название задачи", hint: "Коротко и по делу", short: true },
      { key: "industry", label: "Тема или отрасль", hint: "Например: образование, торговля, финансы", short: true },
      { key: "context", label: "Контекст", hint: "Что происходит сейчас?" },
      { key: "need", label: "Потребность или проблема", hint: "Что нужно изменить или решить?" },
      { key: "users", label: "Пользователи", hint: "Для кого создаётся решение?" },
    ],
  },
  {
    title: "Результат и ресурсы",
    description: "Опишите ожидаемый результат, критерии успеха и доступные материалы.",
    fields: [
      { key: "expectedOutcome", label: "Ожидаемый результат", hint: "Что команда должна передать в конце?" },
      { key: "successCriteria", label: "Критерии успеха", hint: "По каким признакам вы примете результат?" },
      { key: "dataMaterials", label: "Данные и материалы", hint: "Какие данные, примеры или источники доступны?" },
      { key: "constraints", label: "Ограничения", hint: "Сроки, технологии, доступы и другие границы" },
    ],
  },
  {
    title: "Связь с бизнесом",
    description: "Укажите, как команда сможет уточнять детали и получать обратную связь.",
    fields: [
      { key: "contact", label: "Контакт со стороны бизнеса", hint: "Имя или роль контактного человека" },
      { key: "interactionFormat", label: "Формат взаимодействия", hint: "Как часто и каким способом команда получит обратную связь?" },
    ],
  },
];

export function TaskFieldsEditor({
  value,
  onChange,
}: {
  value: TaskFields;
  onChange: (key: keyof TaskFields, fieldValue: string) => void;
}) {
  return (
    <div className="task-sections">
      {fieldSections.map((section) => (
        <section className="task-section" key={section.title}>
          <div className="task-section-heading">
            <h3>{section.title}</h3>
            <p>{section.description}</p>
          </div>
          <div className="task-field-grid">
            {section.fields.map(({ key, label, hint, short }) => (
              <label className={`task-field${short ? " task-field-short" : ""}`} key={key}>
                <span>{label}</span>
                {short ? (
                  <input
                    required={key === "title" || key === "industry"}
                    maxLength={120}
                    value={value[key]}
                    onChange={(event) => onChange(key, event.target.value)}
                    placeholder={hint}
                  />
                ) : (
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={value[key]}
                    onChange={(event) => onChange(key, event.target.value)}
                    placeholder={hint}
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
