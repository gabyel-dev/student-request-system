"use client";

import { gsap, ScrollTrigger } from "./motion";
import { useIsomorphicLayoutEffect } from "./use-gsap-context";

/** Attribute marking elements that should fade up as they enter the viewport. */
export const REVEAL_ATTRIBUTE = "data-reveal";

type RevealOptions = {
  /** Distance in pixels the element travels up into place. */
  distance?: number;
  /** Stagger between matched elements. */
  stagger?: number;
};

/**
 * Fades and lifts marked elements as they scroll into view, once each.
 *
 * Uses `ScrollTrigger.batch` rather than one trigger per element: batches are
 * created and recycled as elements enter and leave, so a long dashboard costs
 * the same as a short one. `once: true` kills each trigger after it plays, so
 * nothing keeps recalculating on scroll.
 *
 * Applies to the two secondary sections only (services, profile). The primary
 * content — greeting, queue counts, the request list — is never scroll-gated,
 * because gating content below the fold on an animation is how a dashboard
 * ends up feeling slow.
 *
 * No-ops under reduced motion: elements are set to their final state, which
 * is also the state the server rendered, so there is nothing to undo.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  scope: React.RefObject<T | null>,
  { distance = 14, stagger = 0.06 }: RevealOptions = {},
) {
  useIsomorphicLayoutEffect(() => {
    const element = scope.current;
    if (!element) return;

    const targets = gsap.utils.toArray<HTMLElement>(
      `[${REVEAL_ATTRIBUTE}]`,
      element,
    );
    if (!targets.length) return;

    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(targets, { clearProps: "all" });
        return;
      }

      // `top 92%` means an element starts animating while it is still just
      // below the fold, so it has finished arriving by the time it is read.
      // `once` removes the trigger after playback.
      ScrollTrigger.batch(targets, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.fromTo(
            batch,
            { autoAlpha: 0, y: distance },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.42,
              ease: "power3.out",
              stagger,
              overwrite: true,
            },
          ),
      });
    }, element);

    return () => context.revert();
  }, [scope, distance, stagger]);
}
