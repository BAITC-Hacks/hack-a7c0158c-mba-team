"use client";

import { getProposals, setProposalStatus } from "@/lib/storage";
import { useLocalCollection } from "@/lib/use-local-collection";

const statusLabels = { pending: "На рассмотрении", selected: "Выбрана", rejected: "Отклонена" };

export function ResponseManager({ taskId }: { taskId: string }) {
  const allProposals = useLocalCollection(getProposals);
  const proposals = allProposals.filter((proposal) => proposal.taskId === taskId);

  if (proposals.length === 0) {
    return <p className="placeholder">Пока нет откликов. Когда команда отправит предложение, оно появится здесь.</p>;
  }

  return (
    <div className="proposal-list">
      {proposals.map((proposal) => (
        <article className="proposal-card" key={proposal.id}>
          <div className="proposal-heading">
            <h2>{proposal.teamName}</h2>
            <span className={`status-pill status-${proposal.status}`}>{statusLabels[proposal.status]}</span>
          </div>
          <p><strong>Идея решения</strong><br />{proposal.idea}</p>
          <p><strong>План</strong><br />{proposal.plan}</p>
          <p><strong>Срок</strong><br />{proposal.timeline}</p>
          {proposal.prototypeUrl && <p><a className="text-link" href={proposal.prototypeUrl} target="_blank" rel="noreferrer">Открыть прототип</a></p>}
          <p className="muted">Отправлено: {new Date(proposal.createdAt).toLocaleString("ru-RU")}</p>
          {proposal.status === "pending" && (
            <div className="actions">
              <button className="button" onClick={() => setProposalStatus(proposal.id, "selected")}>Выбрать команду</button>
              <button className="button button-secondary" onClick={() => setProposalStatus(proposal.id, "rejected")}>Отклонить</button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
