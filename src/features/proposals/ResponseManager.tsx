"use client";

import { useState, type FormEvent } from "react";
import type { Proposal, ProposalStatus } from "@/features/tasks/types";
import { notifyServerCollectionChanged, useServerCollection } from "@/lib/use-server-collection";

const statusLabels = { pending: "На рассмотрении", selected: "Выбрана", rejected: "Отклонена" };

export function ResponseManager({ taskId }: { taskId: string }) {
  const allProposals = useServerCollection<Proposal>("proposals");
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
          <ProposalDecision proposal={proposal} />
        </article>
      ))}
    </div>
  );
}

function ProposalDecision({ proposal }: { proposal: Proposal }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const milestones = proposal.milestones ?? [];
  const progressPoints = milestones.reduce((total, milestone) => total + milestone.points, 0);

  async function updateStatus(status: ProposalStatus) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить решение.");
      notifyServerCollectionChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить решение.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneTitle }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось подтвердить этап.");
      setMilestoneTitle("");
      notifyServerCollectionChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось подтвердить этап.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {proposal.status === "pending" && (
        <div className="actions">
          <button className="button" disabled={busy} onClick={() => void updateStatus("selected")}>Выбрать команду</button>
          <button className="button button-secondary" disabled={busy} onClick={() => void updateStatus("rejected")}>Отклонить</button>
        </div>
      )}
      {proposal.status === "selected" && (
        <section className="proposal-progress" aria-label="Подтверждение прогресса команды">
          <h3>Прогресс команды · {progressPoints} баллов</h3>
          <p className="muted">За каждый вручную подтверждённый этап начисляется 10 баллов.</p>
          {milestones.length > 0 && (
            <ul>
              {milestones.map((milestone) => (
                <li key={milestone.id}>{milestone.title} <strong>+{milestone.points}</strong> <span className="muted">· {new Date(milestone.confirmedAt).toLocaleDateString("ru-RU")}</span></li>
              ))}
            </ul>
          )}
          <form className="proposal-milestone-form" onSubmit={confirmMilestone}>
            <label>Подтвердить выполненный этап
              <input value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} required minLength={3} maxLength={120} placeholder="Например, согласован прототип" />
            </label>
            <button className="button button-secondary" disabled={busy || milestoneTitle.trim().length < 3}>Подтвердить этап · +10</button>
          </form>
        </section>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </>
  );
}
