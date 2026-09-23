"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ProposalStatus } from "@/features/tasks/types";
import { getProposals, getTasks } from "@/lib/storage";
import { useSharedCollection } from "@/lib/use-shared-collection";

const statusLabels: Record<ProposalStatus, string> = {
  pending: "На рассмотрении",
  selected: "Выбраны",
  rejected: "Отклонены",
};

export function BusinessResponsesDashboard() {
  const tasks = useSharedCollection(getTasks);
  const proposals = useSharedCollection(getProposals);
  const counts = useMemo(() => proposals.reduce<Record<ProposalStatus, number>>((result, proposal) => {
    result[proposal.status] += 1;
    return result;
  }, { pending: 0, selected: 0, rejected: 0 }), [proposals]);
  const publishedTasks = tasks.filter((task) => task.status === "published");

  return (
    <>
      <div className="response-summary" aria-label="Сводка откликов">
        <article><span>Всего откликов</span><strong>{proposals.length}</strong></article>
        {(Object.keys(statusLabels) as ProposalStatus[]).map((status) => (
          <article key={status}><span>{statusLabels[status]}</span><strong>{counts[status]}</strong></article>
        ))}
      </div>

      {publishedTasks.length === 0 ? (
        <div className="placeholder">
          <p>Пока нет опубликованных задач.</p>
          <Link className="button" href="/business/new">Создать задачу</Link>
        </div>
      ) : (
        <div className="response-task-list">
          {publishedTasks.map((task) => {
            const taskProposals = proposals.filter((proposal) => proposal.taskId === task.id);
            const pending = taskProposals.filter((proposal) => proposal.status === "pending").length;
            return (
              <article className="response-task-card" key={task.id}>
                <div>
                  <p className="task-industry">{task.industry || "Отрасль не указана"}</p>
                  <h2>{task.title || "Задача без названия"}</h2>
                  <p className="muted">Всего: {taskProposals.length} · На рассмотрении: {pending}</p>
                </div>
                <div className="actions">
                  <Link className="button button-secondary" href={`/business/tasks/${task.id}/edit`}>Изменить карточку</Link>
                  <Link className="button" href={`/business/tasks/${task.id}/responses`}>
                    Смотреть отклики{taskProposals.length ? ` (${taskProposals.length})` : ""}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
