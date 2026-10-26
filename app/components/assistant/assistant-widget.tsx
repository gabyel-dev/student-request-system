"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import type { AssistantContext } from "@/src/domain/assistant";
import { useAssistantChat } from "./use-assistant-chat";

const AssistantPanel = dynamic(() => import("./assistant-panel"), {
  ssr: false,
});

type ServerStatus = "checking" | "available" | "unavailable";

export function AssistantWidget() {
  const pathname = usePathname();
  const [opened, setOpened] = useState(false);
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<AssistantContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");
  const chat = useAssistantChat({ context });

  const checkServer = useCallback(async () => {
    setServerStatus("checking");
    try {
      const response = await fetch("/api/assistant/chat", {
        cache: "no-store",
      });
      if (!response.ok) {
        setServerStatus("unavailable");
        return;
      }
      const data = (await response.json()) as { available?: unknown };
      setServerStatus(data.available === true ? "available" : "unavailable");
    } catch {
      setServerStatus("unavailable");
    }
  }, []);

  const loadContext = useCallback(async () => {
    setContextLoading(true);
    setContextError(null);
    try {
      const response = await fetch("/api/assistant/context", {
        cache: "no-store",
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("application/json")) {
        throw new Error("Could not load your request details.");
      }
      setContext((await response.json()) as AssistantContext);
    } catch (error) {
      setContext(null);
      setContextError(
        error instanceof Error
          ? error.message
          : "Could not load your request details.",
      );
    } finally {
      setContextLoading(false);
    }
  }, []);

  const openPanel = useCallback(() => {
    setOpened(true);
    setOpen(true);
    if (serverStatus !== "available") void checkServer();
    void loadContext();
  }, [checkServer, loadContext, serverStatus]);

  const closePanel = useCallback(() => setOpen(false), []);

  if (pathname === "/login") return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={openPanel}
          aria-label="Open itikQ Assistant"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full border border-accent-line bg-accent px-3.5 text-sm font-bold text-white shadow-raised transition hover:bg-accent-hover sm:bottom-6 sm:right-6"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
            <Image
              src="/pose_2.png"
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="h-7 w-7 select-none object-contain"
            />
          </span>
          Ask itikQ
        </button>
      ) : null}
      {opened ? (
        <AssistantPanel
          open={open}
          onClose={closePanel}
          status={serverStatus}
          onRetryServer={() => void checkServer()}
          context={context}
          contextLoading={contextLoading}
          contextError={contextError}
          onRefreshContext={() => void loadContext()}
          messages={chat.messages}
          input={chat.input}
          generating={chat.generating}
          onInputChange={chat.setInput}
          onSend={chat.send}
          onStop={chat.stop}
          onClear={chat.clear}
        />
      ) : null}
    </>
  );
}
