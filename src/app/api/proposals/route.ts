import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/auth-db";
import type { Proposal } from "@/features/tasks/types";
import { createProposal, getTask, listProposals } from "@/lib/app-db";

export const runtime = "nodejs";

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function GET() {
  return NextResponse.json(listProposals(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!consumeRateLimit(`proposal-create:${clientKey(request)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Слишком много откликов. Повторите позже." }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as Partial<Proposal> | null;
  if (!body || typeof body.taskId !== "string" || typeof body.teamId !== "string" ||
    typeof body.teamName !== "string" || typeof body.idea !== "string" || typeof body.plan !== "string" ||
    typeof body.timeline !== "string" || typeof body.prototypeUrl !== "string") {
    return NextResponse.json({ error: "Некорректные данные отклика." }, { status: 400 });
  }

  const task = getTask(body.taskId);
  const teamName = body.teamName.trim();
  const idea = body.idea.trim();
  const plan = body.plan.trim();
  const timeline = body.timeline.trim();
  const prototypeUrl = body.prototypeUrl.trim();
  if (!task || task.status !== "published" || !teamName || teamName.length > 80 || !idea || idea.length > 1200 ||
    !plan || plan.length > 1200 || !timeline || timeline.length > 120) {
    return NextResponse.json({ error: "Проверьте задачу, команду, идею, план и срок." }, { status: 400 });
  }
  if (prototypeUrl) {
    try {
      const url = new URL(prototypeUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsupported URL protocol");
    } catch {
      return NextResponse.json({ error: "Ссылка должна начинаться с http:// или https://." }, { status: 400 });
    }
  }

  const proposal = createProposal({
    taskId: task.id,
    teamId: body.teamId.slice(0, 100),
    teamName,
    idea,
    plan,
    timeline,
    prototypeUrl,
  });
  return NextResponse.json(proposal, { status: 201 });
}
