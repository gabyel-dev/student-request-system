import Link from "next/link";
import type { Student } from "./types";

export function StudentDetails({ student }: { student: Student }) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/65 p-5 shadow-[0_16px_40px_rgba(35,97,63,.08)] backdrop-blur-[18px] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#168b62]">
            Your profile
          </p>
          <h2 className="mt-1.5 text-xl font-bold tracking-[-.035em]">
            Student details
          </h2>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-[#b9dfc8] text-[9px] font-extrabold text-[#168b62]">
          PTC
        </span>
      </div>
      <dl className="mt-4">
        <div className="border-b border-[#5d927733] py-3">
          <dt className="text-[10px] text-[#709082]">Student ID</dt>
          <dd className="mt-1 wrap-break-word text-xs font-bold">
            {student.studentNumber}
          </dd>
        </div>
        <div className="border-b border-[#5d927733] py-3">
          <dt className="text-[10px] text-[#709082]">Section</dt>
          <dd className="mt-1 wrap-break-word text-xs font-bold">
            {student.section}
          </dd>
        </div>
        <div className="border-b border-[#5d927733] py-3">
          <dt className="text-[10px] text-[#709082]">Email</dt>
          <dd className="mt-1 wrap-break-word text-xs font-bold">
            {student.email}
          </dd>
        </div>
      </dl>
      <Link
        href="/onboarding"
        className="mt-5 inline-block text-xs font-bold text-[#168b62] underline underline-offset-4">
        Review profile <span>↗</span>
      </Link>
    </section>
  );
}
