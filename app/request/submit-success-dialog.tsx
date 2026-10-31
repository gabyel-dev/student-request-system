"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import type { RequestSubmissionReceipt } from "@/src/domain/request";

const COUNTDOWN_SECONDS = 4;
const REDIRECT_LABEL_MS = 450;
const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The receipt shown immediately after a request is submitted.
 *
 * The request is already saved by the time this appears, so the countdown is
 * purely a chance to read the queue number — not a loading state. The ring
 * drains over four seconds and the number inside counts down with it; when it
 * reaches zero the label becomes "Redirecting to dashboard…" and the dashboard
 * navigation starts. "Go to dashboard now" skips the wait.
 */
export function SubmitSuccessDialog({
  request,
  onDone,
}: {
  request: RequestSubmissionReceipt;
  onDone: () => void;
}) {
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);
  const redirecting = remaining <= 0;
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (remaining <= 0) {
      const timeout = window.setTimeout(finish, REDIRECT_LABEL_MS);
      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(
      () => setRemaining((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timeout);
  }, [remaining, finish]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-success-title"
      className="fixed inset-0 z-[1100] grid place-items-center bg-[#06281c]/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-surface shadow-[0_32px_90px_-30px_rgba(6,40,28,0.7)] [animation:toast-in_0.3s_cubic-bezier(.16,1,.3,1)]">
        <div
          aria-hidden="true"
          className="h-1 bg-gradient-to-r from-accent via-accent/50 to-transparent"
        />
        <div className="px-6 pb-6 pt-7 sm:px-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
            <FiCheck size={24} aria-hidden="true" />
          </span>

          <h2
            id="submit-success-title"
            className="mt-4 text-2xl font-bold tracking-[-0.025em] text-ink">
            Request submitted
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            Your <strong className="font-semibold text-ink">{request.documentType}</strong>{" "}
            request is now in the registrar&rsquo;s queue.
          </p>

          <div className="mt-5 rounded-2xl border border-dashed border-accent-line bg-accent-soft/40 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                  Your queue number
                </p>
                <p className="mt-1 font-mono text-[40px] font-bold leading-none tabular-nums tracking-tight text-accent">
                  #{String(request.queueNumber).padStart(3, "0")}
                </p>
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                  Document
                </p>
                <p className="mt-1 max-w-[18ch] text-sm font-semibold leading-5 text-ink">
                  {request.documentType}
                </p>
                {request.section ? (
                  <p className="mt-1 text-[11px] text-muted">
                    {request.section}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <p
            className={`mt-3 text-[11px] leading-5 ${request.emailSent ? "text-muted" : "text-[#8e2f28]"}`}>
            {request.emailSent
              ? "A confirmation email with this queue number was sent to your school email."
              : "Your request is saved, but the confirmation email could not be sent. You can still track it from your dashboard."}
          </p>

          <div className="mt-5 flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <svg
                viewBox="0 0 80 80"
                className="h-full w-full -rotate-90"
                aria-hidden="true">
                <circle
                  cx="40"
                  cy="40"
                  r={RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-hairline"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="text-accent"
                  style={{
                    strokeDasharray: CIRCUMFERENCE,
                    strokeDashoffset: 0,
                    animation: `submit-countdown ${COUNTDOWN_SECONDS}s linear forwards`,
                  }}
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center">
                {redirecting ? (
                  <FiArrowRight
                    size={22}
                    className="text-accent"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="font-mono text-2xl font-bold tabular-nums text-accent">
                    {remaining}
                  </span>
                )}
              </span>
            </div>

            <div className="min-w-0" aria-live="polite">
              <p className="text-sm font-semibold text-ink">
                {redirecting
                  ? "Redirecting to dashboard…"
                  : `Continuing to your dashboard in ${remaining}s`}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {redirecting
                  ? "Your queue ticket is saved."
                  : "Your request is already saved. You can go now if you prefer."}
              </p>
              <button
                type="button"
                autoFocus
                onClick={finish}
                className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-accent transition hover:text-accent-hover">
                Go to dashboard now
                <FiArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes submit-countdown { from { stroke-dashoffset: 0; } to { stroke-dashoffset: ${CIRCUMFERENCE}; } }`}</style>
    </div>
  );
}
