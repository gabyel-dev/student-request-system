import { FiUsers } from "react-icons/fi";
import type { User } from "@/src/domain/user";

export function StudentsPanel({ students }: { students: User[] }) {
  return (
    <section
      id="students"
      className="dash-glass scroll-mt-24 px-4 py-5 sm:px-8 sm:py-7 lg:rounded-tr-4xl lg:rounded-bl-4xl">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-[-.03em] text-[#123b32]">
          Students
        </h2>
        <span className="flex items-center gap-1.5 rounded-full border border-[#bfd9cc] bg-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#087a54]">
          <FiUsers className="text-[11px]" aria-hidden="true" />
          {students.length} profiles
        </span>
      </div>
      {students.length ? (
        <div className="mt-3 grid border-t border-[#dbebe3] sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
          {students.map((student) => (
            <article
              className="flex min-w-0 items-center justify-between gap-3 border-b border-[#dbebe3] py-3"
              key={student.id}>
              <div className="min-w-0">
                <strong className="block truncate text-sm text-[#14251d]">
                  {student.fullName}
                </strong>
                <span className="mt-0.5 block truncate text-xs text-[#5d6f66]">
                  {student.email}
                </span>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-[#087a54]">
                {student.studentNumber ?? "Incomplete"}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-[#5d6f66]">
          No student profiles have been registered yet.
        </p>
      )}
    </section>
  );
}