"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowDown, Plus } from "@icon-park/react";
import { DuckMascot } from "./duck-mascot";
import { HeroCanvas } from "./hero-canvas";
import { StatusPill } from "./status-pill";
import { Icon } from "../lib/icons";
import { gsap } from "../lib/motion";
import {
  useGsapContext,
  useIsomorphicLayoutEffect,
  usePressFeedback,
} from "../lib/use-gsap-context";
import type { RequestStatus } from "@/src/domain/request";

/**
 * The requesting hero.
 *
 * This is the one place on the page with atmosphere: a layered emerald mesh,
 * drifting glow, and the mascot. Everything below it stays quiet so the hero
 * is a peak rather than a uniform level of noise.
 *
 * The interactive centerpiece is the queue ticket: the student's in-flight
 * request rendered as a glass ticket card. It tilts subtly toward the pointer
 * on fine-pointer devices, sweeps a sheen across on hover, and carries a
 * three-stage stepper (Queued → Processing → Ready) built from the request's
 * real status — never a percentage, because the queue has none to give.
 * The whole ticket links to the tracker, so the number is one tap away from
 * its context.
 *
 * The choreography is authored rather than reused from the sections below. The
 * headline wipes up from behind its own descenders; the mascot rises with a
 * slight overshoot and only then starts floating; the mesh parallaxes against
 * the scroll. Nothing here is scroll-gated — the headline has to be readable
 * the instant the page paints.
 */

/** The in-flight request worth showing above the fold, if there is one. */
type FeaturedRequest = {
  queueNumber: number;
  documentType: string;
  status: RequestStatus;
};

