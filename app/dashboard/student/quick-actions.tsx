"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "@icon-park/react";
import { services } from "../data";
import { Icon } from "../lib/icons";
import { usePressFeedback } from "../lib/use-gsap-context";
import { useScrollReveal } from "../lib/use-scroll-reveal";

/**
 * The service picker: the reason this page exists.
 *
 * Deliberately not a grid of six identical cards. The services are one grouped
 * control â€” a single lifted panel, hairline-separated into cells â€” so it reads
 * as a menu you choose from rather than as the page's layout. The panel's own
 * depth and the sweep on hover give it the weight of the primary action
 * without resorting to six separate containers.
 *
 * The icon chip keeps its tint at rest *and* on hover. A two-tone icon carries
 * its own two colours, so inverting the chip behind it on hover would trade a
 * legible drawing for a muddy one; the hover signal is carried by the cell
 * surface and the arrow instead.
 */
export function QuickActions() {
  const rootRef = useRef<HTMLElement>(null);
  useScrollReveal(rootRef, { distance: 20, stagger: 0.045 });

  return (
    <section
      ref={rootRef}
      id="services"
      aria-labelledby="services-title"
      className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="services-title"
            className="text-balance text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">
            What do you need?
          </h2>
          <p className="mt-1.5 text-[13px] leading-6 text-muted">
            Choose a document to start a request.
          </p>
        </div>
        <p className="font-mono text-[11px] tabular-nums text-muted">
          {services.length} available
        </p>
      </div>

      {/* One container, cells separated by the panel's own background showing
          through 1px gaps: a single border colour and radius for the lot. */}
      <ul className="sd-panel mt-6 grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-3">
        {services.map(({ slug, title, description, icon: Glyph }) => (
          <ServiceCell
            key={slug}
            slug={slug}
            title={title}
            description={description}
            icon={Glyph}
          />
        ))}
      </ul>
    </section>
  );
}

function ServiceCell({
  slug,
  title,
  description,
  icon,
}: {
  slug: string;
  title: string;
  description: string;
  icon: (typeof services)[number]["icon"];
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const handlers = usePressFeedback(ref, { scale: 0.99 });

  return (
    <li data-reveal className="bg-surface">
      <Link
        ref={ref}
        href={`/request/${slug}`}
        className="sd-sweep group relative flex h-full items-start gap-4 p-5 transition-colors hover:bg-sunken sm:p-6"
        {...handlers}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-accent-soft">
          <Icon icon={icon} tone="accent" size={22} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <strong className="text-[14px] font-bold leading-5 tracking-[-0.01em] text-ink">
              {title}
            </strong>
            <Icon
              icon={ArrowRight}
              tone="muted"
              size={16}
              className="mt-0.5 shrink-0 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100 group-focus-visible:translate-x-0.5 group-focus-visible:opacity-100"
            />
          </span>
          <span className="mt-1.5 block text-[12.5px] leading-5 text-muted">
            {description}
          </span>
        </span>
      </Link>
    </li>
  );
}
