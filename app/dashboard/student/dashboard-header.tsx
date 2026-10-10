"use client";

import Link from "next/link";
import { useRef } from "react";
import { Plus } from "@icon-park/react";
import { Icon } from "../lib/icons";
import { usePressFeedback } from "../lib/use-gsap-context";

/**
 * The application bar.
 *
 * Fixed rather than sticky, because the shell can set overflow on `<main>`;
 * an overflow container becomes its own scrollport, so `position: sticky`
 * inside it would never engage. Fixed escapes that, which is why the bar is
 * offset with the same `md:left-[76px] lg:left-60` values the shell uses for
 * the rail instead of inheriting its margin.
 *
 * On mobile it sits below the sidebar's sticky top bar (`top-14`), which owns
 * the menu button and the brand — so this bar only carries the page label and
 * the one action a student comes here to take. Nothing else: no search, no
 * notifications bell, no account menu.
 */
export function DashboardHeader() {
  const requestRef = useRef<HTMLAnchorElement>(null);
  const requestHandlers = usePressFeedback(requestRef, { scale: 0.97 });

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-hairline bg-surface md:left-[76px] md:top-0 lg:left-60">
      <div className="flex h-full items-center gap-3 px-4 md:px-5 lg:px-8">
        <p className="text-[13px] font-medium text-muted">Student services</p>

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
