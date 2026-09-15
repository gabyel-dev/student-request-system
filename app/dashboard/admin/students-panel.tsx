import { FiUsers } from "react-icons/fi";
import type { User } from "@/src/domain/user";

export function StudentsPanel({ students }: { students: User[] }) {
  return (
    <section id="students">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-[-.03em] text-[#14251d]">
          Students
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-[#5d6f66]">
          <FiUsers className="text-[13px]" aria-hidden="true" />
          {students.length} profiles
        </span>
      </div>
      {students.length ? (
        <div className="mt-4 grid sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
          {students.map((student, index) => (
            <article
              className={`flex min-w-0 items-center justify-between gap-3 py-2.5 ${
                index === 0 ? "border-t-0" : "border-t"
              } border-[#dbebe3]`}
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