"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  FiChevronDown,
  FiEdit2,
  FiFileText,
  FiInbox,
  FiTrash2,
} from "react-icons/fi";
import { deleteRequest } from "@/app/actions/requests";
import { useToast } from "@/app/components/toaster";
import { getServiceByTitle } from "@/src/domain/services";
import { ConfirmDialog } from "./confirm-dialog";
import { StatusPill, isInFlight } from "./status-pill";
import { gsap } from "../lib/motion";
import {
  useGsapContext,
  useIsomorphicLayoutEffect,
  usePressFeedback,
} from "../lib/use-gsap-context";
import type { StudentRequest } from "@/src/domain/request";

/**
 * The request tracker: what has been asked for, where it stands, and what can
 * still be done with it.
 *
 * This is the reason a student opens the dashboard, so it is split by what the
 * request can still do for them rather than by date. Everything still moving
 * through the registrar's queue is listed, in full, at the top. Everything that
 * has been closed sits behind one disclosure, because a finished request is
 * reference material and not a to-do — but it is one click away rather than
 * hidden, and the count is always on screen.
 *
 * Each row expands into its detail: queue number, submitted and updated times,
 * section, and any note the student left. Edit and Delete live inside the
 * expanded area for pending requests, so the actions are explicit and reachable
 * on touch instead of hover-only controls.
 *
 * A request's progress is reported as a status and a queue number, both of
 * which exist. It is deliberately *not* shown as a filled bar or a percentage:
 * a registrar's queue has no percentage behind it, so a bar at 66% would be a
 * decorative number pretending to be information.
 *
 * Icons are Feather throughout — the same set the admin dashboard uses — so
 * the product speaks one icon language.
 */

type PendingDeletion = { id: string; documentType: string } | null;

