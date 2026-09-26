"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "@icon-park/react";
import { Icon } from "../lib/icons";
import { useCountUp } from "../lib/use-count-up";
import { usePressFeedback } from "../lib/use-gsap-context";
import { useScrollReveal } from "../lib/use-scroll-reveal";
import { getInitials } from "../helpers";
import type { Student } from "../types";

/**
 * The quiet strip at the foot of the page.
 *
 * Profile and totals are reference information, not tasks, so they share one
 * slim bar rather than a section of their own. The counts are small and inline
 * rather than a row of large figures, which keeps the numbers from pretending
 * to be the point of the page. Every figure here is counted from the student's
 * own requests â€” nothing is estimated or projected.
 */
export function StudentDetails({
  student,
  total,
  active,
  completed,
}: {
  student: Student;
  total: number;
  active: number;
  completed: number;
}) {
  const rootRef = useRef<HTMLElement>(null);
  useScrollReveal(rootRef, { distance: 10, stagger: 0.04 });
  const reviewRef = useRef<HTMLAnchorElement>(null);
  const reviewHandlers = usePressFeedback(reviewRef, { nudgeSelector: "span" });

  const totalRef = useCountUp(total);
  const activeRef = useCountUp(active);
  const completedRef = useCountUp(completed);

  return (
    <section
      ref={rootRef}
      aria-label="Profile and request totals"
      className="sd-panel flex flex-wrap items-center gap-x-6 gap-y-4 px-5 py-4 sm:px-6">
      <div data-reveal className="flex min-w-0 items-center gap-3">
        {student.profilePictureUrl ? (
          <img
            src={student.profilePictureUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-[12px] font-bold text-accent">
            {getInitials(student.name)}
          </span>
        )}
        <span className="min-w-0">
          <strong className="block truncate text-[13px] font-semibold text-ink">
            {student.name}
          </strong>
          <span className="block truncate font-mono text-[11px] tabular-nums text-muted">
            {student.studentNumber} &middot; {student.section}
          </span>
        </span>
      </div>

      <dl
        data-reveal
        className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
        <Total label="requests" valueRef={totalRef} value={total} />
        <Total label="in queue" valueRef={activeRef} value={active} accent />
        <Total label="completed" valueRef={completedRef} value={completed} />
      </dl>

      <Link
        ref={reviewRef}
        href="/onboarding"
        data-reveal
        className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent transition-colors hover:text-accent-hover"
        {...reviewHandlers}>
        Review profile
        <span className="shrink-0">
          <Icon icon={ArrowRight} tone="accent" size={14} />
        </span>
      </Link>
    </section>
  );
}

function Total({
  label,
  value,
  valueRef,
  accent = false,
}: {
  label: string;
  value: number;
  valueRef: React.RefObject<HTMLSpanElement | null>;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span
          ref={valueRef}
          className={`font-mono text-[13px] font-bold tabular-nums ${
            accent ? "text-accent" : "text-ink"
          }`}>
          {value}
        </span>{" "}
        {label}
      </dd>
    </div>
  );
}
