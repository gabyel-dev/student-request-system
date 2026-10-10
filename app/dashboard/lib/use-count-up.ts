"use client";

import { useEffect, useRef } from "react";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function useCountUp(target: number, durationMs = 650) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const from = Number(element.textContent ?? target);
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      element.textContent = String(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 2);
      element.textContent = String(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return ref;
}
