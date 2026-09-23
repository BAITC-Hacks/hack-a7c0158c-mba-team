"use client";

import Link from "next/link";
import { getProposals } from "@/lib/storage";
import { useLocalCollection } from "@/lib/use-local-collection";

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
  const proposals = useLocalCollection(getProposals);
  const proposal = proposals.find((item) => item.id === proposalId && item.taskId === taskId);

  if (!proposal) {
    return (
      <div className="placeholder">
        <p>Отклик не найден в этом браузере.</p>
        <p className="muted">В MVP данные хранятся локально, поэтому статус доступен на устройстве, где был отправлен отклик.</p>
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
