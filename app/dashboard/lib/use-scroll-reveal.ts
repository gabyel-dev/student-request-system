"use client";

import { useEffect } from "react";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const REVEAL_ATTRIBUTE = "data-reveal";

export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  scope: React.RefObject<T | null>,
  { distance = 14, stagger = 0.06 }: { distance?: number; stagger?: number } = {},
) {
  useEffect(() => {
    const element = scope.current;
    if (!element) return;
    const targets = Array.from(
      element.querySelectorAll<HTMLElement>(`[${REVEAL_ATTRIBUTE}]`),
    );
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    targets.forEach((target, index) => {
      target.style.setProperty("--reveal-distance", `${distance}px`);
      target.style.setProperty("--reveal-delay", `${index * stagger}s`);
      target.classList.add("sd-reveal");
    });
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sd-reveal-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.1 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [scope, distance, stagger]);
}
