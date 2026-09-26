"use client";

import Link from "next/link";
import { ArrowLeft } from "@icon-park/react";
import { services } from "@/app/dashboard/data";
import { Icon } from "@/app/dashboard/lib/icons";

/**
 * The service chooser, split out of `app/request/page.tsx`.
 *
 * This page has to stay a Server Component: it reads the session, checks the
 * account, and applies redirects, none of which can run in the browser. But the
 * icons come from IconPark, whose components read React context and therefore
 * only render on the client. The two requirements are reconciled by keeping
 * every line that draws an icon in this client child and leaving the data and
 * access control in the page.
 */
export function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 text-sm font-medium text-[#087a54] transition hover:opacity-70">
      <Icon icon={ArrowLeft} tone="accent" size={15} />
      Back to dashboard
    </Link>
  );
}

export function ServiceOptions() {
  return (
    <div className="mt-6 grid sm:grid-cols-2 sm:gap-x-12">
      {services.map(({ slug, title, description, icon }) => (
        <Link
          key={slug}
          href={`/request/${slug}`}
          className="group flex items-start gap-3 border-b border-[#dbebe3] py-5 text-left transition hover:bg-white/60 sm:py-6">
          <Icon icon={icon} tone="accent" size={18} className="mt-0.5 shrink-0" />
          <span>
            <strong className="block text-sm text-[#14251d] transition-colors group-hover:text-[#087a54]">
              {title}
            </strong>
            <span className="mt-0.5 block text-xs text-[#5d6f66]">
              {description}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
