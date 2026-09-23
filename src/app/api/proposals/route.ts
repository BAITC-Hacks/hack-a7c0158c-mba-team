import { NextResponse } from "next/server";
import { createProposal, getProposals, getTasks } from "@/lib/app-db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getProposals());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.taskId !== "string" || typeof body.teamName !== "string" || typeof body.idea !== "string" || typeof body.plan !== "string" || typeof body.timeline !== "string" || typeof body.prototypeUrl !== "string") {
    return NextResponse.json({ error: "Заполните название команды, идею, план и срок." }, { status: 400 });
  }
  const task = getTasks().find((item) => item.id === body.taskId && item.status === "published");
  if (!task) return NextResponse.json({ error: "Опубликованная задача не найдена." }, { status: 404 });
  const teamName = body.teamName.trim();
  const idea = body.idea.trim();
  const plan = body.plan.trim();
  const timeline = body.timeline.trim();
  const prototypeUrl = body.prototypeUrl.trim();
  if (!teamName || teamName.length > 80 || !idea || idea.length > 1200 || !plan || plan.length > 1200 || !timeline || timeline.length > 120 || prototypeUrl.length > 500) {
    return NextResponse.json({ error: "Проверьте длину и заполнение полей отклика." }, { status: 400 });
  }
  if (prototypeUrl) {
    try {
      const url = new URL(prototypeUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    } catch {
      return NextResponse.json({ error: "Ссылка на прототип должна начинаться с http:// или https://." }, { status: 400 });
    }
  }
  const proposal = createProposal({ taskId: task.id, teamId: teamName.toLocaleLowerCase("ru-RU").replaceAll(/\s+/g, "-"), teamName, idea, plan, timeline, prototypeUrl });
  return NextResponse.json(proposal, { status: 201 });
}
