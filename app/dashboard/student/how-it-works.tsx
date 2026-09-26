"use client";

import { useRef } from "react";
import { Text, List, Refresh } from "@icon-park/react";
import { Icon } from "../lib/icons";
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
 */
const STEPS = [
  {
    icon: Text,
    title: "Pick a document",
    body: "Choose the service you need and fill in the form. You can still edit a request while it is pending.",
  },
  {
    icon: List,
    title: "Get a queue number",
    body: "Your request is numbered in your section's queue, so you always know where you stand.",
  },
  {
    icon: Refresh,
    title: "Watch it move",
    body: "The status changes here as soon as the registrar updates it â€” no refreshing needed.",
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
      <h2
        id="how-it-works-title"
        className="text-balance text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">
        How requesting works
      </h2>

      <div className="relative mt-7">
        {/* Connector, sitting behind the nodes on wide screens only. */}
        <span
          ref={lineRef}
          aria-hidden="true"
          className="absolute left-0 right-0 top-6 hidden h-px origin-left bg-gradient-to-r from-accent-line via-accent-line to-rule-strong lg:block"
        />

        <ol className="grid gap-7 lg:grid-cols-3 lg:gap-8">
          {STEPS.map(({ icon, title, body }) => (
            <li key={title} data-reveal className="relative flex gap-4">
              <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-accent-line bg-surface shadow-raised">
                <Icon icon={icon} tone="accent" size={22} />
              </span>
              <div className="min-w-0 pt-1">
                <h3 className="text-[15px] font-bold tracking-[-0.015em] text-ink">
                  {title}
                </h3>
                <p className="mt-1.5 max-w-[46ch] text-[13px] leading-6 text-muted">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
