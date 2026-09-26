"use client";

import Link from "next/link";
import { useRef } from "react";
import { Plus } from "@icon-park/react";
import { Icon } from "../lib/icons";
import { usePressFeedback } from "../lib/use-gsap-context";

/**
 * The application bar.
 *
 * Fixed rather than sticky, because the shell sets `overflow-x-hidden` on
 * `<main>`; an overflow container becomes its own scrollport, so
 * `position: sticky` inside it would never engage. Fixed escapes that, which
 * is why the bar is offset with the same `md:left-[84px] lg:left-60` values the
 * shell uses for the rail instead of inheriting its margin.
 *
 * On mobile its left inset clears the sidebar's floating menu button, so the
 * two read as one bar rather than as a button parked on top of a header.
 *
 * It carries the brand (where the rail is collapsed to a button) and the one
 * action a student comes here to take. Nothing else: no search, no
 * notifications bell, no account menu â€” those would be controls that do
 * nothing here.
 */
export function DashboardHeader() {
  const requestRef = useRef<HTMLAnchorElement>(null);
  const requestHandlers = usePressFeedback(requestRef, { scale: 0.97 });

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-hairline bg-surface md:left-[84px] lg:left-60">
      <div className="flex h-full items-center gap-3 pl-[4.25rem] pr-4 sm:pr-[21px] md:pl-[21px] lg:px-8">
        {/* The rail already shows the mark from `md` up, so the bar only needs
            to identify itself at the widths where the rail is a button. */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 md:hidden"
          aria-label="itikQ dashboard">
          <img
            src="/_logo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded object-contain"
          />
          <span className="text-[15px] font-bold tracking-[-0.02em] text-ink">
            itikQ
          </span>
        </Link>

        <p className="hidden text-[13px] font-medium text-muted md:block">
          Student services
        </p>

        <Link
          ref={requestRef}
          href="/request"
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-control bg-accent px-3 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover"
          {...requestHandlers}>
          <Icon icon={Plus} tone="inverse" size={15} />
          New request
        </Link>
      </div>
    </header>
  );
}
