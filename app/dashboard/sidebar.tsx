"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Close,
  Dashboard,
  Help,
  History,
  Home,
  List,
  Logout,
  Mail,
  MenuFold,
  People,
  Plus,
  User,
} from "@icon-park/react";
import { logout } from "@/app/actions/auth";
import { useGlobalLoading } from "@/app/components/global-loader";

type Student = {
  name: string;
  email: string;
  profilePictureUrl?: string | null;
  section?: string | null;
  studentNumber?: string | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar({
  student,
  adminMode = false,
}: {
  student: Student;
  adminMode?: boolean;
}) {
  const { start: startLoading, stop: stopLoading } = useGlobalLoading();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
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
  }, []);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    startLoading();
    try {
      await logout();
      window.location.href = "/login";
    } catch {
      stopLoading();
      setLoggingOut(false);
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
        { icon: Help, label: "Help center", href: "/dashboard/help" },
      ];

  function isCurrent(href: string) {
    if (href.includes("#") || href === "#") return false;
    return pathname === href;
  }

  function linkCls(active: boolean, showLabels: boolean) {
    return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
      showLabels ? "" : "justify-center lg:justify-start"
    } ${
      active
        ? "bg-[#0B6B4A]/10 text-[#0B6B4A]"
        : "text-[#3E4B44] hover:bg-black/[0.04]"
    }`;
  }

  function renderNav(showLabels: boolean) {
    return (
      <>
        {!adminMode ? (
          <Link
            href="/request"
            onClick={() => setNavOpen(false)}
            className={`flex items-center justify-center gap-2 bg-[#0B6B4A] font-semibold text-white transition hover:bg-[#095a3e] ${
              showLabels
                ? "rounded-full px-4 py-2.5 text-[13px]"
                : "rounded-full p-2.5 lg:px-4 lg:py-2.5 lg:text-[13px]"
            }`}>
            <Plus theme="outline" size={16} className="shrink-0" />
            <span className={showLabels ? "" : "hidden lg:inline"}>
              Start a request
            </span>
          </Link>
        ) : null}

        <p
          className={`mt-6 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A9A92] ${
            showLabels ? "" : "hidden lg:block"
          }`}>
          {adminMode ? "Administration" : "Student portal"}
        </p>
        {!showLabels ? (
          <div
            className="mt-4 border-t border-[#EEF2EF] lg:hidden"
            aria-hidden="true"
          />
        ) : null}

        <nav className="mt-2 grid gap-1" aria-label="Main navigation">
          {navLinks.map(({ icon: Glyph, label, href }) => (
            <Link
              key={label}
              href={href}
              aria-current={isCurrent(href) ? "page" : undefined}
              onClick={() => setNavOpen(false)}
              title={showLabels ? undefined : label}
              className={linkCls(isCurrent(href), showLabels)}>
              <Glyph theme="outline" size={18} className="shrink-0" />
              <span className={showLabels ? "" : "hidden lg:inline"}>
                {label}
              </span>
            </Link>
          ))}
        </nav>
      </>
    );
  }

  const avatar = student.profilePictureUrl ? (
    <img
      src={student.profilePictureUrl}
      alt={`${student.name} profile`}
      className="h-9 w-9 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0B6B4A]/10 text-xs font-semibold text-[#0B6B4A]">
      {getInitials(student.name)}
    </span>
  );

  return (
    <>
      {/* Mobile top bar: sticky, in normal flow, so it never overlaps content. */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-[#E6ECE8] bg-[#F6F7F6]/95 px-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          className="grid h-10 w-10 place-items-center rounded-full text-[#17211B] transition hover:bg-black/5">
          <MenuFold theme="outline" size={20} />
        </button>
        <img
          src="/_logo.png"
          alt="itikQ"
          className="h-7 w-auto object-contain"
        />
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A9A92]">
          {adminMode ? "Admin" : "Portal"}
        </span>
      </header>

      {/* Mobile drawer */}
      {navOpen ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[19rem] max-w-[86vw] flex-col bg-white px-5 py-6">
            <div className="flex items-center justify-between">
              <img
                src="/_logo.png"
                alt="itikQ"
                className="h-auto w-32 object-contain"
              />
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close navigation"
                className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-black/5">
                <Close theme="outline" size={16} />
              </button>
            </div>
            <div className="mt-6">{renderNav(true)}</div>
            <div className="mt-auto border-t border-[#EEF2EF] pt-4">
              <div className="flex items-center gap-3">
                {avatar}
                <span className="min-w-0">
                  <strong className="block truncate text-[13px] font-semibold text-[#17211B]">
                    {student.name}
                  </strong>
                  <span className="block truncate text-[11px] text-[#62716A]">
                    {student.email}
                  </span>
                </span>
              </div>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-[#3E4B44] transition hover:bg-black/[0.04] disabled:opacity-50">
                <Logout theme="outline" size={16} className="shrink-0" />
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Desktop: icon rail on md, full sidebar on lg. */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[76px] flex-col border-r border-[#E6ECE8] bg-white px-3 py-6 md:flex lg:w-60 lg:px-4">
        <div className="flex justify-center lg:justify-start">
          <span
            className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0B6B4A] text-[15px] font-bold tracking-tight text-white lg:hidden"
            aria-hidden="true">
            iQ
          </span>
          <img
            src="/_logo.png"
            alt="itikQ - Pateros Technological College"
            className="hidden h-auto w-[132px] object-contain lg:block"
          />
        </div>

        <div className="mt-4 flex-1 lg:mt-6">{renderNav(false)}</div>

        <div
          className="relative border-t border-[#EEF2EF] pt-4"
          ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            title={student.name}
            className="flex w-full items-center justify-center gap-3 rounded-xl py-1 transition hover:bg-black/[0.03] lg:justify-start lg:px-1">
            {avatar}
            <span className="hidden min-w-0 flex-1 text-left lg:block">
              <strong className="block truncate text-[13px] font-semibold text-[#17211B]">
                {student.name}
              </strong>
              <span className="block truncate text-[11px] text-[#62716A]">
                {adminMode ? "Administrator" : student.section}
              </span>
            </span>
          </button>

          {profileOpen ? (
            <div
              role="menu"
              className="absolute bottom-full left-0 z-50 mb-2 w-60 overflow-hidden rounded-2xl border border-[#E6ECE8] bg-white shadow-lg">
              <div className="border-b border-[#EEF2EF] px-4 py-3">
                <strong className="block truncate text-sm font-semibold text-[#17211B]">
                  {student.name}
                </strong>
                <span className="block truncate text-xs text-[#62716A]">
                  {student.email}
                </span>
              </div>
              <div className="p-1.5">
                {!adminMode ? (
                  <Link
                    href="/onboarding"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#17211B] transition hover:bg-black/[0.04]">
                    <User theme="outline" size={16} className="shrink-0" />
                    My profile
                  </Link>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-50">
                  <Logout theme="outline" size={16} className="shrink-0" />
                  {loggingOut ? "Logging out…" : "Log out"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
