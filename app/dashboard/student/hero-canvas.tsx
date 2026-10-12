"use client";

import { useEffect, useRef } from "react";
import type { HeroField } from "../lib/hero-field";

/**
 * WebGL hero backdrop. Three.js loads in its own chunk after paint; the CSS
 * mesh underneath is a complete background, so a missing WebGL context is a
 * quiet no-op. Reduced motion gets one still frame and no effects.
 */
export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false; // guards the async import against fast unmounts
    let release: (() => void) | null = null;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    void (async () => {
      const { createHeroField } = await import("../lib/hero-field");
      if (disposed) return;

      const field: HeroField | null = createHeroField(canvas, {
        reduced: reducedMotion,
      });
      if (!field) return; // no WebGL — the CSS layer stays

      const teardown: Array<() => void> = [];
      release = () => {
        for (const fn of teardown) fn();
        field.dispose();
      };
      if (disposed) {
        release();
        return;
      }

      const hero = canvas.closest<HTMLElement>("[data-hero]");
      hero?.setAttribute("data-webgl", "on");
      teardown.push(() => hero?.removeAttribute("data-webgl"));

      canvas.style.opacity = "1";
      if (reducedMotion) return;

      // Pause when scrolled past or the tab is hidden.
      const observer = new IntersectionObserver(
        ([entry]) => field.setPaused(!entry.isIntersecting || document.hidden),
        { threshold: [0, 1] },
      );
      observer.observe(hero ?? canvas);
      teardown.push(() => observer.disconnect());

      const onVisibility = () => field.setPaused(document.hidden);
      document.addEventListener("visibilitychange", onVisibility);
      teardown.push(() =>
        document.removeEventListener("visibilitychange", onVisibility),
      );

      // Smoothed pointer light, mouse devices only.
      if (finePointer) {
        const pointer = { x: 0.5, y: 0.5 };
        const target = { x: 0.5, y: 0.5 };

        const onMove = (event: PointerEvent) => {
          const rect = canvas.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          target.x = (event.clientX - rect.left) / rect.width;
          target.y = 1 - (event.clientY - rect.top) / rect.height;
        };
        const onLeave = () => {
          target.x = 0.5;
          target.y = 0.5;
        };

        let frame = 0;
        const tick = () => {
          pointer.x += (target.x - pointer.x) * 0.08;
          pointer.y += (target.y - pointer.y) * 0.08;
          field.setPointer(pointer.x, pointer.y);
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);

        window.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("pointerleave", onLeave);
        teardown.push(() => {
          window.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerleave", onLeave);
          cancelAnimationFrame(frame);
        });
      }
    })();

    return () => {
      disposed = true;
      release?.();
      release = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
    />
  );
}
