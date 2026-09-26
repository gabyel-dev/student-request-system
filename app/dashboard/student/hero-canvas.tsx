"use client";

import { useEffect, useRef } from "react";
import { gsap, REDUCED_MOTION_QUERY, ScrollTrigger } from "../lib/motion";
import type { HeroField } from "../lib/hero-field";

/**
 * Mounts the WebGL hero backdrop and drives it with GSAP.
 *
 * Three.js is loaded with a dynamic `import()` rather than a static one, so it
 * arrives in its own chunk after the page has already painted. The hero is
 * readable and the CSS layer below is a complete background on its own, so
 * nothing here is on the critical path.
 *
 * Two things can go wrong on a student's machine, and both have to be quiet:
 *
 *  - No WebGL, or the context is lost. `createHeroField` returns `null`, the
 *    canvas stays transparent, and the CSS mesh underneath is never touched.
 *  - Reduced motion is requested. The field draws one still frame and never
 *    starts its loop, and the pointer and scroll effects are not attached.
 *
 * The canvas also reports itself to the DOM with `data-webgl="on"`, which is
 * what lets `globals.css` drop the CSS orb layer that this field replaces.
 */
export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Flips to true when the effect is torn down. The dynamic import resolves
    // on a later tick, so without this a fast navigation could create a scene
    // that nothing owns and that no one will ever dispose.
    let disposed = false;
    // Held here rather than inside the async body: the effect cleanup is the
    // only thing guaranteed to run, and it is the only owner of the scene.
    let release: (() => void) | null = null;

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    // Touch gets no pointer light. A tap would otherwise leave a highlight
    // stranded wherever the finger lifted.
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    void (async () => {
      const { createHeroField } = await import("../lib/hero-field");
      if (disposed) return;

      const field: HeroField | null = createHeroField(canvas, {
        reduced: reducedMotion,
      });
      // No WebGL, or the context was refused. The CSS mesh below is a complete
      // background, so this is a no-op rather than a fallback path.
      if (!field) return;

      const teardown: Array<() => void> = [];
      release = () => {
        for (const fn of teardown) fn();
        field.dispose();
      };
      // Unmounted during the await: hand the scene straight back.
      if (disposed) {
        release();
        return;
      }

      // Flagged before the fade so the orbs are gone by the time any of the
      // WebGL output is visible. A brief overlap is invisible; a pop-in is not.
      const hero = canvas.closest<HTMLElement>("[data-hero]");
      hero?.setAttribute("data-webgl", "on");
      teardown.push(() => hero?.removeAttribute("data-webgl"));

      gsap.to(canvas, {
        opacity: 1,
        duration: reducedMotion ? 0 : 0.8,
        ease: "power2.out",
        overwrite: true,
      });

      if (reducedMotion) {
        // Nothing to drive. The still frame is already the finished image.
        return;
      }

      const context = gsap.context(() => {
        // Scroll progress through the hero. Dims and lowers the light so the
        // page below takes over instead of being upstaged by the backdrop.
        ScrollTrigger.create({
          trigger: hero ?? canvas,
          start: "top top",
          end: "bottom top",
          onUpdate: (self) => field.setScroll(self.progress),
        });

        if (finePointer) {
          // Smoothed rather than mapped straight to the uniform: a raw
          // position makes the whole field twitch with every mouse sample.
          const pointer = { x: 0.5, y: 0.5 };
          const glideX = gsap.quickTo(pointer, "x", {
            duration: 0.7,
            ease: "power3.out",
          });
          const glideY = gsap.quickTo(pointer, "y", {
            duration: 0.7,
            ease: "power3.out",
          });

          const onMove = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            glideX((event.clientX - rect.left) / rect.width);
            glideY(1 - (event.clientY - rect.top) / rect.height);
          };
          // Returns the light to the middle of the field on exit, so it never
          // sits under one edge of the layout after the cursor leaves.
          const onLeave = () => {
            glideX(0.5);
            glideY(0.5);
          };
          // One uniform write per frame, independent of the render loop's own
          // frame rate, so the light stays smooth at 30fps.
          const push = () => field.setPointer(pointer.x, pointer.y);

          window.addEventListener("pointermove", onMove, { passive: true });
          document.addEventListener("pointerleave", onLeave);
          gsap.ticker.add(push);

          teardown.push(() => {
            window.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerleave", onLeave);
            gsap.ticker.remove(push);
          });
        }

        // A backgrounded tab and a hero scrolled past both mean nobody is
        // looking at the field, so it stops asking for frames.
        let inView = true;
        const sync = () => field.setPaused(document.hidden || !inView);
        const onVisibility = () => sync();

        const observer = new IntersectionObserver((entries) => {
          inView = entries[entries.length - 1]?.isIntersecting ?? true;
          sync();
        });
        observer.observe(canvas);
        document.addEventListener("visibilitychange", onVisibility);

        teardown.push(() => {
          observer.disconnect();
          document.removeEventListener("visibilitychange", onVisibility);
        });
      }, hero ?? canvas);

      teardown.push(() => context.revert());
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
      // Starts transparent so the CSS layer is what shows until the field is
      // proven to be running.
      className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
    />
  );
}
