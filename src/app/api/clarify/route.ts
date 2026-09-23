import { NextResponse } from "next/server";

type ClarifyInput = { description?: unknown; industry?: unknown };

/** Deterministic fallback so the clarification step works before an AI provider is connected. */
export async function POST(request: Request) {
  let input: ClarifyInput;
  try {
    input = await request.json() as ClarifyInput;
  } catch {
    return NextResponse.json({ error: "Ожидается JSON в теле запроса." }, { status: 400 });
  }

  if (typeof input.description !== "string" || input.description.trim().length < 10) {
    return NextResponse.json({ error: "Опишите задачу минимум в 10 символах." }, { status: 400 });
  }

  return NextResponse.json({
    mode: "fallback",
    questions: [
      "Что происходит сейчас и что именно нужно изменить?",
      "Какие данные, примеры или материалы доступны команде?",
      "Какой конкретный результат и по каким критериям вы будете считать успешным?",
    ],
    suggestedFields: {
      context: input.description.trim(),
      industry: typeof input.industry === "string" ? input.industry : "",
    },
  });
}
