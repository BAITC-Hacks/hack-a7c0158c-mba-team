import "server-only";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import type { BusinessTask, Proposal, ProposalStatus, ProgressMilestone, TeamProfile } from "@/features/tasks/types";
import { demoProposals, demoTasks, demoTeams } from "@/lib/demo-data";

const dataDirectory = join(process.cwd(), "data");
mkdirSync(dataDirectory, { recursive: true });
const db = new Database(join(dataDirectory, "ai-sana.db"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS app_tasks (id TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS app_teams (id TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS app_proposals (id TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

const seed = db.transaction(() => {
  const insertTask = db.prepare("INSERT OR IGNORE INTO app_tasks (id, value) VALUES (?, ?)");
  const insertTeam = db.prepare("INSERT OR IGNORE INTO app_teams (id, value) VALUES (?, ?)");
  const insertProposal = db.prepare("INSERT OR IGNORE INTO app_proposals (id, value) VALUES (?, ?)");
  for (const task of demoTasks) insertTask.run(task.id, JSON.stringify(task));
  for (const team of demoTeams) insertTeam.run(team.id, JSON.stringify(team));
  for (const proposal of demoProposals) insertProposal.run(proposal.id, JSON.stringify(proposal));
});

export function ensureDemoData() {
  seed();
}

function readCollection<T>(table: "app_tasks" | "app_teams" | "app_proposals"): T[] {
  ensureDemoData();
  return (db.prepare(`SELECT value FROM ${table}`).all() as { value: string }[])
    .map(({ value }) => JSON.parse(value) as T);
}

export function getTasks() { return readCollection<BusinessTask>("app_tasks"); }
export function getTeams() { return readCollection<TeamProfile>("app_teams"); }
export function getProposals() { return readCollection<Proposal>("app_proposals"); }

export function saveTask(task: BusinessTask) {
  db.prepare("INSERT INTO app_tasks (id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value")
    .run(task.id, JSON.stringify(task));
  return task;
}

export function createProposal(input: Omit<Proposal, "id" | "createdAt" | "status" | "milestones">) {
  const proposal: Proposal = { ...input, id: randomUUID(), createdAt: new Date().toISOString(), status: "pending", milestones: [] };
  db.prepare("INSERT INTO app_proposals (id, value) VALUES (?, ?)").run(proposal.id, JSON.stringify(proposal));
  return proposal;
}

export function updateProposalStatus(id: string, status: ProposalStatus) {
  const proposal = getProposal(id);
  if (!proposal) return null;
  const updated = { ...proposal, status };
  db.prepare("UPDATE app_proposals SET value = ? WHERE id = ?").run(JSON.stringify(updated), id);
  return updated;
}

export function addProposalMilestone(id: string, title: string): Proposal | null {
  const proposal = getProposal(id);
  if (!proposal || proposal.status !== "selected") return null;
  const milestone: ProgressMilestone = { id: randomUUID(), title, points: 10, confirmedAt: new Date().toISOString() };
  const updated = { ...proposal, milestones: [...(proposal.milestones ?? []), milestone] };
  db.prepare("UPDATE app_proposals SET value = ? WHERE id = ?").run(JSON.stringify(updated), id);
  return updated;
}

export function getProposal(id: string) {
  ensureDemoData();
  const row = db.prepare("SELECT value FROM app_proposals WHERE id = ?").get(id) as { value: string } | undefined;
  return row ? JSON.parse(row.value) as Proposal : null;
}
