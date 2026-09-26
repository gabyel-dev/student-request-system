"use client";

import { useRef } from "react";
import { DuckMascot } from "./duck-mascot";
import { gsap } from "../lib/motion";
import { useIsomorphicLayoutEffect } from "../lib/use-gsap-context";
import {
  SPLASH_COOKIE,
  SPLASH_COOKIE_MAX_AGE,
} from "@/src/lib/auth/splash-cookie";

/**
 * The itikQ splash: the mascot, the wordmark, and then out of the way.
 *
 * Rendered by the server (the parent decides from a cookie) so it is part of the
 * first paint rather than something that arrives after hydration and covers a
 * dashboard the student has already started reading.
 *
 * Three rules keep it from becoming an obstacle:
 *
 *  - **It is skippable.** Click, Enter, Space or Escape dismisses it. Nothing
 *    about reaching the queue number is gated behind a timer.
 *  - **It shows once.** `onDone` sets the cookie, so returning to the dashboard
 *    later — including by clicking Dashboard in the sidebar — does not replay it.
 *  - **It holds still when asked to.** Under reduced motion the entrance and the
 *    lift are both skipped and the hold drops to a fraction of a second. The
 *    mascot still appears; nothing travels.
 *
 * The overlay is `aria-hidden` and takes focus while it is up. The page behind it
 * is untouched in the accessibility tree — a screen reader is not blocked by a
 * visual curtain, and it never needs to hear about this — but focus is parked
 * here so a keyboard user cannot tab into controls they cannot see. Removing a
 * focused element returns focus to the body, so there is nothing to restore.
 *
 * The wordmark is set as text rather than as `/_logo_white.png`. The image is
 * 129KB, and decoding it during a 1.5s curtain delays the thing the student
 * actually came for; live text is sharp at any size and costs nothing.
 */

/** How long the splash holds at full presence before it lifts. */
const HOLD_MS = 1500;
const LIFT_MS = 0.5;
/** Under reduced motion there is no travel to watch, so there is no reason to wait. */
const REDUCED_HOLD_MS = 420;

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  // The DOM handlers are attached before the layout effect has built the
  // timeline, so the skip path is held here rather than closed over directly.
  const dismissRef = useRef<() => void>(() => {});

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let finished = false;
    let exiting = false;

    function finish() {
      if (finished) return;
      finished = true;
      document.cookie = `${SPLASH_COOKIE}=1; path=/; max-age=${SPLASH_COOKIE_MAX_AGE}; samesite=lax`;
      onDone();
    }

    function lift() {
      if (exiting || finished) return;
      exiting = true;
      gsap.to(root, {
        autoAlpha: 0,
        yPercent: -3,
        duration: LIFT_MS,
        ease: "power2.in",
        onComplete: finish,
      });
    }

    dismissRef.current = reduced ? finish : lift;

    // Park focus here for as long as the curtain is up, so Tab cannot walk into
    // the page underneath it.
    root.focus({ preventScroll: true });

    const context = gsap.context(() => {
      if (reduced) {
        gsap.delayedCall(REDUCED_HOLD_MS / 1000, finish);
        return;
      }

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(
          "[data-splash-mascot]",
          {
            autoAlpha: 0,
            y: 30,
            scale: 0.9,
            rotate: -3,
            duration: 0.62,
            ease: "back.out(1.6)",
          },
        )
        .from(
          "[data-splash-word]",
          { autoAlpha: 0, y: 14, duration: 0.4 },
          "-=0.36",
        )
        .from(
          "[data-splash-rule]",
          { scaleX: 0, duration: 0.52, ease: "power3.inOut" },
          "-=0.3",
        )
        .from(
          "[data-splash-sub]",
          { autoAlpha: 0, y: 8, duration: 0.36 },
          "-=0.32",
        );

      gsap.delayedCall(HOLD_MS / 1000, lift);
    }, root);

    return () => context.revert();
  }, [onDone]);

  return (
    <div
      ref={rootRef}
      // Focusable so it can hold focus; not in the tab order, because the
      // Escape and Enter handlers below are the intended way past it.
      tabIndex={-1}
      aria-hidden="true"
      // Reads the ref at event time. Passing `dismissRef.current` straight to
      // the handler would capture the placeholder from the first render, before
      // the layout effect has built the timeline, and the click would do
      // nothing.
      onClick={() => dismissRef.current()}
      onKeyDown={(event) => {
        if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          dismissRef.current();
        }
      }}
      className="fixed inset-0 z-[100] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden bg-mesh-deep outline-none">
      <div className="sd-mesh absolute inset-0" />
      <div className="sd-grain absolute inset-0" />

      <div className="relative flex flex-col items-center px-6">
        <div data-splash-mascot>
          <DuckMascot placement="splash" />
        </div>

        <p
          data-splash-word
          className="mt-7 text-[34px] font-bold leading-none tracking-[-0.03em] text-white sm:text-[40px]">
          itikQ
        </p>

        <span
          data-splash-rule
          aria-hidden="true"
          className="mt-5 block h-px w-40 origin-left bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent"
        />

        <p
          data-splash-sub
          className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-hero-ink-soft">
          Pateros Technological College
        </p>
      </div>
    </div>
  );
}
