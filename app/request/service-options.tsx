"use client";

import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { services } from "@/app/dashboard/data";
import { getServiceIcon } from "./service-icons";

export function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 text-sm font-medium text-[#087a54] transition hover:opacity-70">
      <FiArrowLeft size={15} aria-hidden="true" />
      Back to dashboard
    </Link>
  );
}

export function ServiceOptions({ disabled = false }: { disabled?: boolean }) {
  return (
    <div className="mt-6 grid sm:grid-cols-2 sm:gap-x-12">
      {services.map(({ slug, title, description }) => {
        const ServiceIcon = getServiceIcon(slug, title);
        const body = (
          <>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <ServiceIcon size={22} />
            </span>
            <span className="min-w-0">
              <strong className="block text-sm text-[#14251d] transition-colors group-hover:text-[#087a54]">
                {title}
              </strong>
              <span className="mt-0.5 block text-xs text-[#5d6f66]">
                {description}
              </span>
            </span>
          </>
        );
        const className = `flex items-start gap-3 border-b border-[#dbebe3] py-5 text-left transition sm:py-6 ${
          disabled ? "opacity-50" : "group hover:bg-white/60"
        }`;
        return disabled ? (
          <div key={slug} className={className} aria-disabled="true">
            {body}
          </div>
        ) : (
          <Link key={slug} href={`/request/${slug}`} className={className}>
            {body}
          </Link>
        );
      })}
    </div>
  );
}