export function RecentActivity({ requests }: { requests: StudentRequest[] }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closedRef = useRef<HTMLDivElement>(null);
  const closedToggleRef = useRef<HTMLButtonElement>(null);
  const closedHandlers = usePressFeedback(closedToggleRef, { scale: 0.99 });
  const [showClosed, setShowClosed] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion>(null);
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [isPending, startTransition] = useTransition();

  const ordered = useMemo(
    () =>
      [...requests].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      ),
    [requests],
  );

  const inFlight = useMemo(
    () => ordered.filter((request) => isInFlight(request.status)),
    [ordered],
  );
  const closed = useMemo(
    () => ordered.filter((request) => !isInFlight(request.status)),
    [ordered],
  );

  useGsapContext(
    panelRef,
    ({ reduced }) => {
      if (reduced) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-panel-head]", { autoAlpha: 0, y: 12, duration: 0.36 })
        .from(
          "[data-request-row]",
          { autoAlpha: 0, y: 14, duration: 0.38, stagger: 0.07 },
          "-=0.2",
        );
    },
    [requests.length],
  );

  const previousStatusRef = useRef<Record<string, StudentRequest["status"]>>(
    {},
  );

  useIsomorphicLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const previous = previousStatusRef.current;
    const next: Record<string, StudentRequest["status"]> = {};
    const changed: HTMLElement[] = [];

    for (const request of requests) {
      next[request.id] = request.status;
      if (previous[request.id] && previous[request.id] !== request.status) {
        const row = panel.querySelector<HTMLElement>(
          `[data-request-row="${CSS.escape(request.id)}"]`,
        );
        if (row) changed.push(row);
      }
    }
    previousStatusRef.current = next;

    if (!changed.length) return;

    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      for (const row of changed) {
        gsap.fromTo(
          row,
          { backgroundColor: "rgba(233, 246, 240, 1)" },
          {
            backgroundColor: "rgba(233, 246, 240, 0)",
            duration: 1.4,
            ease: "power2.out",
            clearProps: "backgroundColor",
          },
        );
      }
    }, panel);

    return () => context.revert();
  }, [requests]);

  useIsomorphicLayoutEffect(() => {
    const group = closedRef.current;
    if (!group) return;

    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(group, {
          height: showClosed ? "auto" : 0,
          autoAlpha: showClosed ? 1 : 0,
        });
        return;
      }
      gsap.fromTo(
        group,
        {
          height: showClosed ? 0 : group.scrollHeight,
          autoAlpha: showClosed ? 0 : 1,
        },
        {
          height: showClosed ? "auto" : 0,
          autoAlpha: showClosed ? 1 : 0,
          duration: 0.34,
          ease: "power2.inOut",
          overwrite: true,
        },
      );
    }, group);

    return () => context.revert();
  }, [showClosed]);

  function confirmDelete() {
    if (!pendingDeletion) return;
    const { id } = pendingDeletion;
    setPendingDeletion(null);
    startTransition(() => {
      void deleteRequest(id)
        .then((result) => {
          if (result.error) {
            toastError(result.error);
            return;
          }
          toastSuccess(result.success ?? "Request deleted.");
          router.refresh();
        })
        .catch(() => {
          toastError("The request could not be deleted. Try again.");
        });
    });
  }

  function renderRow(request: StudentRequest) {
    return (
      <RequestRow
        key={request.id}
        request={request}
        disabled={isPending}
        onEdit={() => {
          const service = getServiceByTitle(request.documentType);
          router.push(
            service
              ? `/request/${service.slug}?edit=${request.id}`
              : `/request/${encodeURIComponent(request.documentType)}?edit=${request.id}`,
          );
        }}
        onDelete={() =>
          setPendingDeletion({
            id: request.id,
            documentType: request.documentType,
          })
        }
      />
    );
  }

  return (
    <section
      id="requests"
      aria-labelledby="requests-title"
      className="scroll-mt-24">
      <div ref={panelRef} className="sd-panel">
        <div
          data-panel-head
          className="flex flex-wrap items-end justify-between gap-3 border-b border-rule bg-sunken px-5 py-5 sm:px-7 sm:py-6">
          <div className="min-w-0">
            <h2
              id="requests-title"
              className="text-lg font-bold tracking-[-0.025em] text-ink sm:text-xl">
              Your requests
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              {summaryLine(inFlight.length, closed.length)}
            </p>
          </div>
          {inFlight.length ? (
            <p className="rounded-full border border-processing/30 bg-processing-soft px-3 py-1.5 text-[12px] font-semibold text-processing">
              {inFlight.length} in progress
            </p>
          ) : null}
        </div>

        {inFlight.length ? (
          <>
            <GroupLabel>In progress</GroupLabel>
            <ul>{inFlight.map(renderRow)}</ul>
          </>
        ) : null}

        {closed.length ? (
          <>
            <button
              ref={closedToggleRef}
              type="button"
              onClick={() => setShowClosed((open) => !open)}
              aria-expanded={showClosed}
              aria-controls="requests-closed"
              className="flex w-full items-center justify-between gap-3 border-y border-rule bg-sunken px-5 py-3.5 text-left transition-colors hover:bg-hairline/60 sm:px-7"
              {...closedHandlers}>
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
                Closed · {closed.length}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
                {showClosed ? "Hide" : "Show"}
                <FiChevronDown
                  aria-hidden="true"
                  size={14}
                  className={`transition-transform duration-300 ${
                    showClosed ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>
            <div
              id="requests-closed"
              ref={closedRef}
              className="overflow-hidden">
              <ul>{closed.map(renderRow)}</ul>
            </div>
          </>
        ) : null}

        {!requests.length ? <EmptyState /> : null}
      </div>

      <ConfirmDialog
        open={pendingDeletion !== null}
        destructive
        title="Delete this request?"
        body={
          pendingDeletion
            ? `Your ${pendingDeletion.documentType} request will be removed from the queue. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete request"
        cancelLabel="Keep request"
        busy={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeletion(null)}
      />
    </section>
  );
}

function summaryLine(inFlight: number, closed: number) {
  if (!inFlight && !closed) return "Nothing submitted yet.";
  if (!inFlight) return `${closed} closed. Newest first.`;
  if (!closed) return "Newest first.";
  return `${inFlight} in progress · ${closed} closed. Newest first.`;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-b border-rule bg-sunken px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-muted sm:px-7">
      {children}
    </p>
  );
}

/**
 * One request as an expandable row. The header carries what the student scans
 * for — document, queue number, status — and the expanded detail carries the
 * rest: timestamps, section, notes, and the Edit/Delete actions for requests
 * that are still pending.
 */
function RequestRow({
  request,
  disabled,
  onEdit,
  onDelete,
}: {
  request: StudentRequest;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const editRef = useRef<HTMLButtonElement>(null);
  const editHandlers = usePressFeedback(editRef, { scale: 0.96 });
  const removeRef = useRef<HTMLButtonElement>(null);
  const removeHandlers = usePressFeedback(removeRef, { scale: 0.96 });

  const active = isInFlight(request.status);
  const canModify = request.status === "pending" && !request.archivedAt;

  return (
    <li
      data-request-row={request.id}
      className={`border-b border-rule transition-colors last:border-b-0 ${
        expanded ? "bg-sunken/70" : "hover:bg-sunken"
      }`}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-5 py-4 text-left sm:gap-4 sm:px-7">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <FiFileText size={19} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm font-semibold text-ink">
            {request.documentType}
          </strong>
          <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-muted">
            Queue #{String(request.queueNumber).padStart(3, "0")}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="hidden flex-col items-end gap-1 sm:flex">
            <StatusPill status={request.status} />
            <span className="text-[11px] text-muted">
              {active
                ? `Submitted ${formatDate(request.createdAt)}`
                : `Closed ${formatDate(request.updatedAt)}`}
            </span>
          </span>
          <span className="sm:hidden">
            <StatusPill status={request.status} />
          </span>
          <FiChevronDown
            aria-hidden="true"
            size={16}
            className={`shrink-0 text-muted transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-rule px-5 py-4 sm:px-7">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <Detail
              label="Queue"
              value={`#${String(request.queueNumber).padStart(3, "0")}`}
            />
            <Detail
              label="Submitted"
              value={formatDateTime(request.createdAt)}
            />
            <Detail
              label="Last updated"
              value={formatDateTime(request.updatedAt)}
            />
            <Detail label="Section" value={request.section ?? "—"} />
          </dl>

          {request.notes ? (
            <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-[13px] leading-6 text-muted">
              {request.notes}
            </p>
          ) : null}

          {canModify ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                ref={editRef}
                type="button"
                disabled={disabled}
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3.5 py-2 text-[12px] font-semibold text-ink-soft transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent disabled:opacity-50"
                aria-label={`Edit ${request.documentType} request`}
                {...editHandlers}>
                <FiEdit2 size={14} aria-hidden="true" className="shrink-0" />
                Edit
              </button>
              <button
                ref={removeRef}
                type="button"
                disabled={disabled}
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3.5 py-2 text-[12px] font-semibold text-muted transition-colors hover:border-rejected/40 hover:bg-rejected-soft hover:text-rejected disabled:opacity-50"
                aria-label={`Delete ${request.documentType} request`}
                {...removeHandlers}>
                <FiTrash2 size={14} aria-hidden="true" className="shrink-0" />
                Delete
              </button>
            </div>
          ) : (
            <p className="mt-3 text-[12px] leading-5 text-muted">
              {request.status === "processing"
                ? "This request is being processed and can no longer be changed."
                : "This request is closed."}
            </p>
          )}
        </div>
      ) : null}
    </li>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-[13px] font-medium text-ink">{value}</dd>
    </div>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-PH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-PH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recently" : DATE_FORMAT.format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_TIME_FORMAT.format(date);
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-dashed border-hairline bg-sunken text-muted">
        <FiInbox size={24} aria-hidden="true" />
      </span>
      <p className="mt-5 text-base font-bold tracking-[-0.015em] text-ink">
        Nothing in your queue yet
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted">
        Pick a document to start your first request. It will appear here with
        its queue number, and the status will update on its own.
      </p>
    </div>
  );
}
