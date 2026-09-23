import { NextResponse } from "next/server";
import { scoreTask } from "@/features/tasks/scoring";
import type { TaskFields } from "@/features/tasks/types";
import { getTasks, saveTask } from "@/lib/app-db";

export const runtime = "nodejs";

const fieldKeys: (keyof TaskFields)[] = ["title", "industry", "context", "need", "users", "dataMaterials", "constraints", "expectedOutcome", "successCriteria", "contact", "interactionFormat"];

function parseFields(body: unknown): TaskFields | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  if (!fieldKeys.every((key) => typeof value[key] === "string" && (value[key] as string).length <= 2000)) return null;
  const fields = Object.fromEntries(fieldKeys.map((key) => [key, (value[key] as string).trim()])) as TaskFields;
  return fields.title && fields.industry ? fields : null;
}

export async function PUT(request: Request, context: RouteContext<"/api/tasks/[taskId]">) {
  const { taskId } = await context.params;
  const existing = getTasks().find((task) => task.id === taskId);
  if (!existing) return NextResponse.json({ error: "Задача не найдена." }, { status: 404 });
  const fields = parseFields(await request.json().catch(() => null));
  if (!fields) return NextResponse.json({ error: "Проверьте заполнение полей карточки." }, { status: 400 });
  const score = scoreTask(fields);
  const task = saveTask({ ...fields, id: taskId, score: score.score, readinessLevel: score.readinessLevel, status: "published", confirmedAt: new Date().toISOString() });
  return NextResponse.json(task);
}
