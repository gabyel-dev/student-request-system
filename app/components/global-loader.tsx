"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

// How long to wait before showing the spinner. Quick requests finish
// before this fires, so the screen never flickers on fast loads.
const SHOW_DELAY_MS = 180;

// Safety valve: if a page change never finishes, stop waiting after
// this long instead of leaving the spinner stuck on screen forever.
const NAV_TIMEOUT_MS = 8000;

/* ------------------------------------------------------------------ */
/* Context: manual start/stop for anything fetch() can't see            */
/* ------------------------------------------------------------------ */

type LoadingControls = {
  start: () => void;
  stop: () => void;
  /** Treat a programmatic router.push() like a link click. */
  startNavigation: () => void;
};

const LoadingContext = createContext<LoadingControls | null>(null);

export function useGlobalLoading() {
  const controls = useContext(LoadingContext);
  if (!controls) {
    throw new Error(
      "useGlobalLoading must be used inside <GlobalLoadingProvider>",
    );
  }
  return controls;
}

/* ------------------------------------------------------------------ */
/* Spinner: a brand-green orbit with a pulsing core.                   */
/* ------------------------------------------------------------------ */

function LoadingIndicator() {
  return (
    <>
      <style>{`
        @keyframes loader-orbit { to { transform: rotate(360deg); } }
        @keyframes loader-breathe {
          0%, 100% { transform: scale(.78); opacity: .55; }
          50% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <span className="relative grid h-14 w-14 place-items-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-[3px] border-hairline"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-r-accent/40 border-t-accent animate-[loader-orbit_0.9s_linear_infinite] motion-reduce:animate-none"
        />
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full bg-accent animate-[loader-breathe_1.4s_ease-in-out_infinite] motion-reduce:animate-none"
        />
      </span>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Hook: every fetch() call automatically spins the loader             */
/* ------------------------------------------------------------------ */

// Module-level flag: StrictMode remounts must not patch fetch twice.
let fetchPatched = false;

function useFetchLoading(start: () => void, stop: () => void) {
  useEffect(() => {
    if (fetchPatched) return;
    fetchPatched = true;

    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      // Silent auth refresh runs in the background — never spin for it.
      const isSilentAuth = url.includes("/api/auth/refresh");
      // The assistant runs its own requests; a full-screen spinner would
      // cover the panel that triggered them.
      const isAssistant = url.includes("/api/assistant/");
      // The admin email progress widget polls in the background. Spinning the
      // whole page every second would make the dashboard unusable.
      const isEmailProgress = url.includes("/api/admin/email-jobs");
      const isBackground = isSilentAuth || isAssistant || isEmailProgress;
      if (!isBackground) start();

      return originalFetch(input, init).then(
        (response) => {
          if (!isBackground) stop();
          return response;
        },
        (error) => {
          if (!isBackground) stop();
          throw error;
        },
      );
    };

    return () => {
      window.fetch = originalFetch;
      fetchPatched = false;
    };
  }, [start, stop]);
}

/* ------------------------------------------------------------------ */
/* Hook: page changes spin the loader until the new URL lands          */
/* ------------------------------------------------------------------ */

function useRouteChangeLoading(
  pathname: string,
  start: () => void,
  stop: () => void,
) {
  const navigatingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const lastPathnameRef = useRef(pathname);

  const finishNavigation = useCallback(() => {
    if (!navigatingRef.current) return;
    navigatingRef.current = false;
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stop();
  }, [stop]);

  const startNavigation = useCallback(() => {
    navigatingRef.current = true;
    start();
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(finishNavigation, NAV_TIMEOUT_MS);
  }, [start, finishNavigation]);

  // The URL changed -> the navigation finished.
  useEffect(() => {
    if (navigatingRef.current && lastPathnameRef.current !== pathname) {
      finishNavigation();
    }
    lastPathnameRef.current = pathname;
  }, [pathname, finishNavigation]);

  // Same-site link clicks count as navigation.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return; // mailto:, tel:, etc.

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname + url.search ===
        window.location.pathname + window.location.search
      ) {
        return;
      }

      startNavigation();
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [startNavigation]);

  return startNavigation;
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Counter, not a boolean: two overlapping requests must not cancel
  // each other's spinner when the first one finishes.
  const [activeCount, setActiveCount] = useState(0);
  const [visible, setVisible] = useState(false);

  const start = useCallback(() => setActiveCount((n) => n + 1), []);
  const stop = useCallback(() => setActiveCount((n) => Math.max(0, n - 1)), []);

  // Debounce the spinner itself: show after SHOW_DELAY_MS, hide quickly.
  useEffect(() => {
    if (activeCount === 0) {
      const timer = window.setTimeout(() => setVisible(false), 60);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [activeCount]);

  const startNavigation = useRouteChangeLoading(pathname, start, stop);
  useFetchLoading(start, stop);

  const value = useMemo(
    () => ({ start, stop, startNavigation }),
    [start, stop, startNavigation],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {visible ? (
        <div
          className="pointer-events-none fixed inset-0 z-[1000] grid place-items-center bg-[#06281c]/15 backdrop-blur-[2px] [animation:toast-in_0.18s_ease-out]"
          role="status"
          aria-live="polite"
          aria-busy="true">
          <span className="sr-only">Loading</span>
          <LoadingIndicator />
        </div>
      ) : null}
    </LoadingContext.Provider>
  );
}
