import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/auth-db";
import { getTask, normalizeTaskFields, updateTask } from "@/lib/app-db";

export const runtime = "nodejs";
type RouteParams = { params: Promise<{ taskId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { taskId } = await params;
  const task = getTask(taskId);
  if (!task) return NextResponse.json({ error: "Задача не найдена." }, { status: 404 });
  return NextResponse.json(task, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { taskId } = await params;
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!consumeRateLimit(`task-update:${client}`, 60, 10 * 60_000)) {
    return NextResponse.json({ error: "Слишком много изменений карточек. Повторите позже." }, { status: 429 });
  }
  const body = await request.json().catch(() => null) as { fields?: unknown } | null;
  const fields = normalizeTaskFields(body?.fields);
  if (!fields) return NextResponse.json({ error: "Проверьте обязательные поля карточки." }, { status: 400 });

  const task = updateTask(taskId, fields);
  if (!task) return NextResponse.json({ error: "Опубликованная задача не найдена." }, { status: 404 });
  return NextResponse.json(task);
}
