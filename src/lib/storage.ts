/** Browser-only storage for the hackathon demo. Replace with a shared database if the demo needs multiple devices. */
import type { BusinessTask, Proposal, ProposalStatus, TeamProfile } from "@/features/tasks/types";

export const STORAGE_KEYS = {
  tasks: "ai-sana:tasks",
  teams: "ai-sana:teams",
  proposals: "ai-sana:proposals",
  demoSeeded: "ai-sana:demo-seeded",
} as const;

const CHANGE_EVENT = "ai-sana:storage-change";

function readCollection<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value as T[] : [];
  } catch {
    return [];
  }
}

function writeCollection<T>(key: string, values: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(values));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getTasks() {
  return readCollection<BusinessTask>(STORAGE_KEYS.tasks);
}

export function saveTasks(tasks: BusinessTask[]) {
  writeCollection(STORAGE_KEYS.tasks, tasks);
}

export function saveTask(task: BusinessTask) {
  const tasks = getTasks();
  const index = tasks.findIndex((item) => item.id === task.id);
  if (index === -1) tasks.push(task);
  else tasks[index] = task;
  saveTasks(tasks);
}

export function getTeams() {
  return readCollection<TeamProfile>(STORAGE_KEYS.teams);
}

export function saveTeams(teams: TeamProfile[]) {
  writeCollection(STORAGE_KEYS.teams, teams);
}

export function getProposals() {
  return readCollection<Proposal>(STORAGE_KEYS.proposals);
}

export function saveProposals(proposals: Proposal[]) {
  writeCollection(STORAGE_KEYS.proposals, proposals);
}

export function createProposal(input: Omit<Proposal, "id" | "createdAt" | "status">) {
  const proposal: Proposal = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  writeCollection(STORAGE_KEYS.proposals, [...getProposals(), proposal]);
  return proposal;
}

export function setProposalStatus(id: string, status: ProposalStatus) {
  const proposals = getProposals();
  const updated = proposals.map((proposal) =>
    proposal.id === id ? { ...proposal, status } : proposal,
  );
  if (updated.some((proposal, index) => proposal !== proposals[index])) {
    writeCollection(STORAGE_KEYS.proposals, updated);
  }
}

export function subscribeToStorageChanges(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function hasDemoSeed() {
  return typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEYS.demoSeeded) === "true";
}

export function markDemoSeeded() {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEYS.demoSeeded, "true");
}
