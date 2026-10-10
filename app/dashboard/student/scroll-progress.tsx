"use client";

import { motion, useScroll } from "framer-motion";

/**
 * A hairline reading-progress bar for the top of the viewport.
 *
 * The requesting page is a vertical journey — choose a document, learn the
 * flow, track the request — so knowing how much of it is left is genuinely
 * useful rather than decorative. It is offset past the navigation rail so it
 * never covers the logo.
 *
 * Two details worth noting: the fill is tweened with `scaleX` on a `scrub`, so
 * it tracks the scroll position exactly instead of chasing it; and under
 * reduced motion the hook returns without setting anything, which leaves the
 * fill at its `scale-x-0` class and therefore invisible. No media query is read
 * during render, so there is no server/client mismatch either way.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-0.5 md:left-[76px] lg:left-60">
      <motion.div
        className="h-full w-full origin-left bg-gradient-to-r from-accent via-mesh-bright to-accent"
        style={{ scaleX: scrollYProgress }}
      />
    </div>
  );
}
