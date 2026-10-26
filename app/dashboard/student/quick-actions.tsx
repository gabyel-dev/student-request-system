"use client";

import Link from "next/link";
import { useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import { serviceIcon } from "@/app/components/service-icon";
import { services } from "../data";
import { usePressFeedback } from "../lib/use-motion-helpers";
import { useScrollReveal } from "../lib/use-scroll-reveal";

/**
 * The service picker: the reason this page exists.
 *
 * Deliberately not a grid of six identical cards. The services are one grouped
 * control — a single lifted panel, hairline-separated into rows — so it reads
 * as a menu you choose from rather than as the page's layout. Rows are
 * vertically centered with a generous tap target; the hover signal is carried
 * by the row surface, the chip's scale, and the arrow button filling in.
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
            className="mt-1.5 text-balance text-2xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
            What <span className="text-emerald-600">Services</span> do you need?
          </h2>
        </div>
      </div>

      {/* One container, rows separated by the panel's own background showing
          through 1px gaps: a single border colour and radius for the lot. */}
      <ul className="sd-panel mt-6 grid gap-px overflow-hidden bg-hairline sm:grid-cols-2">
        {services.map(({ slug, title, description }) => (
          <ServiceCell
            key={slug}
            slug={slug}
            title={title}
            description={description}
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
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const handlers = usePressFeedback(ref, { scale: 0.99 });

  return (
    <li data-reveal className="bg-surface">
      <Link
        ref={ref}
        href={`/request/${slug}`}
        aria-label={`Request ${title}`}
        className="group relative flex h-full items-center gap-5 p-5 transition-colors hover:bg-sunken focus-visible:bg-sunken focus-visible:outline-none sm:p-6"
        {...handlers}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-105">
          {serviceIcon(slug)}
        </span>

        <span className="min-w-0 flex-1">
          <strong className="block text-[15px] font-bold leading-5 tracking-[-0.01em] text-ink">
            {title}
          </strong>
          <span className="mt-1 block text-[13px] leading-5 text-muted">
            {description}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-hairline text-muted opacity-0 transition-all duration-300 group-hover:border-accent-line group-hover:text-accent group-hover:opacity-100 group-focus-visible:border-accent-line group-focus-visible:text-accent group-focus-visible:opacity-100">
          <FiArrowRight size={16} />
        </span>
      </Link>
    </li>
  );
}
