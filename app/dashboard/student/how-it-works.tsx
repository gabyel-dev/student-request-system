"use client";

import { useRef } from "react";
import { FiFileText, FiHash, FiRefreshCw } from "react-icons/fi";
import { gsap } from "../lib/motion";
import { useIsomorphicLayoutEffect } from "../lib/use-gsap-context";
import { useScrollReveal } from "../lib/use-scroll-reveal";

/**
 * The request lifecycle, stated once.
 *
 * Every step here describes behaviour that already exists: the service form
 * assigns a per-section queue number, and the status updates as the registrar
 * works the queue. Nothing is promised that the product does not do, and the
 * last step says what actually happens rather than announcing that the page is
 * "live".
 *
 * The connector line draws itself in as the section arrives, so the sequence
 * reads as a progression rather than three icons standing next to each other.
 * Icons are Feather throughout — the same set the admin dashboard uses.
 */
const STEPS = [
  {
    icon: FiFileText,
    step: "01",
    title: "Pick a document",
    body: "Choose the service you need and fill in the form. You can still edit a request while it is pending.",
  },
  {
    icon: FiHash,
    step: "02",
    title: "Get a queue number",
    body: "Your request is numbered in your section's queue, so you always know where you stand.",
  },
  {
    icon: FiRefreshCw,
    step: "03",
    title: "Watch it move",
    body: "The status changes here as soon as the registrar updates it — no refreshing needed.",
  },
];

export function HowItWorks() {
  const rootRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  useScrollReveal(rootRef, { distance: 18, stagger: 0.08 });

  useIsomorphicLayoutEffect(() => {
    const line = lineRef.current;
    if (!line) return;

    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(line, { scaleX: 1 });
        return;
      }

      gsap.fromTo(
        line,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 78%",
            end: "top 38%",
            scrub: 0.6,
          },
        },
      );
    }, line);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="scroll-mt-24">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
          How it works
        </p>
        <h2
          id="how-it-works-title"
          className="mt-1.5 text-balance text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">
          Requesting in three steps
        </h2>
      </div>

      <div className="relative mt-8">
        {/* Connector, sitting behind the nodes on wide screens only. */}
        <span
          ref={lineRef}
          aria-hidden="true"
          className="absolute left-0 right-0 top-6 hidden h-px origin-left bg-gradient-to-r from-accent-line via-accent-line to-rule-strong lg:block"
        />

        <ol className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          {STEPS.map(({ icon: Glyph, step, title, body }) => (
            <li key={title} data-reveal className="group relative">
              <div className="flex items-center gap-4">
                <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-accent-line bg-surface text-accent shadow-raised transition-transform duration-300 group-hover:-translate-y-0.5">
                  <Glyph size={21} aria-hidden="true" />
                </span>
                <span className="font-mono text-[11px] font-semibold tabular-nums tracking-[0.14em] text-muted">
                  {step}
                </span>
              </div>
              <h3 className="mt-4 text-[15px] font-bold tracking-[-0.015em] text-ink">
                {title}
              </h3>
              <p className="mt-1.5 max-w-[46ch] text-[13px] leading-6 text-muted">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
