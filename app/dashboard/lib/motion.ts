import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single place where GSAP is configured for the whole dashboard.
 *
 * Every module-level import of this file registers the plugin once and
 * applies the shared defaults, so no component has to remember to call
 * `registerPlugin` or pick an easing curve. Durations stay short on
 * purpose: this is a portal people open to check a queue number, not a
 * marketing page.
 */

// Registered at module scope. `registerPlugin` is idempotent, and doing it
// here means ScrollTrigger is ready before any component's layout effect
// runs — no first-scroll dropouts.
gsap.registerPlugin(ScrollTrigger);

gsap.defaults({ ease: "power2.out", duration: 0.4 });

/** Easing curves. Use one of these rather than raw strings. */
export const EASE = {
  /** Standard entrance: decelerates, lands softly. */
  enter: "power3.out",
  /** Default UI motion. */
  out: "power2.out",
  /** For values that travel in both directions (progress bars). */
  inOut: "power2.inOut",
  /** Exits, so they feel quicker than entrances. */
  exit: "power2.in",
} as const;

/** Durations in seconds. Nothing here exceeds 0.5. */
export const DURATION = {
  /** Hover-ish feedback, scrim fades. */
  fast: 0.18,
  /** Menus, chips, press feedback. */
  base: 0.28,
  /** Entrance moves and the queue progress tween. */
  enter: 0.42,
} as const;

/** Staggers in seconds. */
export const STAGGER = {
  tight: 0.035,
  base: 0.055,
} as const;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Synchronous check for the user's motion preference.
 *
 * `gsap.matchMedia()` is the reactive way to do this and is what the
 * animation hooks use, so a mid-session preference change is picked up.
 * This helper exists for the rare call site that needs an immediate answer
 * outside a context (for example deciding whether to mount a scroll
 * listener at all).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export { gsap, ScrollTrigger };
