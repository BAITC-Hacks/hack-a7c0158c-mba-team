import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { scoreTask } from "@/features/tasks/scoring";
import type { TaskFields } from "@/features/tasks/types";
import { getTasks, saveTask } from "@/lib/app-db";

export const runtime = "nodejs";

function parseFields(body: unknown): TaskFields | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  const keys: (keyof TaskFields)[] = ["title", "industry", "context", "need", "users", "dataMaterials", "constraints", "expectedOutcome", "successCriteria", "contact", "interactionFormat"];
  if (!keys.every((key) => typeof value[key] === "string" && (value[key] as string).length <= 2000)) return null;
  const fields = Object.fromEntries(keys.map((key) => [key, (value[key] as string).trim()])) as TaskFields;
  return fields.title && fields.industry ? fields : null;
}

export async function GET() {
  return NextResponse.json(getTasks());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fields = parseFields(body);
  if (!fields) return NextResponse.json({ error: "Проверьте заполнение полей карточки." }, { status: 400 });
  const bodyId = typeof body === "object" && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>).id : undefined;
  const id = typeof bodyId === "string" && bodyId.length <= 100 ? bodyId : randomUUID();
  const score = scoreTask(fields);
  const task = saveTask({ ...fields, id, score: score.score, readinessLevel: score.readinessLevel, status: "published", confirmedAt: new Date().toISOString() });
  return NextResponse.json(task, { status: 201 });
}
