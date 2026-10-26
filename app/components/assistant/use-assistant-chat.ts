"use client";

import { useCallback, useRef, useState } from "react";
import { useToast } from "@/app/components/toaster";
import type {
  AssistantChatMessage,
  AssistantContext,
} from "@/src/domain/assistant";

class AssistantRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssistantRateLimitError";
  }
}

function rateLimitMessage(scope: unknown, retryAfter: number): string {
  if (scope === "day") {
    return "The assistant has reached its daily limit. Try again tomorrow or use the Help Center.";
  }
  if (retryAfter > 0 && retryAfter <= 120) {
    return `Too many messages. Try again in ${Math.ceil(retryAfter)} seconds.`;
  }
  if (retryAfter > 120) {
    const minutes = Math.max(1, Math.ceil(retryAfter / 60));
    return `Too many messages. Try again in about ${minutes} minutes.`;
  }
  return "Too many messages. Try again in a moment.";
}

async function fetchServerAnswer(
  messages: AssistantChatMessage[],
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (response.status === 429) {
    const data = contentType.includes("application/json")
      ? ((await response.json()) as {
          scope?: unknown;
          retry_after?: unknown;
        })
      : null;
    const retryAfter =
      Number(response.headers.get("retry-after")) ||
      Number(data?.retry_after) ||
      0;
    throw new AssistantRateLimitError(rateLimitMessage(data?.scope, retryAfter));
  }

  if (!response.ok || !contentType.includes("application/json")) {
    throw new Error("The assistant is unavailable.");
  }

  const data = (await response.json()) as { answer?: unknown };
  if (typeof data.answer !== "string" || !data.answer.trim()) {
    throw new Error("The assistant did not answer.");
  }
  return data.answer.trim();
}

export function useAssistantChat({
  context,
}: {
  context: AssistantContext | null;
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const generatingRef = useRef(false);
  const cancelledRef = useRef(false);
  const generationIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim().slice(0, 600);
      if (!text || generatingRef.current || !context) return;

      const id = ++generationIdRef.current;
      generatingRef.current = true;
      cancelledRef.current = false;
      setGenerating(true);
      setInput("");

      const history: AssistantChatMessage[] = [
        ...messages,
        { role: "user", content: text },
      ];
      setMessages([...history, { role: "assistant", content: "" }]);

      let reply = "";
      try {
        const controller = new AbortController();
        abortRef.current = controller;
        reply = await fetchServerAnswer(history, controller.signal);
        if (generationIdRef.current !== id) return;
        setMessages((current) => {
          const next = [...current];
          next[next.length - 1] = { role: "assistant", content: reply };
          return next;
        });

        if (generationIdRef.current !== id) return;

        if (!reply.trim()) {
          setMessages((current) => {
            const next = [...current];
            if (cancelledRef.current) {
              if (next[next.length - 1]?.content === "") next.pop();
            } else {
              next[next.length - 1] = {
                role: "assistant",
                content:
                  "I could not come up with an answer. Try rephrasing, or check the Help Center.",
              };
            }
            return next;
          });
        }
      } catch (error) {
        if (generationIdRef.current !== id) return;
        if (!cancelledRef.current) {
          const name = error instanceof Error ? error.name : "";
          if (name === "AbortError") return;
          toast(
            "error",
            error instanceof AssistantRateLimitError
              ? error.message
              : "The assistant is unavailable right now. Try again.",
          );
          setInput((current) => (current.trim() ? current : text));
        }
        setMessages((current) => {
          const next = [...current];
          if (next[next.length - 1]?.content === "") next.pop();
          return next;
        });
      } finally {
        if (generationIdRef.current === id) {
          generatingRef.current = false;
          setGenerating(false);
          cancelledRef.current = false;
          abortRef.current = null;
        }
      }
    },
    [context, input, messages, toast],
  );

  const stop = useCallback(() => {
    if (!generatingRef.current) return;
    cancelledRef.current = true;
    generationIdRef.current += 1;
    generatingRef.current = false;
    setGenerating(false);
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages((current) => {
      const next = [...current];
      if (
        next[next.length - 1]?.role === "assistant" &&
        next[next.length - 1]?.content === ""
      ) {
        next.pop();
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    if (generatingRef.current) return;
    setMessages([]);
    setInput("");
  }, []);

  return {
    messages,
    input,
    generating,
    setInput,
    send,
    stop,
    clear,
  };
}
