"use client";

import Link from "next/link";
import type { Proposal } from "@/features/tasks/types";
import { useServerCollection } from "@/lib/use-server-collection";

const statusContent = {
  pending: {
    title: "Отклик рассматривается",
    description: "Бизнес ещё не принял решение. Вернитесь позже, чтобы проверить статус.",
  },
  selected: {
    title: "Ваше предложение выбрано",
    description: "Бизнес выбрал вашу команду для дальнейшей работы. Свяжитесь с представителем по контактам в карточке задачи.",
  },
  rejected: {
    title: "Бизнес выбрал другое решение",
    description: "Спасибо за предложение. Можно вернуться в каталог и откликнуться на другую задачу.",
  },
} as const;

export function ProposalStatus({ taskId, proposalId }: { taskId: string; proposalId: string }) {
  const proposals = useServerCollection<Proposal>("proposals");
  const proposal = proposals.find((item) => item.id === proposalId && item.taskId === taskId);

  if (!proposal) {
    return (
      <div className="placeholder">
        <p>Отклик не найден.</p>
        <p className="muted">Проверьте ссылку или вернитесь в каталог и откройте статус из подтверждения отправки.</p>
      </div>
    );
  }

  const content = statusContent[proposal.status];

  return (
    <article className="proposal-card">
      <div className="proposal-heading">
        <h2>{content.title}</h2>
        <span className={`status-pill status-${proposal.status}`}>{proposal.status === "pending" ? "На рассмотрении" : proposal.status === "selected" ? "Выбрана" : "Отклонена"}</span>
      </div>
      <p>{content.description}</p>
      <p><strong>Команда:</strong> {proposal.teamName}</p>
      <p><strong>Идея:</strong> {proposal.idea}</p>
      {proposal.status === "selected" && (
        <section className="proposal-progress">
          <h3>Подтверждённый прогресс · {(proposal.milestones ?? []).reduce((total, item) => total + item.points, 0)} баллов</h3>
          {(proposal.milestones ?? []).length === 0 ? <p className="muted">Бизнес пока не подтвердил этапы.</p> : (
            <ul>{proposal.milestones?.map((milestone) => <li key={milestone.id}>{milestone.title} <strong>+{milestone.points}</strong></li>)}</ul>
          )}
        </section>
      )}
      <Link className="text-link" href="/catalog">Вернуться в каталог</Link>
    </article>
  );
}
