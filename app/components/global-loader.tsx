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

const SHOW_DELAY_MS = 180;
const NAV_EXPIRE_MS = 8000;

type LoadingContextValue = {
  start: () => void;
  stop: () => void;
  startNavigation: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

let fetchPatched = false;

export function GlobalLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  const navActiveRef = useRef(false);
  const lastPathnameRef = useRef(pathname);
  const navTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (count === 0) {
      const timer = window.setTimeout(() => setVisible(false), 60);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [count]);

  const stopNavigation = useCallback(() => {
    if (!navActiveRef.current) return;
    navActiveRef.current = false;
    if (navTimerRef.current !== null) {
      window.clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    setCount((current) => Math.max(0, current - 1));
  }, []);

  const startNavigation = useCallback(() => {
    navActiveRef.current = true;
    setCount((current) => current + 1);
    if (navTimerRef.current !== null) {
      window.clearTimeout(navTimerRef.current);
    }
    navTimerRef.current = window.setTimeout(stopNavigation, NAV_EXPIRE_MS);
  }, [stopNavigation]);

  const start = useCallback(() => setCount((current) => current + 1), []);
  const stop = useCallback(
    () => setCount((current) => Math.max(0, current - 1)),
    [],
  );

  useEffect(() => {
    if (navActiveRef.current && lastPathnameRef.current !== pathname) {
      stopNavigation();
    }
    lastPathnameRef.current = pathname;
  }, [pathname, stopNavigation]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return;
      let targetUrl: URL;
      try {
        targetUrl = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (targetUrl.origin !== window.location.origin) return;
      const currentPath = window.location.pathname + window.location.search;
      if (targetUrl.pathname + targetUrl.search === currentPath) return;
      startNavigation();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [startNavigation]);

  useEffect(() => {
    if (fetchPatched) return;
    fetchPatched = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const isSilentAuth = url.includes("/api/auth/refresh");
      if (!isSilentAuth) setCount((current) => current + 1);
      return originalFetch(input, init).then(
        (response) => {
          if (!isSilentAuth) setCount((current) => Math.max(0, current - 1));
          return response;
        },
        (error) => {
          if (!isSilentAuth) setCount((current) => Math.max(0, current - 1));
          throw error;
        },
      );
    };
    return () => {
      window.fetch = originalFetch;
      fetchPatched = false;
    };
  }, []);

  const value = useMemo(
    () => ({ start, stop, startNavigation }),
    [start, stop, startNavigation],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {visible ? (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-white/10 backdrop-blur-[2px]"
          role="status"
          aria-live="polite">
          <span className="sr-only">Loading</span>
          <span
            className="h-12 w-12 animate-spin rounded-full border-[3px] border-[#0d4a33]/20 border-t-[#0d4a33]"
            aria-hidden="true"
          />
        </div>
      ) : null}
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error(
      "useGlobalLoading must be used within a GlobalLoadingProvider",
    );
  }
  return context;
}