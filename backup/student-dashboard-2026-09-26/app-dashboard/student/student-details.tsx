import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import type { Student } from "../types";

export function StudentDetails({ student }: { student: Student }) {
  return (
    <section className="dash-glass px-4 py-5 sm:px-8 sm:py-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-[-.03em] text-[#123b32]">
          Profile
        </h2>
        <span className="rounded-full border border-[#bcd9c8] bg-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#087a54]">
          PTC
        </span>
      </div>
      <dl className="mt-4 divide-y divide-[#dcebe3] border-t border-[#dcebe3]">
        <div className="flex items-baseline justify-between gap-4 py-3.5">
          <dt className="text-xs font-medium text-[#5d6f66]">Student ID</dt>
          <dd className="break-words text-right font-mono text-sm font-medium tabular-nums text-[#14251d]">
            {student.studentNumber}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-3.5">
          <dt className="text-xs font-medium text-[#5d6f66]">Section</dt>
          <dd className="break-words text-right text-sm font-semibold text-[#14251d]">
            {student.section}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-3.5">
          <dt className="text-xs font-medium text-[#5d6f66]">Email</dt>
          <dd className="break-words text-right font-mono text-xs font-medium text-[#14251d]">
            {student.email}
          </dd>
        </div>
      </dl>
      <Link
        href="/onboarding"
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#087a54] transition-colors hover:text-[#066044] hover:underline underline-offset-4">
        Review profile
        <FiArrowUpRight aria-hidden="true" />
      </Link>
    </section>
  );
}