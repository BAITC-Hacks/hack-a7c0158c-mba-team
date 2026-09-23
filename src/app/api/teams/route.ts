import { NextResponse } from "next/server";
import { getTeams } from "@/lib/app-db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getTeams());
}
