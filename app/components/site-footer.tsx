"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/onboarding") return null;

  const withSidebar =
    pathname === "/dashboard" ||
    pathname === "/dashboard/archive" ||
    pathname.startsWith("/dashboard/admin");

  return (
    <footer className="border-t border-rule bg-surface">
      <div className={withSidebar ? "md:pl-[84px] lg:pl-60" : ""}>
        <div
          className={`mx-auto flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between ${
            withSidebar
              ? "w-[calc(100%-32px)] max-w-295 sm:w-[calc(100%-42px)] lg:w-[calc(100%-64px)]"
              : "w-full max-w-6xl px-4 sm:px-6 lg:px-8"
          }`}>
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-contain"
            />
            <p className="text-xs font-semibold text-ink">itikQ</p>
            <span className="text-xs text-muted">
              Pateros Technological College
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <Link
              href="/dashboard"
              className="transition hover:text-ink">
              Dashboard
            </Link>
            <Link
              href="/request"
              className="transition hover:text-ink">
              New request
            </Link>
            <Link
              href="/dashboard/help"
              className="transition hover:text-ink">
              Help Center
            </Link>
            <span>&copy; {new Date().getFullYear()} itikQ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
