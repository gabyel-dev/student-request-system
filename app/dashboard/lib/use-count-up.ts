"use client";

import { useRef } from "react";
import { gsap, REDUCED_MOTION_QUERY } from "./motion";
import { useIsomorphicLayoutEffect } from "./use-gsap-context";

/**
 * Tweens a number up to `target` and writes it straight to the DOM node.
 *
 * The rendered value is deliberately *not* React state. A count-up that
 * calls `setState` on every frame re-renders its whole subtree 60 times a
 * second; writing to `textContent` keeps the number animating while the rest
 * of the dashboard sits idle.
 *
 * Two details that matter:
 *
 * - **Tweens from what is on screen**, not from the previous target. A realtime
 *   status change that lands mid-animation continues from the visible number
 *   instead of snapping.
 * - **SSR renders the real value.** The span starts out with the correct number
 *   in the HTML, so with JavaScript disabled or still loading the student sees
 *   the count, not a zero.
 */
export function useCountUp(target: number, durationMs = 650) {
  const ref = useRef<HTMLSpanElement | null>(null);
  // The number currently on screen. Starts at 0 so the first paint counts up.
  const displayRef = useRef(0);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const context = gsap.context(() => {
      const from = displayRef.current;
      const delta = Math.abs(target - from);

      if (window.matchMedia(REDUCED_MOTION_QUERY).matches || delta === 0) {
        displayRef.current = target;
        element.textContent = String(target);
        return;
      }

      // A big jump (a batch of arrivals at once) gets a short tween. Crawling
      // the number up through every integer is slower than being useful.
      const seconds =
        (durationMs / 1000) * (delta > 8 ? Math.min(0.5, 200 / delta) : 1);
      const counter = { value: from };

      gsap.to(counter, {
        value: target,
        duration: seconds,
        ease: "power2.out",
        // Claim the starting frame before the browser paints, so a realtime
        // update that lands mid-tween continues from the visible number rather
        // than flashing the raw new value first.
        onStart() {
          displayRef.current = Math.round(from);
          element.textContent = String(Math.round(from));
        },
        onUpdate() {
          const rounded = Math.round(counter.value);
          displayRef.current = rounded;
          element.textContent = String(rounded);
        },
        onComplete() {
          displayRef.current = target;
          element.textContent = String(target);
        },
      });
    }, element);

    return () => context.revert();
  }, [target, durationMs]);

  return ref;
}
