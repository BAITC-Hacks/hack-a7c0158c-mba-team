import type { BusinessTask, Proposal, ProposalStatus, TaskFields, TeamProfile } from "@/features/tasks/types";

export const STORAGE_KEYS = {
  tasks: "ai-sana:tasks",
  teams: "ai-sana:teams",
  proposals: "ai-sana:proposals",
  demoSeeded: "ai-sana:demo-seeded",
  sharedMigrated: "ai-sana:shared-migrated-v1",
} as const;

const CHANGE_EVENT = "ai-sana:shared-data-change";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
      ? result.error
      : "Не удалось выполнить запрос к серверу.";
    throw new Error(message);
  }
  return result as T;
}

function notifyChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

export async function getTasks() {
  return requestJson<BusinessTask[]>("/api/tasks");
}

export async function getTask(id: string) {
  return requestJson<BusinessTask>(`/api/tasks/${encodeURIComponent(id)}`);
}

export async function createTask(fields: TaskFields) {
  const task = await requestJson<BusinessTask>("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  notifyChange();
  return task;
}

export async function updateTask(id: string, fields: TaskFields) {
  const task = await requestJson<BusinessTask>(`/api/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  notifyChange();
  return task;
}

export async function getTeams() {
  return requestJson<TeamProfile[]>("/api/teams");
}

export async function getProposals() {
  return requestJson<Proposal[]>("/api/proposals");
}

export async function createProposal(input: Omit<Proposal, "id" | "createdAt" | "status">) {
  const proposal = await requestJson<Proposal>("/api/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  notifyChange();
  return proposal;
}

export async function setProposalStatus(id: string, status: ProposalStatus) {
  const proposal = await requestJson<Proposal>(`/api/proposals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  notifyChange();
  return proposal;
}

export function subscribeToStorageChanges(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("focus", onChange);
  };
}
