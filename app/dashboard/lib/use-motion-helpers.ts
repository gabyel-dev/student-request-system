"use client";

import { useEffect, useLayoutEffect, useState } from "react";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type PressHandlers = {
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  onPointerEnter: () => void;
};

type PressFeedbackOptions = {
  scale?: number;
  nudgeSelector?: string;
  nudge?: number;
};

export function usePressFeedback<T extends HTMLElement = HTMLButtonElement>(
  _ref: React.RefObject<T | null>,
  { scale = 0.975 }: PressFeedbackOptions = {},
): PressHandlers {
  const [pressed, setPressed] = useState(false);
  const animateScale = (value: number) => {
    const element = _ref.current;
    if (!element || window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    element.animate(
      [{ transform: `scale(${value})` }, { transform: "scale(1)" }],
      { duration: 120, easing: "ease-out", fill: "forwards" },
    );
  };

  return {
    onPointerDown: () => {
      setPressed(true);
      animateScale(scale);
    },
    onPointerUp: () => {
      setPressed(false);
      animateScale(1);
    },
    onPointerCancel: () => {
      setPressed(false);
      animateScale(1);
    },
    onPointerLeave: () => {
      setPressed(false);
      animateScale(1);
    },
    onPointerEnter: () => {
      if (pressed) animateScale(scale);
    },
  };
}
