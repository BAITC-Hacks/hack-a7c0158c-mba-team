"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createProposal } from "@/lib/storage";

export function ProposalForm({ taskId }: { taskId: string }) {
  const [error, setError] = useState("");
  const [proposalId, setProposalId] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const teamName = String(formData.get("teamName") ?? "").trim();
    const idea = String(formData.get("idea") ?? "").trim();
    const plan = String(formData.get("plan") ?? "").trim();
    const timeline = String(formData.get("timeline") ?? "").trim();
    const prototypeUrl = String(formData.get("prototypeUrl") ?? "").trim();

    if (!teamName || !idea || !plan || !timeline) {
      setError("Заполните название команды, идею, план и срок.");
      return;
    }

    if (prototypeUrl) {
      try {
        const url = new URL(prototypeUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsupported URL protocol");
      } catch {
        setError("Ссылка на прототип должна начинаться с http:// или https://.");
        return;
      }
    }

    const proposal = createProposal({
      taskId,
      teamId: teamName.toLocaleLowerCase("ru-RU").replaceAll(/\s+/g, "-"),
      teamName,
      idea,
      plan,
      timeline,
      prototypeUrl,
    });
    setError("");
    setProposalId(proposal.id);
    event.currentTarget.reset();
  }

  if (proposalId) {
    return (
      <div className="success-message" role="status">
        <p>Отклик отправлен бизнесу.</p>
        <div className="actions">
          <Link className="button" href={`/catalog/${taskId}/responses/${proposalId}`}>Проверить статус</Link>
          <button className="button button-secondary" type="button" onClick={() => setProposalId("")}>Отправить ещё один</button>
        </div>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <label>Название команды<input name="teamName" required maxLength={80} /></label>
      <label>Идея решения<textarea name="idea" required rows={3} maxLength={1200} /></label>
      <label>План работы<textarea name="plan" required rows={3} maxLength={1200} /></label>
      <label>Предполагаемый срок<input name="timeline" required maxLength={120} placeholder="Например, 2 недели" /></label>
      <label>Ссылка на прототип, если есть<input name="prototypeUrl" type="url" placeholder="https://…" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" type="submit">Отправить отклик</button>
    </form>
  );
}
