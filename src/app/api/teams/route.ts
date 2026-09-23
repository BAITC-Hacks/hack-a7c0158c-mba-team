import { NextResponse } from "next/server";
import { listTeams } from "@/lib/app-db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(listTeams(), { headers: { "Cache-Control": "no-store" } });
}
