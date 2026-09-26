"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ApplicationMenu,
  Close,
  Dashboard,
  Down,
  Help,
  History,
  Home,
  List,
  Logout,
  Mail,
  People,
  Plus,
  User,
} from "@icon-park/react";
import { logout } from "@/app/actions/auth";
import { useGlobalLoading } from "@/app/components/global-loader";
import { getInitials } from "./helpers";
import { Icon } from "./lib/icons";
import { gsap } from "./lib/motion";
import {
  useGsapContext,
  useIsomorphicLayoutEffect,
  usePressFeedback,
} from "./lib/use-gsap-context";
import type { Student } from "./types";

type SidebarProps = {
  student: Student;
  adminMode?: boolean;
};

export function Sidebar({ student, adminMode = false }: SidebarProps) {
  const { start: startLoading, stop: stopLoading } = useGlobalLoading();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const drawerScrimRef = useRef<HTMLDivElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLSpanElement>(null);

  // Two separate instances: `usePressFeedback` binds its `quickTo` tweens to
  // whatever element its ref points at when it mounts, and the rail and the
  // drawer copy of the button mount at different times.
  const railStartRef = useRef<HTMLAnchorElement>(null);
  const railStartHandlers = usePressFeedback(railStartRef, {
    nudgeSelector: "[data-start-icon]",
  });
  const drawerStartRef = useRef<HTMLAnchorElement>(null);
  const drawerStartHandlers = usePressFeedback(drawerStartRef, {
    nudgeSelector: "[data-start-icon]",
  });

  // The rail settles into place once on first paint. Items rise and fade in
  // sequence down the rail so the eye is led from the logo to the actions.
  useGsapContext(
    railRef,
    ({ reduced }) => {
      if (reduced) return;
      gsap.from("[data-rail-logo]", {
        autoAlpha: 0,
        y: -8,
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.from("[data-nav-item]", {
        autoAlpha: 0,
        x: -10,
        duration: 0.34,
        ease: "power3.out",
        stagger: 0.04,
        delay: 0.04,
      });
    },
    [],
  );

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (
        navOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        setNavOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNavOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [navOpen]);

  // Lock the page behind the drawer, and move focus into it so the keyboard is
  // not left on the trigger with an open overlay above it.
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    if (navOpen) drawerCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  // The drawer slides in behind the scrim; its items follow a beat later so the
  // panel settles before the list fills.
  useIsomorphicLayoutEffect(() => {
    if (!navOpen) return;
    const panel = drawerRef.current;
    if (!panel) return;

    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([drawerScrimRef.current, panel], { clearProps: "all" });
        return;
      }

      const timeline = gsap.timeline();
      timeline
        .fromTo(
          drawerScrimRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.2, ease: "power2.out" },
        )
        .fromTo(
          panel,
          { xPercent: -100 },
          { xPercent: 0, duration: 0.34, ease: "power3.out" },
          "<",
        )
        .from(
          "[data-drawer-item]",
          {
            autoAlpha: 0,
            x: -12,
            duration: 0.28,
            ease: "power2.out",
            stagger: 0.035,
          },
          "-=0.16",
        );
    }, panel);

    return () => context.revert();
  }, [navOpen]);

  // Give focus back to the trigger when the drawer closes, so keyboard and
  // screen-reader users are not dropped at the top of the page.
  useEffect(() => {
    if (navOpen) return;
    const wasOpen = document.body.dataset.drawerOpen === "true";
    if (!wasOpen) return;
    delete document.body.dataset.drawerOpen;
    drawerTriggerRef.current?.focus();
  }, [navOpen]);

  // The profile menu scales out of the button that opened it.
  useIsomorphicLayoutEffect(() => {
    const menu = menuRef.current;
    const context = gsap.context(() => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (chevronRef.current) {
        gsap.to(chevronRef.current, {
          rotation: profileOpen ? 180 : 0,
          duration: reduced ? 0 : 0.24,
          ease: "power2.out",
        });
      }
      if (!menu) return;
      if (reduced) {
        gsap.set(menu, { clearProps: "all" });
        return;
      }
      gsap.fromTo(
        menu,
        { autoAlpha: 0, y: 6, scale: 0.97 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.22,
          ease: "power3.out",
          transformOrigin: "bottom left",
        },
      );
    });
    return () => context.revert();
  }, [profileOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    startLoading();
    try {
      await logout();
      // Hard navigation: fully reload the page so the browser re-reads the
      // cleared cookies and drops any stale client-side auth state. The
      // spinner stays up through the reload.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    } catch {
      stopLoading();
    }
  }

  const navLinks = adminMode
    ? [
        { icon: Dashboard, label: "Overview", href: "/dashboard" },
        { icon: List, label: "Requests", href: "/dashboard#requests" },
        { icon: People, label: "Students", href: "/dashboard/admin/students" },
        { icon: History, label: "Archive", href: "/dashboard/admin/archive" },
        { icon: Mail, label: "Email", href: "/dashboard#email" },
      ]
    : [
        { icon: Home, label: "My requests", href: "/dashboard" },
        { icon: User, label: "My profile", href: "/onboarding" },
        { icon: Help, label: "Help center", href: "#" },
      ];

  /**
   * Marks the current page, but only for links that name a page. The
   * hash links ("Requests", "Email") all resolve to /dashboard, so marking
   * them would light up two items at once; they are left unmarked.
   */
  function isCurrent(href: string) {
    if (href.includes("#")) return false;
    if (href === "#") return false;
    return pathname === href;
  }

  function openDrawer() {
    document.body.dataset.drawerOpen = "true";
    setNavOpen(true);
  }

  return (
    <>
      {/* Mobile floating nav trigger. Sits in the app bar's left inset, so the
          two read as one control row. */}
      <button
        ref={drawerTriggerRef}
        type="button"
        onClick={openDrawer}
        aria-label="Open navigation"
        aria-expanded={navOpen}
        className="fixed left-4 top-[13px] z-40 grid h-9 w-9 place-items-center rounded-control text-ink-soft transition-colors hover:bg-sunken md:hidden">
        <Icon icon={ApplicationMenu} tone="neutral" size={19} />
      </button>

      {/* Mobile drawer */}
      {navOpen ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation">
          <div
            ref={drawerScrimRef}
            className="absolute inset-0 bg-[rgba(8,40,29,.45)] backdrop-blur-[2px]"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
          <aside
            ref={drawerRef}
            className="absolute left-0 top-0 flex h-full w-[19rem] max-w-[86vw] flex-col overflow-y-auto border-r border-rail-line bg-rail px-5 py-7 text-white">
            <div
              data-drawer-item
              className="flex items-center justify-between gap-3">
              <img
                src="/_logo_white.png"
                alt="itikQ - Pateros Technological College"
                className="h-auto w-40 object-contain"
              />
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close navigation"
                className="grid h-8 w-8 place-items-center rounded-control text-rail-ink transition-colors hover:bg-white/10 hover:text-white">
                <Icon icon={Close} tone="inverse" size={16} />
              </button>
            </div>

            {!adminMode ? (
              <Link
                ref={drawerStartRef}
                href="/request"
                data-drawer-item
                onClick={() => setNavOpen(false)}
                className="mt-7 flex w-full items-center gap-2.5 rounded-control bg-accent px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-accent-hover"
                {...drawerStartHandlers}>
                <span data-start-icon className="shrink-0">
                  <Icon icon={Plus} tone="inverse" size={15} />
                </span>
                Start a request
              </Link>
            ) : null}

            <div
              data-drawer-item
              className="mt-8 px-1 text-[9px] font-bold uppercase tracking-[.18em] text-rail-dim">
              {adminMode ? "Administration" : "Student portal"}
            </div>
            <nav className="mt-3 grid gap-1" aria-label="Mobile navigation">
              {navLinks.map(({ icon: Glyph, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  data-drawer-item
                  aria-current={isCurrent(href) ? "page" : undefined}
                  onClick={() => setNavOpen(false)}
                  className={`flex w-full items-center gap-3 rounded-control px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-white/10 ${
                    isCurrent(href) ? "bg-white/15 text-white" : "text-rail-ink"
                  }`}>
                  <Icon
                    icon={Glyph}
                    tone="inverse"
                    size={17}
                    className="shrink-0"
                  />
                  {label}
                </Link>
              ))}
            </nav>

            <div
              data-drawer-item
              className="mt-auto border-t border-rail-line pt-5">
              <div className="flex items-center gap-3">
                {student.profilePictureUrl ? (
                  <img
                    src={student.profilePictureUrl}
                    alt={`${student.name} profile`}
                    className="h-10 w-10 shrink-0 rounded-full border border-rail-line object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rail-line bg-white/10 font-mono text-xs font-bold text-white">
                    {getInitials(student.name)}
                  </span>
                )}
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-semibold text-white">
                    {student.name}
                  </strong>
                  <span className="block truncate text-[11px] text-rail-dim">
                    {student.email}
                  </span>
                </span>
              </div>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="mt-4 flex w-full items-center gap-3 rounded-control px-3.5 py-2.5 text-left text-[13px] font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50">
                <Icon icon={Logout} tone="inverse" size={16} className="shrink-0" />
                {loggingOut ? "Logging outâ€¦" : "Log out"}
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside
        ref={railRef}
        className="sd-rail fixed left-0 top-0 z-[4] hidden h-screen flex-col border-r border-rail-line bg-rail text-white md:flex md:w-[84px] md:items-center md:px-3 md:py-7 lg:w-60 lg:items-stretch lg:px-5 lg:py-9">
        <div className="flex w-full items-center justify-center lg:justify-start">
          <img
            data-rail-logo
            src="/_logo_white.png"
            alt="itikQ - Pateros Technological College"
            className="block h-auto w-[52px] object-contain lg:w-[150px]"
          />
        </div>

        <div
          data-nav-item
          className="mb-2 mt-11 hidden w-full px-2 text-[9px] font-bold uppercase tracking-[.18em] text-rail-dim lg:block">
          {adminMode ? "Administration" : "Student portal"}
        </div>

        <nav
          className={`${adminMode ? "mt-4" : "mt-10"} grid w-full gap-1`}
          aria-label="Main navigation">
          {!adminMode ? (
            <Link
              ref={railStartRef}
              href="/request"
              data-nav-item
              title="Start a request"
              className="flex w-full items-center justify-center gap-2.5 rounded-control bg-accent px-3.5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-accent-hover lg:justify-start"
              {...railStartHandlers}>
              <span data-start-icon className="shrink-0">
                <Icon icon={Plus} tone="inverse" size={15} />
              </span>
              <span className="sr-only lg:not-sr-only">Start a request</span>
            </Link>
          ) : null}
          {navLinks.map(({ icon: Glyph, label, href }) => (
            <Link
              key={label}
              href={href}
              title={label}
              data-nav-item
              aria-current={isCurrent(href) ? "page" : undefined}
              className={`group relative flex w-full items-center gap-3 rounded-control px-3.5 py-2.5 text-[13px] font-medium transition-colors lg:justify-start ${
                isCurrent(href)
                  ? "bg-white/15 text-white"
                  : "text-rail-ink hover:bg-white/10 hover:text-white"
              }`}>
              {/* Accent rail marking the current page, kept to 2px so it reads
                  as a marker rather than a block. */}
              {isCurrent(href) ? (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent-line"
                />
              ) : null}
              <Icon icon={Glyph} tone="inverse" size={17} className="shrink-0" />
              <span className="sr-only lg:not-sr-only">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto w-full border-t border-rail-line pt-4">
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              title={student.name}
              className="flex w-full items-center justify-center gap-3 border-0 bg-transparent py-2 text-left lg:justify-start">
              {student.profilePictureUrl ? (
                <img
                  src={student.profilePictureUrl}
                  alt={`${student.name} profile`}
                  className="h-10 w-10 shrink-0 rounded-full border border-rail-line object-cover"
                />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rail-line bg-white/10 font-mono text-[11px] font-bold text-white">
                  {getInitials(student.name)}
                </span>
              )}
              <span className="hidden min-w-0 flex-1 lg:block">
                <strong className="block truncate text-[13px] font-semibold text-white">
                  {student.name}
                </strong>
                <span className="block truncate text-[11px] text-rail-dim">
                  {student.section}
                </span>
              </span>
              {/* The icon component does not forward refs, so the caret rotates
                  via a wrapper span. */}
              <span
                ref={chevronRef}
                className="hidden shrink-0 lg:inline-flex"
                aria-hidden="true">
                <Icon icon={Down} tone="inverse" size={13} />
              </span>
            </button>

            {profileOpen ? (
              <div
                ref={menuRef}
                role="menu"
                className="absolute bottom-full left-full z-50 mb-2 ml-2 w-60 overflow-hidden rounded-card border border-hairline bg-surface shadow-raised">
                <div className="border-b border-rule px-4 py-3">
                  <strong className="block truncate text-sm font-semibold text-ink">
                    {student.name}
                  </strong>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {student.email}
                  </span>
                  {!adminMode && student.section ? (
                    <span className="mt-1.5 block text-[11px] font-semibold text-accent">
                      {student.section}
                      {student.studentNumber ? (
                        <>
                          {" Â· "}#{student.studentNumber}
                        </>
                      ) : null}
                    </span>
                  ) : null}
                </div>
                <div className="p-1.5">
                  {!adminMode ? (
                    <Link
                      href="/onboarding"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-sunken">
                      <Icon icon={User} tone="accent" size={16} className="shrink-0" />
                      My profile
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={loggingOut}
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-rejected transition-colors hover:bg-rejected-soft disabled:opacity-50">
                    <Icon icon={Logout} tone="rejected" size={16} className="shrink-0" />
                    {loggingOut ? "Logging outâ€¦" : "Log out"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
