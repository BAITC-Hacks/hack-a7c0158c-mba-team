import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/auth-db";
import { createTask, listTasks, normalizeTaskFields } from "@/lib/app-db";

export const runtime = "nodejs";

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function GET() {
  return NextResponse.json(listTasks(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!consumeRateLimit(`task-create:${clientKey(request)}`, 20, 60 * 60_000)) {
    return NextResponse.json({ error: "Слишком много задач. Повторите позже." }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as { fields?: unknown } | null;
  const fields = normalizeTaskFields(body?.fields);
  if (!fields) return NextResponse.json({ error: "Проверьте обязательные поля карточки." }, { status: 400 });

  try {
    return NextResponse.json(createTask(fields), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить задачу." }, { status: 500 });
  }
}
