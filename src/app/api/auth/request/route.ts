import { NextResponse } from "next/server";
import { AuthMethod, createSession, startAuth, validIdentifier } from "@/lib/auth-db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { mode?: unknown; method?: unknown; identifier?: unknown; password?: unknown } | null;
  if (!body || (body.mode !== "login" && body.mode !== "register") || (body.method !== "email" && body.method !== "phone") || typeof body.identifier !== "string" || typeof body.password !== "string") return NextResponse.json({ error: "Некорректные данные." }, { status: 400 });
  const method = body.method as AuthMethod; const identifier = body.identifier.trim().toLowerCase();
  if (!validIdentifier(method, identifier) || body.password.length < 8) return NextResponse.json({ error: "Проверьте e-mail/телефон и пароль (минимум 8 символов)." }, { status: 400 });
  try { const result = await startAuth(body.mode, method, identifier, body.password); if (result.verified) { const response = NextResponse.json({ authenticated: true }); response.cookies.set("ai_sana_session", createSession(result.userId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 }); return response; } return NextResponse.json({ verificationToken: result.token, devCode: result.devCode }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось продолжить." }, { status: 400 }); }
}
