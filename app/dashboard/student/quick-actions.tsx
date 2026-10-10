"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  FiArrowRight,
  FiAward,
  FiBookOpen,
  FiClipboard,
  FiFileText,
  FiSend,
  FiShield,
} from "react-icons/fi";
import { services } from "../data";
import { usePressFeedback } from "../lib/use-gsap-context";
import { useScrollReveal } from "../lib/use-scroll-reveal";

type FeatherIcon = typeof FiFileText;

/**
 * Pin a Feather icon per service slug here when the keyword matching below
 * gets one wrong. Anything not listed falls through to the matcher, and
 * anything the matcher misses gets the generic document icon.
 */
const SERVICE_ICON_OVERRIDES: Record<string, FeatherIcon> = {
  // "certificate-of-registration": FiClipboard,
};

/**
 * Resolves a Feather icon for a service without depending on the icon set
 * stored in the data file. Matching runs against slug + title, so it survives
 * renames on either side.
 */
function iconForService(slug: string, title: string): FeatherIcon {
  if (SERVICE_ICON_OVERRIDES[slug]) return SERVICE_ICON_OVERRIDES[slug];
  const text = `${slug} ${title}`.toLowerCase();
  if (/moral|character/.test(text)) return FiShield;
  if (/dismissal|transfer|credential/.test(text)) return FiSend;
  if (/diploma|graduation/.test(text)) return FiAward;
  if (/grade|transcript|\btor\b/.test(text)) return FiBookOpen;
  if (/regist|enrol/.test(text)) return FiClipboard;
  return FiFileText;
}

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
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
            Services
          </p>
          <h2
            id="services-title"
            className="mt-1.5 text-balance text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">
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
  const Glyph = iconForService(slug, title);

  return (
    <li data-reveal className="bg-surface">
      <Link
        ref={ref}
        href={`/request/${slug}`}
        aria-label={`Request ${title}`}
        className="group relative flex h-full items-center gap-5 p-5 transition-colors hover:bg-sunken focus-visible:bg-sunken focus-visible:outline-none sm:p-6"
        {...handlers}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-105">
          <Glyph size={22} aria-hidden="true" />
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
