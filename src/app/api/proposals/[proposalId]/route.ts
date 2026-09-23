import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/auth-db";
import { setProposalStatus } from "@/lib/app-db";
import type { ProposalStatus } from "@/features/tasks/types";

export const runtime = "nodejs";
type RouteParams = { params: Promise<{ proposalId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { proposalId } = await params;
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!consumeRateLimit(`proposal-decision:${client}`, 60, 10 * 60_000)) {
    return NextResponse.json({ error: "Слишком много решений по откликам. Повторите позже." }, { status: 429 });
  }
  const body = await request.json().catch(() => null) as { status?: unknown } | null;
  if (body?.status !== "selected" && body?.status !== "rejected") {
    return NextResponse.json({ error: "Выберите отклик или отклоните его." }, { status: 400 });
  }

  const proposal = setProposalStatus(proposalId, body.status as ProposalStatus);
  if (!proposal) return NextResponse.json({ error: "Отклик уже обработан или не найден." }, { status: 409 });
  return NextResponse.json(proposal);
}
