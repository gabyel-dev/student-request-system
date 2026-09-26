"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap, REDUCED_MOTION_QUERY } from "./motion";

/**
 * `useLayoutEffect` that does not warn during server rendering.
 *
 * Entrance animations must run before the browser paints, otherwise the
 * page renders at full opacity and then snaps to the animation's start
 * state — a visible flash on every navigation.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type GsapSetup = (context: {
  /** The scoping element, so selector strings can't reach outside the component. */
  scope: HTMLElement;
  /** True when the user asked for reduced motion. Animate nothing. */
  reduced: boolean;
}) => void;

/**
 * Runs a GSAP setup function inside a `gsap.context()` scoped to `scopeRef`,
 * and tears everything down on unmount or when the dependencies change.
 *
 * Two things this buys over a bare `useLayoutEffect`:
 *
 * 1. **Automatic cleanup.** `ctx.revert()` restores every element the
 *    animations touched to its pre-animation inline state. Without this,
 *    opening the mobile drawer or a menu and then navigating away leaves
 *    `transform: translateX(...)` and `opacity: 0` stuck on the DOM, and
 *    the next mount starts from the wrong place.
 * 2. **Reduced motion handled once.** The setup receives `reduced` and
 *    takes a static branch, so callers do not each re-check the media query.
 *
 * The setup runs inside `gsap.matchMedia()`, so a user who toggles reduced
 * motion while the page is open gets the static state without a reload.
 */
export function useGsapContext(
  scope: React.RefObject<HTMLElement | null>,
  setup: GsapSetup,
  deps: React.DependencyList = [],
) {
  // Held in a ref so a new function identity between renders does not tear
  // the context down and replay the entrance animation.
  const setupRef = useRef(setup);
  useIsomorphicLayoutEffect(() => {
    setupRef.current = setup;
  });

  useIsomorphicLayoutEffect(() => {
    const element = scope.current;
    if (!element) return;

    const context = gsap.context(() => {
      const media = gsap.matchMedia();

      // Concise bodies, so a setup that returns a cleanup function (an event
      // listener, say) has that cleanup handed to `media.revert()` instead of
      // being dropped.
      media.add(REDUCED_MOTION_QUERY, () =>
        // Reduced motion: the context still runs so components can put their
        // final state in place, but with `reduced: true` so nothing moves.
        setupRef.current({ scope: element, reduced: true }),
      );

      media.add("(prefers-reduced-motion: no-preference)", () =>
        setupRef.current({ scope: element, reduced: false }),
      );

      return () => media.revert();
    }, element);

    return () => context.revert();
    // `deps` is the caller's deliberate dependency list, forwarded verbatim.
  }, deps);
}

type PressSetters = {
  press: () => void;
  release: () => void;
  hover: (on: boolean) => void;
};

type PressHandlers = {
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  onPointerEnter: () => void;
};

type PressFeedbackOptions = {
  /** How far the control dips on press. */
  scale?: number;
  /**
   * Optional selector for a child icon that slides slightly toward the
   * pointer's edge on hover. A small nudge reads as responsive without
   * moving the control itself.
   */
  nudgeSelector?: string;
  /** Nudge distance in pixels. */
  nudge?: number;
};

/**
 * Press and hover feedback for one control, built from `gsap.quickTo`.
 *
 * `quickTo` reuses a single tween per property, so holding a button down does
 * not accumulate tweens — this is the difference between a control that feels
 * crisp and one that gets progressively mushy.
 *
 * The ref is passed in rather than created here so the component keeps ownership
 * of its own DOM reference and the hook only adds behaviour.
 *
 * Inert under reduced motion, and fully reverted on unmount.
 *
 * Returned handlers are rebuilt each render, which is free here: React only
 * re-binds the listener.
 */
export function usePressFeedback<T extends HTMLElement = HTMLButtonElement>(
  ref: React.RefObject<T | null>,
  { scale = 0.975, nudgeSelector, nudge = 3 }: PressFeedbackOptions = {},
): PressHandlers {
  const settersRef = useRef<PressSetters | null>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    const context = gsap.context(() => {
      const toScale = gsap.quickTo(element, "scale", {
        duration: 0.12,
        ease: "power2.out",
      });
      const toRest = gsap.quickTo(element, "scale", {
        duration: 0.24,
        ease: "power2.out",
      });

      const nudged = nudgeSelector ? element.querySelector(nudgeSelector) : null;
      const toNudge = nudged
        ? gsap.quickTo(nudged, "x", { duration: 0.28, ease: "power2.out" })
        : null;

      settersRef.current = {
        press: () => toScale(scale),
        release: () => toRest(1),
        hover: (on: boolean) => {
          toNudge?.(on ? nudge : 0);
        },
      };
    }, element);

    return () => {
      settersRef.current = null;
      context.revert();
    };
  }, [ref, scale, nudge, nudgeSelector]);

  return {
    onPointerDown: () => settersRef.current?.press(),
    onPointerUp: () => settersRef.current?.release(),
    onPointerCancel: () => settersRef.current?.release(),
    onPointerLeave: () => {
      settersRef.current?.release();
      settersRef.current?.hover(false);
    },
    onPointerEnter: () => settersRef.current?.hover(true),
  };
}