export function RequestHero({
  firstName,
  activeCount,
  featured,
}: {
  firstName: string;
  activeCount: number;
  featured?: FeaturedRequest;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLAnchorElement>(null);
  const primaryHandlers = usePressFeedback(primaryRef, { scale: 0.97 });
  const ticketRef = useRef<HTMLAnchorElement>(null);

  useGsapContext(
    rootRef,
    ({ reduced }) => {
      const root = rootRef.current;
      if (!root) return;

      const teardown: Array<() => void> = [];

      if (!reduced) {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

        intro
          .from("[data-hero-mesh]", {
            autoAlpha: 0,
            duration: 0.6,
            ease: "power2.out",
          })
          .from(
            "[data-hero-line]",
            {
              yPercent: 118,
              rotate: 2,
              duration: 0.62,
              stagger: 0.07,
              ease: "power4.out",
            },
            "-=0.34",
          )
          .from(
            "[data-hero-sub]",
            { autoAlpha: 0, y: 12, filter: "blur(6px)", duration: 0.45 },
            "-=0.36",
          )
          .from(
            "[data-hero-action]",
            { autoAlpha: 0, y: 14, scale: 0.96, duration: 0.4, stagger: 0.07 },
            "-=0.3",
          )
          .from(
            "[data-hero-mascot]",
            {
              autoAlpha: 0,
              y: 46,
              scale: 0.86,
              rotate: -4,
              duration: 0.72,
              ease: "back.out(1.5)",
            },
            "-=0.5",
          );

        intro.eventCallback("onComplete", () => {
          gsap.to("[data-hero-mascot]", {
            y: -10,
            rotate: 1.6,
            duration: 4.6,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });

        const orbDrift = gsap.to("[data-orb]", {
          xPercent: (index: number) => (index % 2 ? 16 : -12),
          yPercent: (index: number) => (index % 2 ? 12 : -14),
          scale: 1.14,
          duration: 22,
          ease: "none",
          repeat: -1,
          yoyo: true,
          stagger: 3,
        });

        const webglWatch = new MutationObserver(() => {
          if (root.getAttribute("data-webgl") !== "on") return;
          orbDrift.kill();
          webglWatch.disconnect();
        });
        webglWatch.observe(root, {
          attributes: true,
          attributeFilter: ["data-webgl"],
        });
        teardown.push(() => webglWatch.disconnect());
        gsap.to("[data-grain]", {
          y: 24,
          duration: 9,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });

        const scrub = {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: true,
        } as const;

        gsap.to("[data-hero-mesh]", {
          yPercent: 16,
          ease: "none",
          scrollTrigger: scrub,
        });
        gsap.to("[data-hero-mascot]", {
          yPercent: -22,
          ease: "none",
          scrollTrigger: scrub,
        });
        gsap.to("[data-hero-panel]", {
          yPercent: 10,
          autoAlpha: 0.3,
          ease: "none",
          scrollTrigger: scrub,
        });
      }

      const spotlight = spotlightRef.current;
      if (
        spotlight &&
        window.matchMedia("(hover: hover) and (pointer: fine)").matches
      ) {
        const moveX = gsap.quickTo(spotlight, "x", {
          duration: 0.7,
          ease: "power3.out",
        });
        const moveY = gsap.quickTo(spotlight, "y", {
          duration: 0.7,
          ease: "power3.out",
        });

        function onPointerMove(event: PointerEvent) {
          const box = root!.getBoundingClientRect();
          moveX(event.clientX - box.left);
          moveY(event.clientY - box.top);
        }

        root.addEventListener("pointermove", onPointerMove);
        teardown.push(() =>
          root.removeEventListener("pointermove", onPointerMove),
        );
      }

      return () => {
        for (const fn of teardown) fn();
      };
    },
    [],
  );

  // Ticket tilt: a subtle 3D follow on fine pointers. Skipped entirely for
  // reduced motion and touch, where it would be either unwelcome or invisible.
  useIsomorphicLayoutEffect(() => {
    const el = ticketRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;

    gsap.set(el, { transformPerspective: 900 });
    const rX = gsap.quickTo(el, "rotationX", {
      duration: 0.6,
      ease: "power3.out",
    });
    const rY = gsap.quickTo(el, "rotationY", {
      duration: 0.6,
      ease: "power3.out",
    });

    function onMove(event: PointerEvent) {
      const box = el!.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width - 0.5;
      const py = (event.clientY - box.top) / box.height - 0.5;
      rY(px * 8);
      rX(-py * 8);
    }
    function onLeave() {
      rX(0);
      rY(0);
    }

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [featured]);

  return (
    <section
      ref={rootRef}
      data-hero
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden rounded-tile bg-mesh-deep shadow-hero">
      <div data-hero-mesh className="sd-mesh absolute inset-0 -z-10" />
      <HeroCanvas />
      <div data-orb className="sd-orb sd-orb--a" aria-hidden="true" />
      <div data-orb className="sd-orb sd-orb--b" aria-hidden="true" />
      <div data-orb className="sd-orb sd-orb--c" aria-hidden="true" />
      <div
        ref={spotlightRef}
        data-hero-spotlight
        className="sd-spotlight"
        aria-hidden="true"
      />
      <div className="sd-mesh-grid" aria-hidden="true" />
      <div data-grain className="sd-grain" aria-hidden="true" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-5 pb-12 pt-12 sm:px-8 sm:pb-14 sm:pt-14 lg:flex-row lg:items-center lg:gap-10 lg:px-10 lg:pb-16 lg:pt-16">
        <div data-hero-panel className="min-w-0 flex-1">
          <h1
            id="hero-title"
            className="text-[34px] font-bold leading-[1.08] tracking-[-0.035em] text-hero-ink sm:text-[46px] lg:text-[52px]">
            <span className="block overflow-hidden pb-1.5">
              <span data-hero-line className="block">
                Hello, {firstName}.
              </span>
            </span>
            <span className="block overflow-hidden pb-1.5">
              <span
                data-hero-line
                className="block font-medium text-hero-ink-soft">
                What would you like to request?
              </span>
            </span>
          </h1>

          <p
            data-hero-sub
            className="mt-5 max-w-[52ch] text-[15px] leading-7 text-hero-ink-soft">
            Pick a document, get a queue number, and follow it through the
            registrar&rsquo;s desk.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              ref={primaryRef}
              href="#services"
              data-hero-action
              className="inline-flex items-center gap-2 rounded-control bg-white px-5 py-3 text-sm font-bold text-mesh-mid shadow-[0_10px_30px_-10px_rgba(0,0,0,.5)] transition-colors hover:bg-hero-ink"
              {...primaryHandlers}>
              <Icon icon={Plus} tone="accent" size={16} className="shrink-0" />
              Start a request
            </Link>
          </div>

          <div data-hero-action className="mt-7">
            {featured ? (
              <Link
                ref={ticketRef}
                href="#requests"
                aria-label={`Track your ${featured.documentType} request, queue number ${featured.queueNumber}`}
                className="group relative block w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)] backdrop-blur-md transition-colors hover:border-white/25">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200/70">
                      Your queue ticket
                    </p>
                    <p className="mt-1.5 text-[34px] font-bold leading-none tabular-nums tracking-tight text-white">
                      #{String(featured.queueNumber).padStart(3, "0")}
                    </p>
                    <p className="mt-1.5 max-w-[26ch] truncate text-[13px] text-white/65">
                      {featured.documentType}
                    </p>
                  </div>
                  <StatusPill status={featured.status} />
                </div>

                <div
                  aria-hidden="true"
                  className="relative my-4 border-t border-dashed border-white/20"
                />

                <div className="relative">
                  <Stepper status={featured.status} />
                </div>

                {activeCount > 1 ? (
                  <p className="relative mt-4 text-[12px] font-medium text-white/55 transition-colors group-hover:text-white/85">
                    {activeCount - 1} more in your queue
                    <span aria-hidden="true"> →</span>
                  </p>
                ) : null}
              </Link>
            ) : (
              <p className="text-[13px] text-hero-ink-soft">
                Nothing in your queue yet. Your ticket will appear here.
              </p>
            )}

            <a
              href="#how-it-works"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-hero-ink-soft transition-colors hover:text-white">
              How it works
              <Icon
                icon={ArrowDown}
                tone="inverse"
                size={14}
                className="shrink-0"
              />
            </a>
          </div>
        </div>

        <div
          data-hero-mascot
          className="relative shrink-0 self-end lg:self-center">
          <DuckMascot placement="inline" size="lg" />
        </div>
      </div>
    </section>
  );
}

/**
 * Three honest stages of a request's life. Finished stages are filled, the
 * current one pulses gently, upcoming ones stay dim. The active stage is
 * exposed via `aria-current` so assistive tech gets the same information.
 */
function Stepper({ status }: { status: RequestStatus }) {
  const stages = ["Queued", "Processing", "Ready"] as const;
  const current = status === "pending" ? 0 : status === "processing" ? 1 : 2;

  return (
    <ol className="flex items-start" aria-label="Request progress">
      {stages.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={`flex items-center ${index < stages.length - 1 ? "flex-1" : ""}`}>
            <span className="flex flex-col items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] font-bold transition-colors ${
                  done
                    ? "border-emerald-300 bg-emerald-300 text-emerald-950"
                    : active
                      ? "animate-pulse border-emerald-300/80 bg-emerald-300/15 text-emerald-200"
                      : "border-white/20 text-white/35"
                }`}>
                {done ? "✓" : index + 1}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${
                  index <= current ? "text-white/75" : "text-white/35"
                }`}>
                {label}
              </span>
            </span>
            {index < stages.length - 1 ? (
              <span
                aria-hidden="true"
                className={`mx-2 mb-6 h-px flex-1 ${
                  index < current ? "bg-emerald-300/60" : "bg-white/15"
                }`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
