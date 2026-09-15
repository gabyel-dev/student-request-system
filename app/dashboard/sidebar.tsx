"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  FiActivity,
  FiChevronDown,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { logout } from "@/app/actions/auth";
import { getInitials } from "./helpers";
import type { Student } from "./types";

type SidebarProps = {
  student: Student;
  adminMode?: boolean;
};

export function Sidebar({ student, adminMode = false }: SidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    // Hard navigation: fully reload the page so the browser re-reads the
    // cleared cookies and drops any stale client-side auth state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }

  const navLinks = adminMode
    ? [
        { icon: FiGrid, label: "Overview", href: "/dashboard" },
        { icon: FiActivity, label: "Requests", href: "#requests" },
        { icon: FiUsers, label: "Students", href: "#students" },
      ]
    : [
        { icon: FiFileText, label: "My requests", href: "/dashboard" },
        { icon: FiUser, label: "My profile", href: "/onboarding" },
        { icon: FiHelpCircle, label: "Help center", href: "#" },
      ];

  return (
    <>
      {/* Mobile floating nav trigger */}
      <button
        type="button"
        onClick={() => setNavOpen(true)}
        aria-label="Open navigation"
        aria-expanded={navOpen}
        className="fixed left-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-xl border border-[#d9e6de] bg-white text-[#0d4a33] shadow-[0_8px_20px_rgba(20,91,62,.14)] transition hover:bg-[#e9f4ee] md:hidden">
        <FiMenu className="text-lg" />
      </button>

      {/* Mobile drawer */}
      {navOpen ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true">
          <div
            className="absolute inset-0 bg-[rgba(5,40,30,.5)] backdrop-blur-[2px]"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
          <aside
            ref={drawerRef}
            className="absolute left-0 top-0 flex h-full w-72 flex-col overflow-hidden bg-[#0d4a33] px-5 py-7 text-[#f5fff9] shadow-[14px_0_40px_rgba(20,91,62,.25)]">
            <div className="flex items-center justify-between gap-3">
              <img
                src="/_logo_white.png"
                alt="itikQ - Pateros Technological College"
                className="h-auto w-40 object-contain"
              />
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close navigation"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-white/10 text-[#e5faed] transition hover:bg-white/20">
                <FiX className="text-base" />
              </button>
            </div>

            {!adminMode ? (
              <Link
                href="/request"
                onClick={() => setNavOpen(false)}
                className="mt-8 flex w-full items-center gap-2.5 rounded-xl bg-[#087a54] px-4 py-3 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(8,122,84,.35)] transition hover:bg-[#066044]">
                <FiPlus className="text-[15px]" />
                Start a request
              </Link>
            ) : null}

            <div className="mt-8 px-1 text-[9px] font-bold uppercase tracking-[.18em] text-white/45">
              {adminMode ? "Administration" : "Student portal"}
            </div>
            <nav className="mt-3 grid gap-1" aria-label="Mobile navigation">
              {navLinks.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setNavOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left text-[13px] text-[#d5f3e3] transition hover:bg-white/15">
                  <Icon className="text-[15px]" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-white/20 pt-5">
              <div className="flex items-center gap-3">
                {student.profilePictureUrl ? (
                  <img
                    src={student.profilePictureUrl}
                    alt={`${student.name} profile`}
                    className="h-10 w-10 rounded-full border border-white/25 object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 font-mono text-xs font-bold text-[#e5faed]">
                    {getInitials(student.name)}
                  </span>
                )}
                <span className="min-w-0">
                  <strong className="block truncate text-sm text-white">
                    {student.name}
                  </strong>
                  <span className="block truncate text-[11px] text-[#9fd8bd]">
                    {student.email}
                  </span>
                </span>
              </div>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="mt-4 flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left text-[13px] text-[#ffd5d0] transition hover:bg-white/10 disabled:opacity-50">
                <FiLogOut />
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-[4] hidden h-screen flex-col bg-[#0d4a33] text-[#f5fff9] shadow-[14px_0_40px_rgba(20,91,62,.12)] md:flex md:w-[84px] md:items-center md:px-3 md:py-[30px] lg:w-60 lg:items-stretch lg:px-[18px] lg:py-[38px]">
        <div className="relative flex w-full items-center justify-center gap-2 lg:justify-start">
          <img
            src="/_logo_white.png"
            alt="itikQ - Pateros Technological College"
            className="block h-auto w-[52px] object-contain lg:w-[166px]"
          />
        </div>

        <div className="mb-2 mt-12 hidden w-full px-2 text-[9px] font-bold uppercase tracking-[.18em] text-white/45 lg:block">
          {adminMode ? "Administration" : "Student portal"}
        </div>

        <nav
          className={`${adminMode ? "mt-4" : "mt-12"} grid w-full gap-2`}
          aria-label="Main navigation">
          {!adminMode ? (
            <Link
              href="/request"
              title="Start a request"
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#087a54] px-3.5 py-3 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(8,122,84,.3)] transition hover:bg-[#066044] lg:justify-start">
              <FiPlus className="shrink-0 text-[15px]" />
              <span className="sr-only lg:not-sr-only">Start a request</span>
            </Link>
          ) : null}
          {navLinks.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              title={label}
              className="flex w-full items-center justify-center gap-3 border-b border-white/10 px-3.5 py-3 text-[13px] text-[#bfe4d0] transition hover:bg-white/10 lg:justify-start">
              <Icon className="shrink-0" />
              <span className="sr-only lg:not-sr-only">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto w-full border-t border-white/20 pt-[18px]">
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
                  className="h-10 w-10 shrink-0 rounded-full border border-white/25 object-cover"
                />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 font-mono text-[11px] font-bold text-[#e5faed]">
                  {getInitials(student.name)}
                </span>
              )}
              <span className="hidden min-w-0 flex-1 lg:block">
                <strong className="block truncate text-[13px] text-white">
                  {student.name}
                </strong>
                <span className="block truncate text-[11px] text-[#9fd8bd]">
                  {student.section}
                </span>
              </span>
              <FiChevronDown
                className={`hidden shrink-0 text-xs text-[#9fd8bd] transition-transform lg:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {profileOpen ? (
              <div
                role="menu"
                className="absolute bottom-full left-full z-50 mb-2 ml-2 w-60 overflow-hidden rounded-md border border-white/10 bg-[#0f5739] shadow-[0_18px_40px_rgba(5,35,25,.4)]">
                <div className="border-b border-white/10 px-4 py-3">
                  <strong className="block truncate text-sm text-white">
                    {student.name}
                  </strong>
                  <span className="mt-0.5 block truncate text-xs text-[#9fd8bd]">
                    {student.email}
                  </span>
                  {!adminMode && student.section ? (
                    <span className="mt-1.5 block text-[11px] font-semibold text-[#5fd6a4]">
                      {student.section}
                      {student.studentNumber ? (
                        <>
                          {" · "}#{student.studentNumber}
                        </>
                      ) : null}
                    </span>
                  ) : null}
                </div>
                <div className="p-1.5">
                  {!adminMode ? (
                    <Link
                      href="/onboarding"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-[#e5faed] transition-colors hover:bg-white/10">
                      <FiUser className="text-[#5fd6a4]" />
                      My profile
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-[#ffd5d0] transition-colors hover:bg-white/10 disabled:opacity-50">
                    <FiLogOut />
                    {loggingOut ? "Logging out…" : "Log out"}
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
