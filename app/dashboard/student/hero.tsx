"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowDown, ArrowRight, Plus } from "@icon-park/react";
import { DuckMascot } from "./duck-mascot";
import { HeroCanvas } from "./hero-canvas";
import { StatusPill } from "./status-pill";
import { Icon } from "../lib/icons";
import { gsap } from "../lib/motion";
import { useGsapContext, usePressFeedback } from "../lib/use-gsap-context";
import type { RequestStatus } from "@/src/domain/request";

/**
 * The requesting hero.
 *
 * This is the one place on the page with atmosphere: a layered emerald mesh,
 * drifting glow, a glass panel, and the mascot. Everything below it stays
 * quiet so the hero is a peak rather than a uniform level of noise.
 *
 * The choreography is authored rather than reused from the sections below. The
 * headline wipes up from behind its own descenders, which reads as lettering
 * settling rather than as a box fading; the mascot rises with a slight
 * overshoot and only then starts floating; the mesh parallaxes against the
 * scroll at a fraction of the content's speed. Nothing here is scroll-gated â€”
 * the headline has to be readable the instant the page paints.
 *
 * The hero states what the page does and then gets out of the way. It carries
 * no connection indicator and no "updated just now": the queue count below is
 * real data, and a badge describing the transport would only add a second,
 * vaguer claim about the same thing.
 *
 * The one thing above the fold is the student's own request. If something is
 * in flight, the hero leads with its queue number and status rather than with
 * a count, because the number is the reason they came back to this page.
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
  const trackRef = useRef<HTMLAnchorElement>(null);
  const trackHandlers = usePressFeedback(trackRef, { nudgeSelector: "span" });

  useGsapContext(
    rootRef,
    ({ reduced }) => {
      const root = rootRef.current;
      if (!root) return;

      // Anything this setup attaches by hand, so it can all be handed back as
      // one cleanup. `gsap.context().revert()` only knows about GSAP's own
      // tweens, not about listeners or observers.
      const teardown: Array<() => void> = [];

      if (!reduced) {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

        intro
          .from("[data-hero-mesh]", { autoAlpha: 0, duration: 0.6, ease: "power2.out" })
          .from(
            "[data-hero-line]",
            { yPercent: 118, rotate: 2, duration: 0.62, stagger: 0.07, ease: "power4.out" },
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
            { autoAlpha: 0, y: 46, scale: 0.86, rotate: -4, duration: 0.72, ease: "back.out(1.5)" },
            "-=0.5",
          );

        // The idle float is started on completion rather than on a delay, so it
        // can never overlap the entrance tween and fight it for `y`.
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

        // Ambient loops. Long, linear and endless, so the mesh drifts rather
        // than pulses â€” a pulsing hero reads as an unread notification.
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

        // The WebGL field draws these same pools of light and hides them via
        // `data-webgl`. This loop is started before the field has finished
        // loading, so it is stopped here rather than left ticking against a
        // `display: none` element for the rest of the session.
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

        // Parallax. The section itself carries `bg-mesh-deep`, so sliding the
        // gradient layer down reveals that flat colour instead of a hole. The
        // panel lifts and fades as the hero leaves, so the next section takes
        // over cleanly rather than colliding with it.
        const scrub = {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: true,
        } as const;

        gsap.to("[data-hero-mesh]", { yPercent: 16, ease: "none", scrollTrigger: scrub });
        gsap.to("[data-hero-mascot]", { yPercent: -22, ease: "none", scrollTrigger: scrub });
        gsap.to("[data-hero-panel]", {
          yPercent: 10,
          autoAlpha: 0.3,
          ease: "none",
          scrollTrigger: scrub,
        });
      }

      // The spotlight only makes sense on a device that has a pointer, so it is
      // never wired up on touch.
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
        teardown.push(() => root.removeEventListener("pointermove", onPointerMove));
      }

      return () => {
        for (const fn of teardown) fn();
      };
    },
    [],
  );

  return (
    <section
      ref={rootRef}
      data-hero
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden rounded-tile bg-mesh-deep shadow-hero">
      {/* The CSS mesh stays in the DOM rather than being replaced: it is the
          complete background for a student without WebGL, and it is what shows
          through until the field has proven it can run. */}
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
          {/* Each line is wrapped in its own clipping box so it can rise from
              behind its own baseline instead of sliding in from the left. */}
          <h1
            id="hero-title"
            className="text-[34px] font-bold leading-[1.08] tracking-[-0.035em] text-hero-ink sm:text-[46px] lg:text-[52px]">
            <span className="block overflow-hidden pb-1.5">
              <span data-hero-line className="block">
                Hello, {firstName}.
              </span>
            </span>
            <span className="block overflow-hidden pb-1.5">
              <span data-hero-line className="block font-medium text-hero-ink-soft">
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
            <Link
              ref={trackRef}
              href="#requests"
              data-hero-action
              className="inline-flex items-center gap-2 rounded-control border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              {...trackHandlers}>
              Track my requests
              <span className="shrink-0">
                <Icon icon={ArrowRight} tone="inverse" size={16} />
              </span>
            </Link>
          </div>

          <div
            data-hero-action
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-hero-ink-soft">
            {featured ? (
              <>
                {/* The single most useful fact on the page, linked to the
                    tracker. Real queue number, real status. */}
                <Link
                  href="#requests"
                  className="group inline-flex items-center gap-2.5 rounded-control border border-white/20 bg-white/[0.08] py-1.5 pl-3 pr-2 transition-colors hover:border-white/35 hover:bg-white/15">
                  <span className="font-bold tabular-nums tracking-tight text-white">
                    Queue&nbsp;#{featured.queueNumber}
                  </span>
                  <span className="max-w-[22ch] truncate text-hero-ink-soft">
                    {featured.documentType}
                  </span>
                  <StatusPill status={featured.status} />
                </Link>
                {activeCount > 1 ? (
                  <span>{activeCount - 1} more in your queue</span>
                ) : null}
              </>
            ) : (
              <span>Nothing in your queue yet.</span>
            )}
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
              How it works
              <Icon icon={ArrowDown} tone="inverse" size={14} className="shrink-0" />
            </a>
          </div>
        </div>

        <div data-hero-mascot className="relative shrink-0 self-end lg:self-center">
          <DuckMascot placement="inline" size="lg" />
        </div>
      </div>
    </section>
  );
}
