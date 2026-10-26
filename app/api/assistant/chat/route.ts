import { NextResponse } from "next/server";
import type {
  AssistantChatMessage,
  AssistantContext,
} from "@/src/domain/assistant";
import { buildAssistantContext } from "@/src/server/assistant-context";
import { getSessionTokenUserId } from "@/src/server/session";
import { buildChatMessages } from "@/app/components/assistant/prompt";
import { consumeAssistantRateLimit } from "@/src/infrastructure/supabase/assistant-rate-limit.supabase";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 4;
const MAX_CHARS = 600;

function limitFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function getProvider() {
  const apiKey = process.env.ASSISTANT_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    baseUrl:
      process.env.ASSISTANT_API_URL?.trim().replace(/\/+$/, "") ||
      "https://api.groq.com/openai/v1",
    apiKey,
    model: process.env.ASSISTANT_MODEL?.trim() || "openai/gpt-oss-20b",
  };
}

function parseMessages(value: unknown): AssistantChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): AssistantChatMessage | null => {
      if (typeof item !== "object" || item === null) return null;
      const record = item as Record<string, unknown>;
      const role = record.role;
      const content = record.content;
      if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
        return null;
      }
      return { role, content: content.slice(0, MAX_CHARS) };
    })
    .filter((message): message is AssistantChatMessage => message !== null)
    .slice(-MAX_MESSAGES);
}

export async function GET() {
  const userId = await getSessionTokenUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { available: getProvider() !== null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const userId = await getSessionTokenUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const provider = getProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const messages = parseMessages(
    (body as { messages?: unknown } | null)?.messages,
  );
  if (!messages.length || messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "invalid_messages" }, { status: 400 });
  }

  let rateLimit: Awaited<ReturnType<typeof consumeAssistantRateLimit>>;
  try {
    rateLimit = await consumeAssistantRateLimit([
      {
        key: `assistant:user:${userId}:minute`,
        limit: limitFromEnv("ASSISTANT_USER_MINUTE_LIMIT", 6),
        windowSeconds: 60,
      },
      {
        key: `assistant:user:${userId}:day`,
        limit: limitFromEnv("ASSISTANT_USER_DAILY_LIMIT", 30),
        windowSeconds: 86_400,
      },
      {
        key: "assistant:global:minute",
        limit: limitFromEnv("ASSISTANT_GLOBAL_MINUTE_LIMIT", 24),
        windowSeconds: 60,
      },
      {
        key: "assistant:global:day",
        limit: limitFromEnv("ASSISTANT_GLOBAL_DAILY_LIMIT", 120),
        windowSeconds: 86_400,
      },
    ]);
  } catch {
    return NextResponse.json(
      { error: "rate_limit_unavailable" },
      { status: 503 },
    );
  }

  if (rateLimit.allowed === false) {
    const retryAfter = rateLimit.retryAfter;
    return NextResponse.json(
      {
        error: "rate_limited",
        scope: rateLimit.bucket.endsWith(":day") ? "day" : "minute",
        retry_after: retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    );
  }

  let context: AssistantContext | null;
  try {
    context = await buildAssistantContext(userId);
  } catch {
    return NextResponse.json(
      { error: "context_unavailable" },
      { status: 500 },
    );
  }
  if (!context) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const groqGptOss =
    provider.baseUrl.includes("api.groq.com") &&
    provider.model.startsWith("openai/gpt-oss");

  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: buildChatMessages(context, messages),
        temperature: 0.3,
        ...(groqGptOss
          ? {
              max_completion_tokens: 160,
              reasoning_effort: "low",
              include_reasoning: false,
            }
          : { max_tokens: 120 }),
        stream: false,
      }),
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });

    if (response.status === 429) {
      const retryAfterHeader = Number(response.headers.get("retry-after"));
      const retryAfter =
        Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
          ? retryAfterHeader
          : 30;
      return NextResponse.json(
        { error: "provider_rate_limited", retry_after: retryAfter },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "assistant_unavailable" },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const answer = data.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return NextResponse.json(
        { error: "empty_answer" },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { answer: answer.trim().slice(0, 2000) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "assistant_unavailable" },
      { status: 502 },
    );
  }
}
