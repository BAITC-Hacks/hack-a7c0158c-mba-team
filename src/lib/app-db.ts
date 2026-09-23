import "server-only";

import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { scoreTask } from "@/features/tasks/scoring";
import type { BusinessTask, Proposal, ProposalStatus, TaskFields, TeamProfile } from "@/features/tasks/types";
import { demoProposals, demoTasks, demoTeams } from "@/lib/demo-data";

const dataDirectory = process.env.AI_SANA_DATA_DIR || join(process.cwd(), "data");
mkdirSync(dataDirectory, { recursive: true });

const db = new Database(join(dataDirectory, "ai-sana.db"));
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.exec(`
  CREATE TABLE IF NOT EXISTS app_tasks (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS app_teams (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS app_proposals (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
`);

const insertTask = db.prepare("INSERT OR IGNORE INTO app_tasks (id, payload) VALUES (?, ?)");
const insertTeam = db.prepare("INSERT OR IGNORE INTO app_teams (id, payload) VALUES (?, ?)");
const insertProposal = db.prepare("INSERT OR IGNORE INTO app_proposals (id, payload) VALUES (?, ?)");

for (const task of demoTasks) insertTask.run(task.id, JSON.stringify(task));
for (const team of demoTeams) insertTeam.run(team.id, JSON.stringify(team));
for (const proposal of demoProposals) insertProposal.run(proposal.id, JSON.stringify(proposal));

const taskKeys: (keyof TaskFields)[] = [
  "title", "industry", "context", "need", "users", "dataMaterials", "constraints",
  "expectedOutcome", "successCriteria", "contact", "interactionFormat",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeTaskFields(value: unknown): TaskFields | null {
  if (!isRecord(value) || !taskKeys.every((key) => typeof value[key] === "string")) return null;
  const fields = Object.fromEntries(taskKeys.map((key) => [key, (value[key] as string).trim()])) as TaskFields;
  if (!fields.title || !fields.industry || fields.title.length > 120 || fields.industry.length > 120) return null;
  if (taskKeys.some((key) => key !== "title" && key !== "industry" && fields[key].length > 2000)) return null;
  return fields;
}

// Recompute saved scores when rating rules change, including rows from the previous scoring version.
const savedTaskRows = db.prepare("SELECT id, payload FROM app_tasks").all() as { id: string; payload: string }[];
const updateSavedTask = db.prepare("UPDATE app_tasks SET payload = ? WHERE id = ?");
for (const row of savedTaskRows) {
  try {
    const saved = JSON.parse(row.payload) as BusinessTask;
    const fields = normalizeTaskFields(saved);
    if (!fields || (saved.status !== "draft" && saved.status !== "published")) continue;
    const { score, readinessLevel } = scoreTask(fields);
    if (saved.score !== score || saved.readinessLevel !== readinessLevel) {
      updateSavedTask.run(JSON.stringify({ ...saved, ...fields, score, readinessLevel }), row.id);
    }
  } catch {
    // Ignore one malformed legacy row rather than making all API routes unavailable.
  }
}

function readRows<T>(table: "app_tasks" | "app_teams" | "app_proposals"): T[] {
  const rows = db.prepare(`SELECT payload FROM ${table} ORDER BY rowid DESC`).all() as { payload: string }[];
  return rows.flatMap(({ payload }) => {
    try {
      return [JSON.parse(payload) as T];
    } catch {
      return [];
    }
  });
}

export function listTasks() {
  return readRows<BusinessTask>("app_tasks").filter((task) => task.status === "published");
}

export function getTask(id: string) {
  const row = db.prepare("SELECT payload FROM app_tasks WHERE id = ?").get(id) as { payload: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.payload) as BusinessTask;
  } catch {
    return null;
  }
}

export function createTask(fields: TaskFields) {
  const { score, readinessLevel } = scoreTask(fields);
  const task: BusinessTask = {
    ...fields,
    id: randomUUID(),
    score,
    readinessLevel,
    status: "published",
    confirmedAt: new Date().toISOString(),
  };
  db.prepare("INSERT INTO app_tasks (id, payload) VALUES (?, ?)").run(task.id, JSON.stringify(task));
  return task;
}

