import { Check, Close, Loading, Time } from "@icon-park/react";
import { Icon, type IconTone } from "../lib/icons";
import type { RequestStatus } from "@/src/domain/request";

/**
 * The single source of truth for how a request's status looks and reads.
 *
 * Every status is communicated two ways at once â€” a written label and a
 * colour â€” so state is never carried by colour alone. Keeping the label, the
 * tint, the icon and the tone in one record is what makes that guarantee
 * maintainable, and it means a status cannot be added in one place and
 * forgotten in another.
 *
 * The labels are the plainest words that are still accurate: "Pending",
 * "Processing", "Completed", "Rejected". No sentence explaining the state of
 * the interface, no "currently being processed in real time". The registrar's
 * queue is the thing being described, and these four words describe it.
 */
type StatusMeta = {
  /** Written out, used verbatim as the accessible name. */
  label: string;
  /** Tint for the chip: background, border and text. */
  chip: string;
  /** The tone handed to the two-tone `Icon` wrapper. */
  tone: IconTone;
  /** IconPark component for this state. */
  icon: typeof Check;
};

export const STATUS_PRESENTATION: Record<RequestStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    chip: "border-pending/30 bg-pending-soft text-pending",
    tone: "pending",
    icon: Time,
  },
  processing: {
    label: "Processing",
    chip: "border-processing/30 bg-processing-soft text-processing",
    tone: "processing",
    icon: Loading,
  },
  completed: {
    label: "Completed",
    chip: "border-completed/30 bg-completed-soft text-completed",
    tone: "completed",
    icon: Check,
  },
  rejected: {
    label: "Rejected",
    chip: "border-rejected/30 bg-rejected-soft text-rejected",
    tone: "rejected",
    icon: Close,
  },
};

/**
 * True while a request is still moving through the queue. This is the only
 * thing that separates "current" from "history", so it lives here rather than
 * being re-derived at each call site.
 */
export function isInFlight(status: RequestStatus): boolean {
  return status === "pending" || status === "processing";
}

/**
 * Status as a small chip: a two-tone icon plus the written label.
 *
 * The label is always visible. The icon and the tint are secondary cues that
 * let a column of states be scanned quickly; neither carries the meaning on
 * its own.
 */
export function StatusPill({ status }: { status: RequestStatus }) {
  const meta = STATUS_PRESENTATION[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-control border px-2 py-[3px] text-[11px] font-semibold leading-4 ${meta.chip}`}>
      <Icon icon={meta.icon} tone={meta.tone} size={13} />
      {meta.label}
    </span>
  );
}
