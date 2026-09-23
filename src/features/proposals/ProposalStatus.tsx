"use client";

import Link from "next/link";
import { getProposals } from "@/lib/storage";
import { useSharedCollection } from "@/lib/use-shared-collection";

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
    title: "Отклик отклонён",
    description: "Спасибо за предложение. Можно вернуться в каталог и откликнуться на другую задачу.",
  },
} as const;

export function ProposalStatus({ taskId, proposalId }: { taskId: string; proposalId: string }) {
  const proposals = useSharedCollection(getProposals);
  const proposal = proposals.find((item) => item.id === proposalId && item.taskId === taskId);

  if (!proposal) {
    return (
      <div className="placeholder">
        <p>Отклик пока не найден.</p>
        <p className="muted">Проверьте ссылку или обновите страницу через несколько секунд.</p>
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
      <Link className="text-link" href="/catalog">Вернуться в каталог</Link>
    </article>
  );
}
