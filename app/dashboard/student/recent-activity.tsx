"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowDown, Delete, Edit, Inbox, Text } from "@icon-park/react";
import { deleteRequest } from "@/app/actions/requests";
import { useToast } from "@/app/components/toaster";
import { getServiceByTitle } from "@/src/domain/services";
import { ConfirmDialog } from "./confirm-dialog";
import { StatusPill, isInFlight } from "./status-pill";
import { Icon } from "../lib/icons";
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
 * reference material and not a to-do â€” but it is one click away rather than
 * hidden, and the count is always on screen.
 *
 * There used to be a limit of five rows here. A student with six requests could
 * not see the sixth and was never told it existed.
 *
 * A request's progress is reported as a status and a queue number, both of
 * which exist. It is deliberately *not* shown as a filled bar or a percentage:
 * a registrar's queue has no percentage behind it, so a bar at 66% would be a
 * decorative number pretending to be information. The queue number is the real
 * position, and the status pill is the real state.
 *
 * "Live" is likewise not displayed. The list updates by itself when the
 * registrar acts, which is a fact the student experiences rather than a badge
 * they have to interpret.
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

  /**
   * Newest first, sorted here rather than inherited from whoever produced the
   * array. The server query orders by `created_at` and the realtime insert path
   * prepends, so the two agree today; sorting on this side means a future change
   * to either one cannot silently reorder a student's history, and it makes the
   * "Newest first" label a guarantee instead of a hope.
   */
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

  // The panel leads the page now, so it gets an authored entrance rather than
  // arriving as part of the scroll reveal further down.
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

  /**
   * Statuses only change when the registrar acts, so the previous statuses are
   * recorded before every update. A row whose status moved is washed with
   * emerald, which says *something happened here* without making the student
   * hunt for the difference.
   *
   * A ref, not state: it feeds a one-off animation, and re-rendering the list
   * on every realtime event would be wasted work.
   */
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
        // Scoped to the panel rather than a single list, because the row can
        // have moved between the open and closed groups in this same update.
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

  // The closed group is measured rather than given a guessed max-height, so it
  // opens to exactly its own size at any width.
  useIsomorphicLayoutEffect(() => {
    const group = closedRef.current;
    if (!group) return;

    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(group, { height: showClosed ? "auto" : 0, autoAlpha: showClosed ? 1 : 0 });
        return;
      }
      gsap.fromTo(
        group,
        { height: showClosed ? 0 : group.scrollHeight, autoAlpha: showClosed ? 0 : 1 },
        {
          height: showClosed ? "auto" : 0,
          autoAlpha: showClosed ? 1 : 0,
          duration: 0.34,
          ease: "power2.inOut",
          // A tween ending on `auto` cannot be interrupted halfway, so a second
          // click during the transition would jump instead of reversing.
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
            <p className="rounded-control border border-processing/30 bg-processing-soft px-3 py-1.5 text-[12px] font-semibold text-processing">
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
                Closed Â· {closed.length}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
                {showClosed ? "Hide" : "Show"}
                <Icon
                  icon={ArrowDown}
                  tone="neutral"
                  size={14}
                  className={showClosed ? "rotate-180" : undefined}
                />
              </span>
            </button>
            <div id="requests-closed" ref={closedRef} className="overflow-hidden">
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

/** One line of orientation, in plain words, that reflects the real counts. */
function summaryLine(inFlight: number, closed: number) {
  if (!inFlight && !closed) return "Nothing submitted yet.";
  if (!inFlight) return `${closed} closed. Newest first.`;
  if (!closed) return "Newest first.";
  return `${inFlight} in progress Â· ${closed} closed. Newest first.`;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-b border-rule bg-sunken px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-muted sm:px-7">
      {children}
    </p>
  );
}

/**
 * One request: what it is, where it is in the queue, and what can still be done
 * with it while it is pending.
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
  const editRef = useRef<HTMLButtonElement>(null);
  const editHandlers = usePressFeedback(editRef, { scale: 0.96 });
  const removeRef = useRef<HTMLButtonElement>(null);
  const removeHandlers = usePressFeedback(removeRef, { scale: 0.96 });

  const active = isInFlight(request.status);
  const canModify = request.status === "pending" && !request.archivedAt;

  return (
    <li
      data-request-row={request.id}
      className="group border-b border-rule px-5 py-5 transition-colors last:border-b-0 hover:bg-sunken sm:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 items-center gap-3 sm:w-52 sm:shrink-0">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-accent-soft">
            <Icon icon={Text} tone="accent" size={20} />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-semibold text-ink">
              {request.documentType}
            </strong>
            <span className="block font-mono text-[11px] tabular-nums text-muted">
              Queue #{request.queueNumber}
            </span>
          </span>
        </div>

        {/* Status and date. Both are facts about the request; the row is
            deliberately not a progress bar, because the queue has no
            percentage to show. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <StatusPill status={request.status} />
          <span className="text-[12px] text-muted">
            {active
              ? `Submitted ${formatDate(request.createdAt)}`
              : `Closed ${formatDate(request.updatedAt)}`}
          </span>
        </div>

        {canModify ? (
          <div className="flex shrink-0 items-center gap-2 opacity-100 transition-opacity sm:self-center sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button
              ref={editRef}
              type="button"
              disabled={disabled}
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-control border border-hairline bg-surface px-3 py-2 text-[12px] font-semibold text-ink-soft transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent disabled:opacity-50"
              aria-label={`Edit ${request.documentType} request`}
              {...editHandlers}>
              <Icon icon={Edit} tone="neutral" size={14} className="shrink-0" />
              Edit
            </button>
            <button
              ref={removeRef}
              type="button"
              disabled={disabled}
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-control border border-hairline bg-surface px-3 py-2 text-[12px] font-semibold text-muted transition-colors hover:border-rejected/40 hover:bg-rejected-soft hover:text-rejected disabled:opacity-50"
              aria-label={`Delete ${request.documentType} request`}
              {...removeHandlers}>
              <Icon icon={Delete} tone="neutral" size={14} className="shrink-0" />
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-PH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recently" : DATE_FORMAT.format(date);
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-dashed border-hairline bg-sunken">
        <Icon icon={Inbox} tone="muted" size={24} />
      </span>
      <p className="mt-5 text-base font-bold tracking-[-0.015em] text-ink">
        Nothing in your queue yet
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted">
        Pick a document to start your first request. It will appear here with its
        queue number, and the status will update on its own.
      </p>
    </div>
  );
}
