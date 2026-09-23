import { NextResponse } from "next/server";
import { ensureDemoData } from "@/lib/app-db";

export const runtime = "nodejs";

export async function POST() {
  ensureDemoData();
  return NextResponse.json({ seeded: true });
}
