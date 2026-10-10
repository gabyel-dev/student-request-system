import { FiCheckCircle, FiClock, FiLoader, FiXCircle } from "react-icons/fi";
import type { RequestStatus } from "@/src/domain/request";

/**
 * The single source of truth for how a request's status looks and reads.
 *
 * Every status is communicated two ways at once — a written label and a
 * colour — so state is never carried by colour alone. Keeping the label, the
 * tint and the icon in one record is what makes that guarantee maintainable,
 * and it means a status cannot be added in one place and forgotten in another.
 *
 * Icons come from the same Feather set the admin uses, so the two dashboards
 * speak one icon language. The labels are the plainest words that are still
 * accurate: "Pending", "Processing", "Completed", "Rejected".
 */
type StatusMeta = {
  /** Written out, used verbatim as the accessible name. */
  label: string;
  /** Tint for the chip: background, border and text. */
  chip: string;
  /** Feather icon for this state. */
  icon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
};

export const STATUS_PRESENTATION: Record<RequestStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    chip: "border-pending/30 bg-pending-soft text-pending",
    icon: FiClock,
  },
  processing: {
    label: "Processing",
    chip: "border-processing/30 bg-processing-soft text-processing",
    icon: FiLoader,
  },
  completed: {
    label: "Completed",
    chip: "border-completed/30 bg-completed-soft text-completed",
    icon: FiCheckCircle,
  },
  rejected: {
    label: "Rejected",
    chip: "border-rejected/30 bg-rejected-soft text-rejected",
    icon: FiXCircle,
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
 * Status as a small pill: a Feather icon plus the written label.
 *
 * The label is always visible. The icon and the tint are secondary cues that
 * let a column of states be scanned quickly; neither carries the meaning on
 * its own.
 */
export function StatusPill({ status }: { status: RequestStatus }) {
  const meta = STATUS_PRESENTATION[status];
  const Glyph = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-4 ${meta.chip}`}>
      <Glyph aria-hidden="true" className="text-[13px]" />
      {meta.label}
    </span>
  );
}