export function updateTask(id: string, fields: TaskFields) {
  const current = getTask(id);
  if (!current || current.status !== "published") return null;
  const { score, readinessLevel } = scoreTask(fields);
  const task: BusinessTask = {
    ...fields,
    id,
    score,
    readinessLevel,
    status: "published",
    confirmedAt: new Date().toISOString(),
  };
  db.prepare("UPDATE app_tasks SET payload = ? WHERE id = ?").run(JSON.stringify(task), id);
  return task;
}

export function listTeams() {
  return readRows<TeamProfile>("app_teams");
}

export function listProposals() {
  return readRows<Proposal>("app_proposals");
}

export function getProposal(id: string) {
  const row = db.prepare("SELECT payload FROM app_proposals WHERE id = ?").get(id) as { payload: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.payload) as Proposal;
  } catch {
    return null;
  }
}

export function createProposal(input: Omit<Proposal, "id" | "createdAt" | "status">) {
  const proposal: Proposal = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  db.prepare("INSERT INTO app_proposals (id, payload) VALUES (?, ?)").run(proposal.id, JSON.stringify(proposal));
  return proposal;
}

export function setProposalStatus(id: string, status: ProposalStatus) {
  const decide = db.transaction(() => {
    const current = getProposal(id);
    if (!current || current.status !== "pending") return null;
    const proposal = { ...current, status };
    db.prepare("UPDATE app_proposals SET payload = ? WHERE id = ?").run(JSON.stringify(proposal), id);
    return proposal;
  });
  return decide.immediate();
}

function normalizeTeam(value: unknown): TeamProfile | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  const arrays = [value.interests, value.skills, value.technologies];
  if (arrays.some((items) => !Array.isArray(items) || items.length > 20 || !items.every((item) => typeof item === "string" && item.length <= 100))) return null;
  return {
    id: value.id.slice(0, 100),
    name: value.name.trim().slice(0, 80),
    interests: value.interests as string[],
    skills: value.skills as string[],
    technologies: value.technologies as string[],
  };
}

function normalizeProposal(value: unknown): Proposal | null {
  if (!isRecord(value)) return null;
  const stringKeys = ["id", "taskId", "teamId", "teamName", "idea", "plan", "timeline", "prototypeUrl", "createdAt"] as const;
  if (!stringKeys.every((key) => typeof value[key] === "string")) return null;
  if (value.status !== "pending" && value.status !== "selected" && value.status !== "rejected") return null;
  const proposal = value as unknown as Proposal;
  if (!getTask(proposal.taskId) || !proposal.teamName.trim() || !proposal.idea.trim() || !proposal.plan.trim() || !proposal.timeline.trim()) return null;
  if (proposal.idea.length > 1200 || proposal.plan.length > 1200 || proposal.timeline.length > 120) return null;
  if (proposal.prototypeUrl) {
    try {
      const url = new URL(proposal.prototypeUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    } catch {
      return null;
    }
  }
  return proposal;
}

export function importLegacyData(input: { tasks: unknown[]; teams: unknown[]; proposals: unknown[] }) {
  let importedTasks = 0;
  let importedTeams = 0;
  let importedProposals = 0;
  const transaction = db.transaction(() => {
    for (const rawTask of input.tasks) {
      if (!isRecord(rawTask) || typeof rawTask.id !== "string") continue;
      const fields = normalizeTaskFields(rawTask);
      if (!fields || (rawTask.status !== "draft" && rawTask.status !== "published")) continue;
      const { score, readinessLevel } = scoreTask(fields);
      const task: BusinessTask = {
        ...fields,
        id: rawTask.id.slice(0, 100),
        score,
        readinessLevel,
        status: rawTask.status,
        confirmedAt: typeof rawTask.confirmedAt === "string" ? rawTask.confirmedAt : undefined,
      };
      importedTasks += insertTask.run(task.id, JSON.stringify(task)).changes;
    }
    for (const rawTeam of input.teams) {
      const team = normalizeTeam(rawTeam);
      if (team) importedTeams += insertTeam.run(team.id, JSON.stringify(team)).changes;
    }
    for (const rawProposal of input.proposals) {
      const proposal = normalizeProposal(rawProposal);
      if (proposal) importedProposals += insertProposal.run(proposal.id, JSON.stringify(proposal)).changes;
    }
  });
  transaction();
  return { tasks: importedTasks, teams: importedTeams, proposals: importedProposals };
}
