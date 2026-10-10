"use client";

import { useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight, FiSearch } from "react-icons/fi";
import type { User } from "@/src/domain/user";
import Avatar from "@/app/dashboard/lib/avatar";

/** "BSIT 3H" -> "3", "BSIT 3HL" -> "3", null -> null */
function parseYear(section: string | null | undefined): string | null {
  if (!section) return null;
  const match = section.match(/(\d+)/);
  return match ? match[1] : null;
}

function yearLabel(year: string): string {
  const n = parseInt(year, 10);
  const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `${n}${suffix} Year`;
}

type SectionGroupData = { name: string; students: User[] };
type YearGroupData = {
  key: string;
  label: string;
  sections: SectionGroupData[];
  ungrouped: User[];
  total: number;
};

const NO_YEAR = "__noyear__";
const UNASSIGNED = "__unassigned__";

function groupByYearAndSection(students: User[]): YearGroupData[] {
  const years = new Map<string, Map<string, User[]>>();
  const unassigned: User[] = [];

  for (const student of students) {
    if (!student.section) {
      unassigned.push(student);
      continue;
    }
    const year = parseYear(student.section) ?? NO_YEAR;
    if (!years.has(year)) years.set(year, new Map());
    const sections = years.get(year)!;
    if (!sections.has(student.section)) sections.set(student.section, []);
    sections.get(student.section)!.push(student);
  }

  const byName = (a: User, b: User) => a.fullName.localeCompare(b.fullName);

  const groups: YearGroupData[] = [...years.entries()]
    .sort(([a], [b]) => {
      if (a === NO_YEAR) return 1;
      if (b === NO_YEAR) return -1;
      return parseInt(a, 10) - parseInt(b, 10);
    })
    .map(([year, sections]) => {
      const sectionGroups: SectionGroupData[] = [...sections.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, list]) => ({ name, students: [...list].sort(byName) }));
      return {
        key: year,
        label: year === NO_YEAR ? "No year" : yearLabel(year),
        sections: sectionGroups,
        ungrouped: [],
        total: sectionGroups.reduce((n, s) => n + s.students.length, 0),
      };
    });

  if (unassigned.length > 0) {
    groups.push({
      key: UNASSIGNED,
      label: "Unassigned",
      sections: [],
      ungrouped: [...unassigned].sort(byName),
      total: unassigned.length,
    });
  }

  return groups;
}

export function StudentsPanel({ students }: { students: User[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.fullName, s.email, s.studentNumber ?? "", s.section ?? ""].some(
        (value) => value.toLowerCase().includes(q),
      ),
    );
  }, [students, query]);

  const yearGroups = useMemo(() => groupByYearAndSection(filtered), [filtered]);
  const searching = query.trim().length > 0;
  const incompleteCount = students.filter((s) => !s.studentNumber).length;

  return (
    <section
      id="students"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#E6ECE8] bg-white shadow-[0_1px_2px_rgba(18,28,22,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF2EF] px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#17211B]">
            Students
          </h2>
          <p className="mt-0.5 text-xs tabular-nums text-[#62716A]">
            {students.length} registered
            {incompleteCount > 0 ? ` · ${incompleteCount} incomplete` : ""}
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-[#E6ECE8] bg-white px-3 py-1.5 transition ">
          <FiSearch className="shrink-0 text-[#62716A]" aria-hidden="true" />
          <span className="sr-only">Search students</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, number"
            className="w-44 bg-transparent text-[13px] text-[#17211B] outline-none placeholder:text-[#8A9A92] sm:w-52"
          />
        </label>
      </div>

      {students.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm font-medium text-[#17211B]">
            No student profiles yet
          </p>
          <p className="mt-1 text-xs text-[#62716A]">
            Registered students will appear here.
          </p>
        </div>
      ) : yearGroups.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm font-medium text-[#17211B]">
            No students match your search
          </p>
          <p className="mt-1 text-xs text-[#62716A]">
            Try a different name, email, or number.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEF2EF]">
          {yearGroups.map((group) => (
            <YearGroup key={group.key} data={group} forceExpand={searching} />
          ))}
        </div>
      )}
    </section>
  );
}

function YearGroup({
  data,
  forceExpand,
}: {
  data: YearGroupData;
  forceExpand: boolean;
}) {
  const [open, setOpen] = useState(true);
  const expanded = forceExpand || open;

  return (
    <div className="border-b border-[#EEF2EF] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2.5 bg-[#F4F7F5] px-4 py-3 text-left transition hover:bg-[#EFF3F0] sm:px-5">
        {expanded ? (
          <FiChevronDown
            className="shrink-0 text-[#0B6B4A]"
            aria-hidden="true"
          />
        ) : (
          <FiChevronRight
            className="shrink-0 text-[#62716A]"
            aria-hidden="true"
          />
        )}
        <strong className="text-sm font-semibold text-[#17211B]">
          {data.label}
        </strong>
        <span className="ml-auto rounded-full border border-[#E6ECE8] bg-white px-2 py-0.5 font-mono text-[11px] tabular-nums text-[#3E4B44]">
          {data.total}
        </span>
      </button>

      {expanded ? (
        <div>
          {data.sections.map((section) => (
            <SectionSubGroup
              key={section.name}
              data={section}
              forceExpand={forceExpand}
            />
          ))}
          {data.ungrouped.length > 0 ? (
            <ul className="divide-y divide-[#F1F5F2]">
              {data.ungrouped.map((s) => (
                <StudentRow key={s.id} student={s} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SectionSubGroup({
  data,
  forceExpand,
}: {
  data: SectionGroupData;
  forceExpand: boolean;
}) {
  const [open, setOpen] = useState(true);
  const expanded = forceExpand || open;

  return (
    <div className="border-b border-[#F1F5F2] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition hover:bg-[#FAFBFA] sm:px-5">
        {expanded ? (
          <FiChevronDown
            className="shrink-0 text-[#62716A]"
            aria-hidden="true"
          />
        ) : (
          <FiChevronRight
            className="shrink-0 text-[#8A9A92]"
            aria-hidden="true"
          />
        )}
        <span className="truncate text-[13px] font-semibold text-[#17211B]">
          {data.name}
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-[#F1F5F2] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[#3E4B44]">
          {data.students.length}
        </span>
      </button>

      {expanded ? (
        <ul className="divide-y divide-[#F1F5F2] border-t border-[#F1F5F2]">
          {data.students.map((s) => (
            <StudentRow key={s.id} student={s} nested />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StudentRow({
  student: s,
  nested = false,
}: {
  student: User;
  nested?: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between gap-3 py-3 ${
        nested ? "pl-10 pr-4 sm:pr-5" : "px-4 sm:px-5"
      }`}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar student={s} />

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#17211B]">
            {s.fullName}
          </p>
          <p className="truncate text-xs text-[#62716A]">{s.email}</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        {s.studentNumber ? (
          <p className="font-mono text-xs tabular-nums text-[#17211B]">
            {s.studentNumber}
          </p>
        ) : (
          <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            Incomplete
          </span>
        )}
      </div>
    </li>
  );
}
