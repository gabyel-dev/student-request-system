"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  FiAlertCircle,
  FiArrowUp,
  FiLoader,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import type {
  AssistantChatMessage,
  AssistantContext,
} from "@/src/domain/assistant";
import type { RequestStatus } from "@/src/domain/request";
import { BsFillSquareFill } from "react-icons/bs";

const QUICK_PROMPTS = [
  "How do I request a document?",
  "What's the status of my latest request?",
  "What does Processing mean?",
  "How many requests can I file per day?",
];

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  rejected: "Rejected",
};

const STATUS_CHIPS: Record<RequestStatus, string> = {
  pending: "border-pending/30 bg-pending-soft text-pending",
  processing: "border-processing/30 bg-processing-soft text-processing",
  completed: "border-completed/30 bg-completed-soft text-completed",
  rejected: "border-rejected/30 bg-rejected-soft text-rejected",
};

export default function AssistantPanel({
  open,
  onClose,
  status,
  onRetryServer,
  context,
  contextLoading,
  contextError,
  onRefreshContext,
  messages,
  input,
  generating,
  onInputChange,
  onSend,
  onStop,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  status: "checking" | "available" | "unavailable";
  onRetryServer: () => void;
  context: AssistantContext | null;
  contextLoading: boolean;
  contextError: string | null;
  onRefreshContext: () => void;
  messages: AssistantChatMessage[];
  input: string;
  generating: boolean;
  onInputChange: (value: string) => void;
  onSend: (text?: string) => void;
  onStop: () => void;
  onClear: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const checking = status === "checking";
  const ready = status === "available";

  useEffect(() => {
    if (!open || !ready) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [open, ready]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open, generating]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      role="dialog"
      aria-label="itikQ Assistant"
      aria-modal="false"
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed inset-x-3 bottom-3 top-16 z-[45] flex flex-col overflow-hidden rounded-3xl border border-hairline bg-surface shadow-raised sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[calc(100dvh_-_8rem)] sm:max-h-[640px] sm:w-[400px]"
    >
      <header className="flex items-center gap-2.5 border-b border-hairline bg-surface px-4 py-3">
        <Image
          src="/pose_2.png"
          alt=""
          aria-hidden="true"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 select-none object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">
            itikQ Assistant
          </p>
        </div>
        {ready && messages.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            disabled={generating}
            aria-label="Clear chat"
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-sunken hover:text-ink disabled:opacity-40"
          >
            <FiTrash2 aria-hidden="true" size={15} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-sunken hover:text-ink"
        >
          <FiX aria-hidden="true" size={17} />
        </button>
      </header>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {checking ? <CheckingState /> : null}

        {status === "unavailable" ? (
          <UnavailableState onRetry={onRetryServer} onClose={onClose} />
        ) : null}

        {ready ? (
          <div className="space-y-4">
            <RequestSummary
              context={context}
              loading={contextLoading}
              error={contextError}
              onRefresh={onRefreshContext}
            />

            {messages.length === 0 ? (
              <Welcome firstName={context?.user.firstName} />
            ) : null}

            <div className="space-y-3" role="log" aria-live="polite">
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
            </div>

            {messages.length === 0 ? (
              <QuickPrompts
                disabled={!context || contextLoading || generating}
                onPick={(prompt) => onSend(prompt)}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {ready ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
          className="border-t border-hairline bg-surface px-3 pb-3 pt-2.5"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              rows={1}
              maxLength={600}
              placeholder="Ask about your requests..."
              aria-label="Message the assistant"
              disabled={!context || contextLoading}
              className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-hairline bg-surface px-3 py-2 text-[13px] leading-6 text-ink outline-none transition placeholder:text-muted focus:border-accent disabled:opacity-60"
            />
            {generating ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-rejected/30 bg-rejected-soft px-3 text-[12px] font-bold text-red-800 transition hover:bg-rejected/10"
              >
                <BsFillSquareFill aria-hidden="true" size={14} className="mr-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || !context || contextLoading}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-white transition hover:bg-accent-hover disabled:opacity-40"
              >
                <FiArrowUp aria-hidden="true" size={17} />
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-[10px] leading-4 text-muted">
            AI can make mistakes. Check your dashboard or the registrar
            for official status.
          </p>
        </form>
      ) : null}
    </motion.div>,
    document.body,
  );
}

function CheckingState() {
  return (
    <div className="rounded-2xl border border-hairline bg-sunken p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <FiLoader
          aria-hidden="true"
          className="animate-spin motion-reduce:animate-none"
        />
        Connecting the assistant
      </p>
    </div>
  );
}

function UnavailableState({
  onRetry,
  onClose,
}: {
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-rejected/30 bg-rejected-soft p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-rejected">
          <FiAlertCircle aria-hidden="true" />
          The assistant is unavailable
        </p>
        <p className="mt-1 text-[13px] leading-6 text-rejected">
          Try again in a moment, or use the Help Center for an answer.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-bold text-white transition hover:bg-accent-hover"
      >
        Retry
      </button>
      <Link
        href="/dashboard/help"
        onClick={onClose}
        className="block text-center text-[13px] font-semibold text-muted underline underline-offset-2"
      >
        Open Help Center
      </Link>
    </div>
  );
}

function RequestSummary({
  context,
  loading,
  error,
  onRefresh,
}: {
  context: AssistantContext | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading && !context) {
    return (
      <div className="rounded-2xl border border-hairline bg-sunken px-3 py-2.5 text-[13px] text-muted">
        Loading your request details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-pending/30 bg-pending-soft p-3 text-[13px] leading-5 text-pending">
        <p>{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-1.5 font-bold underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!context) return null;

  const active = context.requests
    .filter((request) => !request.archived)
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-hairline bg-sunken p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          Your requests
        </p>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh request details"
          className="grid h-7 w-7 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
        >
          <FiRefreshCw aria-hidden="true" size={13} />
        </button>
      </div>

      {active.length === 0 ? (
        <p className="mt-1.5 text-[13px] text-muted">No active requests.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {active.map((request, index) => (
            <li
              key={`${request.documentType}-${request.queueNumber}-${index}`}
              className="rounded-xl border border-hairline bg-surface px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-ink">
                  {request.documentType}
                </p>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_CHIPS[request.status]}`}
                >
                  {STATUS_LABELS[request.status]}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-muted">
                Queue #{request.queueNumber}
                {request.section ? ` · ${request.section}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Welcome({ firstName }: { firstName?: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-sunken px-3.5 py-3 text-[13px] leading-6 text-ink">
      Hi{firstName ? `, ${firstName}` : ""}! I can explain how document
      requests work or check the status of your own requests.
    </div>
  );
}

function MessageBubble({ message }: { message: AssistantChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 ${
          isUser
            ? "bg-accent text-white"
            : "border border-hairline bg-sunken text-ink"
        }`}
      >
        {message.content || "…"}
      </div>
    </div>
  );
}

function QuickPrompts({
  onPick,
  disabled,
}: {
  onPick: (prompt: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-2">
      {QUICK_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onPick(prompt)}
          disabled={disabled}
          className="rounded-2xl border border-hairline bg-surface px-3.5 py-2.5 text-left text-[13px] font-semibold text-ink-soft transition hover:border-accent/40 hover:text-ink disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
