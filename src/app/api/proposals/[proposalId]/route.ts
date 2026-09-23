import { NextResponse } from "next/server";
import { addProposalMilestone, updateProposalStatus } from "@/lib/app-db";
import type { ProposalStatus } from "@/features/tasks/types";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: RouteContext<"/api/proposals/[proposalId]">) {
  const { proposalId } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });

  if (body.status === "pending" || body.status === "selected" || body.status === "rejected") {
    const proposal = updateProposalStatus(proposalId, body.status as ProposalStatus);
    return proposal ? NextResponse.json(proposal) : NextResponse.json({ error: "Отклик не найден." }, { status: 404 });
  }

  if (typeof body.milestoneTitle === "string") {
    const title = body.milestoneTitle.trim();
    if (title.length < 3 || title.length > 120) return NextResponse.json({ error: "Опишите этап (от 3 до 120 символов)." }, { status: 400 });
    const proposal = addProposalMilestone(proposalId, title);
    return proposal ? NextResponse.json(proposal) : NextResponse.json({ error: "Сначала бизнес должен выбрать предложение." }, { status: 409 });
  }

  return NextResponse.json({ error: "Неизвестное изменение отклика." }, { status: 400 });
}
