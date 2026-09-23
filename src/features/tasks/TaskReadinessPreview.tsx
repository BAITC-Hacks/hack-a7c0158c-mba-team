"use client";

import { READINESS_LABELS, scoreTask } from "@/features/tasks/scoring";
import type { TaskFields } from "@/features/tasks/types";

export function TaskReadinessPreview({ task }: { task: TaskFields }) {
  const result = scoreTask(task);

  return (
    <aside className="task-score-preview" aria-live="polite" aria-label="Предпросмотр рейтинга готовности">
      <div className="score-row">
        <strong>{result.score}<span>/100</span></strong>
        <span>{READINESS_LABELS[result.readinessLevel]} · рейтинг обновляется при редактировании</span>
      </div>
      <div className="score-track" role="progressbar" aria-label="Предварительный рейтинг готовности" aria-valuemin={0} aria-valuemax={100} aria-valuenow={result.score}>
        <span style={{ width: `${result.score}%` }} />
      </div>
      <div className="score-breakdown">
        <p className="score-breakdown-title">Баллы по критериям</p>
        {result.details.map((item) => (
          <div className="score-detail-row" key={item.key}>
            <span>{item.label}</span><span>{item.points}/{item.maxPoints}</span>
          </div>
        ))}
      </div>
      {result.suggestions.length > 0 ? (
        <details className="score-details" open>
          <summary>Что повысит рейтинг ({result.suggestions.length})</summary>
          <ul>{result.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul>
        </details>
      ) : (
        <p className="task-score-complete">Все критерии заполнены. Перед публикацией проверьте, что сведения точны.</p>
      )}
      <p className="task-score-note">Предпросмотр не публикует карточку. Итоговый рейтинг фиксируется после вашего подтверждения.</p>
    </aside>
  );
}
