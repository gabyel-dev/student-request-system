"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Alarm } from "@icon-park/react";
import { Icon } from "../lib/icons";
import { gsap } from "../lib/motion";
import {
  useIsomorphicLayoutEffect,
  usePressFeedback,
} from "../lib/use-gsap-context";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive. */
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Replaces `window.confirm` for destructive request deletion.
 *
 * The native dialog was three problems in one: unstyleable, so it could not
 * match the rest of the product; blocking, so nothing could animate; and
 * ambiguous, so it gave no indication of *which* request was about to be
 * deleted.
 *
 * Accessibility, in full:
 * - `role="dialog" aria-modal` with the title wired up via `aria-labelledby`
 *   and the body via `aria-describedby`.
 * - Focus moves to the cancel button on open, so a stray Enter cannot delete
 *   something, and Tab is trapped inside the dialog until it closes.
 * - Escape and the scrim both cancel.
 * - Focus returns to whatever opened it.
 * - The content is hidden from assistive tech while closed by not being
 *   rendered at all, rather than by `display: none` on a mounted node.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Keep request",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // The element focused before the dialog opened, so focus can be handed back.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // Unique per instance so two dialogs can never fight over the same label.
  const titleId = useId();
  const bodyId = useId();

  const confirmRef = useRef<HTMLButtonElement>(null);
  const confirmHandlers = usePressFeedback(confirmRef, { scale: 0.97 });
  const cancelHandlers = usePressFeedback(cancelRef, { scale: 0.98 });

  // Focus in, animate in, remember where to go back to.
  useIsomorphicLayoutEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    // Cancel first: the safe action is the one a keyboard lands on.
    cancelRef.current?.focus();

    const context = gsap.context(() => {
      const scrim = panel.querySelector("[data-dialog-scrim]");
      const card = panel.querySelector("[data-dialog-body]");

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([scrim, card], { clearProps: "all" });
        return;
      }

      const timeline = gsap.timeline();
      timeline
        .fromTo(
          scrim,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.18, ease: "power2.out" },
        )
        .fromTo(
          card,
          { autoAlpha: 0, y: 14, scale: 0.97 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: "power3.out" },
          "-=0.06",
        );
    }, panel);

    return () => context.revert();
  }, [open]);

  // Return focus, but only if it is still focusable â€” the row that opened the
  // dialog may have been removed by a realtime update in the meantime.
  useEffect(() => {
    if (open) return;
    const previous = returnFocusRef.current;
    returnFocusRef.current = null;
    if (previous?.isConnected) previous.focus();
  }, [open]);

  // Escape cancels, Tab is trapped, and the page behind must not scroll.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div
        data-dialog-scrim
        aria-hidden="true"
        onClick={onCancel}
        className="absolute inset-0 bg-[rgba(8,40,29,.42)] backdrop-blur-[3px]"
      />
      <div
        data-dialog-body
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative w-full max-w-md rounded-card border border-hairline bg-surface p-6 shadow-raised sm:p-7">
        <div className="flex gap-4">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              destructive
                ? "bg-rejected-soft text-rejected"
                : "bg-accent-soft text-accent"
            }`}>
            <Icon
              icon={Alarm}
              tone={destructive ? "rejected" : "accent"}
              size={20}
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-base font-bold tracking-[-0.02em] text-ink">
              {title}
            </h2>
            <p
              id={bodyId}
              className="mt-1.5 text-[13px] leading-6 text-muted">
              {body}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-control border border-hairline bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-sunken disabled:opacity-50"
            {...cancelHandlers}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy || undefined}
            className={`rounded-control px-4 py-2.5 text-[13px] font-bold text-white transition-colors disabled:opacity-60 ${
              destructive
                ? "bg-rejected hover:bg-rejected/90"
                : "bg-accent hover:bg-accent-hover"
            }`}
            {...confirmHandlers}>
            {busy ? "Deletingâ€¦" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
