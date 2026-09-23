import { NextResponse, type NextRequest } from "next/server";
import { consumeRateLimit, getSessionUser } from "@/lib/auth-db";
import type { TaskFields } from "@/features/tasks/types";

export const runtime = "nodejs";

type QuestionField = Exclude<keyof TaskFields, "title" | "industry">;
type ClarificationQuestion = { field: QuestionField; text: string };
type ClarificationOutput = { suggestedFields: TaskFields; questions: ClarificationQuestion[] };
type ClarifyInput = { description?: unknown; industry?: unknown };

const questionFields: QuestionField[] = [
  "context",
  "need",
  "users",
  "dataMaterials",
  "constraints",
  "expectedOutcome",
  "successCriteria",
  "contact",
  "interactionFormat",
];

const fieldNames: (keyof TaskFields)[] = [
  "title",
  "industry",
  ...questionFields,
];

const SYSTEM_PROMPT = `Ты помогаешь представителю бизнеса подготовить карточку практической задачи для студенческих команд.
Используй только сведения из входного описания. Не придумывай факты, цифры, пользователей, контакты, сроки или ограничения. Если значение нельзя подтвердить по описанию, верни пустую строку.
Заполни предложенные поля краткими формулировками, сохранив смысл исходного текста. Не меняй отрасль, переданную пользователем.
Сформулируй ровно 3 конкретных уточняющих вопроса по самым важным незаполненным полям. Не спрашивай повторно о том, что уже ясно из описания. У каждого вопроса укажи одно поле, ответ на которое можно напрямую внести в карточку. Не запрашивай персональные или чувствительные данные.`;

const outputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestedFields: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(fieldNames.map((key) => [key, { type: "string" }])),
      required: fieldNames,
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: { type: "string", enum: questionFields },
          text: { type: "string" },
        },
        required: ["field", "text"],
      },
    },
  },
  required: ["suggestedFields", "questions"],
};

function fallback(description: string, industry: string, warning?: string) {
  const title = (description.split(/[.!?\n]/)[0] || description).trim().slice(0, 80);
  return {
    mode: "fallback" as const,
    prompt: SYSTEM_PROMPT,
    input: { description, industry },
    warning,
    suggestedFields: {
      title,
      industry,
      context: "",
      need: description,
      users: "",
      dataMaterials: "",
      constraints: "",
      expectedOutcome: "",
      successCriteria: "",
      contact: "",
      interactionFormat: "",
    } satisfies TaskFields,
    questions: [
      { field: "users" as const, text: "Кто будет пользоваться решением и в какой ситуации?" },
      { field: "dataMaterials" as const, text: "Какие данные, примеры или материалы доступны команде?" },
      { field: "expectedOutcome" as const, text: "Какой конкретный результат вы ждёте от команды?" },
    ],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseClarification(value: unknown): ClarificationOutput | null {
  if (!isRecord(value) || !isRecord(value.suggestedFields) || !Array.isArray(value.questions)) return null;

  const suggestedFields = value.suggestedFields;
  if (!fieldNames.every((key) => typeof suggestedFields[key] === "string")) return null;

  const questions = value.questions;
  if (questions.length !== 3) return null;
  const parsedQuestions: ClarificationQuestion[] = [];
  const seenFields = new Set<string>();

  for (const item of questions) {
    if (!isRecord(item) || typeof item.field !== "string" || typeof item.text !== "string") return null;
    if (!questionFields.includes(item.field as QuestionField) || !item.text.trim() || item.text.length > 400) return null;
    if (seenFields.has(item.field)) return null;
    seenFields.add(item.field);
    parsedQuestions.push({ field: item.field as QuestionField, text: item.text.trim() });
  }

  const normalizedFields = Object.fromEntries(
    fieldNames.map((key) => [key, (suggestedFields[key] as string).trim().slice(0, key === "title" ? 120 : 2000)]),
  ) as TaskFields;

  return { suggestedFields: normalizedFields, questions: parsedQuestions };
}

type OpenAIResponse = {
  output_text?: unknown;
  output?: { content?: { type?: string; text?: string }[] }[];
};

function responseText(body: OpenAIResponse) {
  if (typeof body.output_text === "string") return body.output_text;
  return body.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === "output_text" && typeof item.text === "string")?.text;
}

/** Analyzes a rough task description. Falls back to deterministic questions if AI is unavailable or malformed. */
export async function POST(request: NextRequest) {
  const user = getSessionUser(request.cookies.get("ai_sana_session")?.value);
  if (!user) return NextResponse.json({ error: "Войдите, чтобы уточнить задачу." }, { status: 401 });

  let input: ClarifyInput;
  try {
    // Cap actual streamed bytes; Content-Length alone can be absent or forged.
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Empty body");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 24_000) {
        await reader.cancel();
        return NextResponse.json({ error: "Слишком большой запрос." }, { status: 413 });
      }
      chunks.push(value);
    }
    const decoded: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!isRecord(decoded)) throw new Error("Expected object");
    input = decoded;
  } catch {
    return NextResponse.json({ error: "Ожидается JSON в теле запроса." }, { status: 400 });
  }

  if (typeof input.description !== "string" || input.description.trim().length < 10) {
    return NextResponse.json({ error: "Опишите задачу минимум в 10 символах." }, { status: 400 });
  }
  if (input.description.length > 5000) {
    return NextResponse.json({ error: "Описание должно быть короче 5000 символов." }, { status: 400 });
  }

  if (!consumeRateLimit(`clarify:user:${user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: "Не более 5 уточнений в минуту. Подождите минуту." },
      { status: 429, headers: { "Retry-After": "60" } });
  }

  const description = input.description.trim();
  const industry = typeof input.industry === "string" ? input.industry.trim().slice(0, 120) : "";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallback(description, industry, "OPENAI_API_KEY не задан — используются демонстрационные вопросы."));
  }

  // Shared budget prevents account/IP rotation from bypassing the spending cap.
  if (!consumeRateLimit("clarify:global", 100, 60 * 60_000)) {
    return NextResponse.json({ error: "Часовой лимит AI-запросов исчерпан. Повторите позже." },
      { status: 429, headers: { "Retry-After": "3600" } });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify({ description, industry }) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "business_task_clarification",
            strict: true,
            schema: outputSchema,
          },
        },
        store: false,
        max_output_tokens: 1200,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return NextResponse.json(fallback(description, industry, "AI временно недоступен — показаны демонстрационные вопросы."));
    }

    const body = await response.json() as OpenAIResponse;
    const text = responseText(body);
    let decoded: unknown;
    try {
      decoded = text ? JSON.parse(text) : null;
    } catch {
      decoded = null;
    }

    const parsed = parseClarification(decoded);
    if (!parsed) {
      return NextResponse.json(fallback(description, industry, "AI вернул некорректный ответ — показаны демонстрационные вопросы."));
    }

    parsed.suggestedFields.industry = industry;
    return NextResponse.json({
      mode: "openai",
      prompt: SYSTEM_PROMPT,
      input: { description, industry },
      ...parsed,
    });
  } catch {
    return NextResponse.json(fallback(description, industry, "Не удалось связаться с AI — показаны демонстрационные вопросы."));
  }
}
