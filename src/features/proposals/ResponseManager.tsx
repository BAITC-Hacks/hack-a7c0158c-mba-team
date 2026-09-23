"use client";

import { getProposals, setProposalStatus } from "@/lib/storage";
import { useSharedCollection } from "@/lib/use-shared-collection";
import { useState } from "react";

const statusLabels = { pending: "На рассмотрении", selected: "Выбрана", rejected: "Отклонена" };

export function ResponseManager({ taskId }: { taskId: string }) {
  const allProposals = useSharedCollection(getProposals);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const proposals = allProposals.filter((proposal) => proposal.taskId === taskId);

  async function decide(proposalId: string, status: "selected" | "rejected") {
    setBusyId(proposalId);
    setError("");
    try {
      await setProposalStatus(proposalId, status);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить решение.");
    } finally {
      setBusyId("");
    }
  }

  if (proposals.length === 0) {
    return <p className="placeholder">Пока нет откликов. Когда команда отправит предложение, оно появится здесь.</p>;
  }

  return (
    <div className="proposal-list">
      {error && <p className="task-error" role="alert">{error}</p>}
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
              <button className="button" disabled={busyId === proposal.id} onClick={() => void decide(proposal.id, "selected")}>Выбрать команду</button>
              <button className="button button-secondary" disabled={busyId === proposal.id} onClick={() => void decide(proposal.id, "rejected")}>Отклонить</button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
