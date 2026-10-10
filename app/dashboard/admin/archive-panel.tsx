"use client";

import { useMemo, useState } from "react";
import { FiCalendar, FiChevronDown, FiChevronRight } from "react-icons/fi";
import type { StudentRequest } from "@/src/domain/request";
import { APP_TIME_ZONE, parseDatabaseDate } from "../lib/format";

function formatArchiveDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parseDatabaseDate(value));
}
function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(parseDatabaseDate(value));
}

const statusPill: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  processing: "bg-blue-50 text-blue-800 border-blue-200",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-neutral-100 text-neutral-600 border-neutral-200",
};
const statusLabel: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  rejected: "Rejected",
};

type ArchivedItem = {
  section: string;
  rows: { date: string; requests: StudentRequest[] }[];
};

export function ArchivePanel({
  archived,
  studentNumberByEmail,
}: {
  archived: StudentRequest[];
  studentNumberByEmail: Map<string, string | null>;
}) {
  const groups = useMemo(() => groupArchived(archived), [archived]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E6ECE8] bg-white shadow-[0_1px_2px_rgba(18,28,22,0.06)]">
      <div className="flex items-center justify-between border-b border-[#EEF2EF] px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#17211B]">
            Archived queues
          </h2>
          <p className="mt-0.5 text-xs text-[#62716A]">
            Completed cycles, preserved by section and date.
          </p>
        </div>
        <span className="rounded-full bg-[#F1F5F2] px-2.5 py-1 font-mono text-xs tabular-nums text-[#3E4B44]">
          {archived.length} record{archived.length === 1 ? "" : "s"}
        </span>
      </div>

      {archived.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm font-medium text-[#17211B]">
            No archived cycles yet
          </p>
          <p className="mt-1 text-xs text-[#62716A]">
            Completed queue cycles will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEF2EF]">
          {groups.map(({ section, rows }) => (
            <SectionGroup
              key={section}
              section={section}
              rows={rows}
              studentNumberByEmail={studentNumberByEmail}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SectionGroup({
  section,
  rows,
  studentNumberByEmail,
}: {
  section: string;
  rows: ArchivedItem["rows"];
  studentNumberByEmail: Map<string, string | null>;
}) {
  const [open, setOpen] = useState(true);
  const recordCount = rows.reduce((sum, r) => sum + r.requests.length, 0);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-[#FAFBFA] sm:px-5">
        {open ? (
          <FiChevronDown className="text-[#0B6B4A]" aria-hidden="true" />
        ) : (
          <FiChevronRight className="text-[#62716A]" aria-hidden="true" />
        )}
        <strong className="truncate text-sm font-semibold text-[#17211B]">
          {section}
        </strong>
        <span className="ml-auto rounded-full bg-[#F1F5F2] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[#3E4B44]">
          {recordCount}
        </span>
      </button>
      {open ? (
        <div className="divide-y divide-[#EEF2EF] border-t border-[#EEF2EF]">
          {rows.map(({ date, requests }) => (
            <DateGroup
              key={date}
              date={date}
              requests={requests}
              studentNumberByEmail={studentNumberByEmail}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Groups records by student email, preserving queue order by first
 * appearance. Each student's records stay sorted by queue number.
 */
function groupByStudent(requests: StudentRequest[]): StudentRequest[][] {
  const order: string[] = [];
  const map = new Map<string, StudentRequest[]>();
  for (const request of requests) {
    const key = request.studentEmail.toLowerCase();
    if (!map.has(key)) {
      order.push(key);
      map.set(key, []);
    }
    map.get(key)!.push(request);
  }
  return order.map((key) =>
    map.get(key)!.sort((a, b) => a.queueNumber - b.queueNumber),
  );
}

/** Human-range label for a student's queue numbers, e.g. "#001–#002". */
function queueRangeLabel(requests: StudentRequest[]): string {
  const queues = requests.map((r) => r.queueNumber).sort((a, b) => a - b);
  const first = String(queues[0]).padStart(3, "0");
  const last = String(queues[queues.length - 1]).padStart(3, "0");
  return queues.length > 1 && first !== last
    ? `#${first}–#${last}`
    : `#${first}`;
}

function DateGroup({
  date,
  requests,
  studentNumberByEmail,
}: {
  date: string;
  requests: StudentRequest[];
  studentNumberByEmail: Map<string, string | null>;
}) {
  const [open, setOpen] = useState(true);
  const studentGroups = useMemo(() => groupByStudent(requests), [requests]);
  const lookup = (email: string) =>
    studentNumberByEmail.get(email.toLowerCase()) ?? null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left hover:bg-[#FAFBFA] sm:px-5">
        {open ? (
          <FiChevronDown className="text-[#62716A]" aria-hidden="true" />
        ) : (
          <FiChevronRight className="text-[#8A9A92]" aria-hidden="true" />
        )}
        <FiCalendar className="text-[#62716A]" aria-hidden="true" />
        <span className="text-[13px] font-medium text-[#3E4B44]">{date}</span>
        <span className="ml-auto font-mono text-[11px] tabular-nums text-[#62716A]">
          {requests.length} record{requests.length === 1 ? "" : "s"}
        </span>
      </button>
      {open ? (
        <div className="mx-4 mb-3 overflow-hidden rounded-xl border border-[#EEF2EF] sm:mx-5">
          {studentGroups.map((group) =>
            group.length === 1 ? (
              <ArchiveRecordRow
                key={group[0].id}
                request={group[0]}
                studentNumber={lookup(group[0].studentEmail)}
                showIdentity
              />
            ) : (
              <ArchiveStudentGroup
                key={group[0].studentEmail.toLowerCase()}
                requests={group}
                studentNumber={lookup(group[0].studentEmail)}
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Collapsible header for a student with several archived records.
 * Collapsed by default so a busy date stays scannable.
 */
function ArchiveStudentGroup({
  requests,
  studentNumber,
}: {
  requests: StudentRequest[];
  studentNumber: string | null;
}) {
  const [open, setOpen] = useState(false);
  const first = requests[0];

  return (
    <div className="border-b border-[#F1F5F2] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 bg-[#FAFBFA] px-3.5 py-2.5 text-left transition hover:bg-[#F4F7F5]">
        <span className="shrink-0 text-[#62716A]">
          {open ? (
            <FiChevronDown aria-hidden="true" />
          ) : (
            <FiChevronRight aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-[#17211B]">
            {first.studentName}
          </span>
          <span className="block truncate text-[11px] text-[#62716A]">
            {first.studentEmail}
            {studentNumber ? ` · ${studentNumber}` : ""}
          </span>
        </span>
        <span className="shrink-0 font-mono text-xs tabular-nums text-[#62716A]">
          {queueRangeLabel(requests)}
        </span>
        <span className="shrink-0 rounded-full bg-[#EEF2EF] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[#3E4B44]">
          {requests.length}
        </span>
      </button>
      {open ? (
        <ul className="border-t border-[#F1F5F2]">
          {requests.map((request) => (
            <ArchiveRecordRow key={request.id} request={request} nested />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ArchiveRecordRow({
  request,
  studentNumber = null,
  showIdentity = false,
  nested = false,
}: {
  request: StudentRequest;
  studentNumber?: string | null;
  showIdentity?: boolean;
  nested?: boolean;
}) {
  return (
    <li
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#F1F5F2] bg-white px-3.5 py-2.5 last:border-b-0 hover:bg-[#FAFBFA] ${
        nested ? "pl-10" : ""
      }`}>
      <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-[#3E4B44]">
        #{String(request.queueNumber).padStart(3, "0")}
      </span>
      {showIdentity ? (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-[#17211B]">
            {request.studentName}
          </span>
          <span className="block truncate text-[11px] text-[#62716A]">
            {request.studentEmail}
            {studentNumber ? ` · ${studentNumber}` : ""}
          </span>
        </span>
      ) : null}
      <span
        className={`min-w-0 truncate text-xs text-[#3E4B44] ${
          showIdentity ? "" : "flex-1"
        }`}>
        {request.documentType}
      </span>
      <span
        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusPill[request.status]}`}>
        {statusLabel[request.status]}
      </span>
      <span className="shrink-0 text-right text-[11px] leading-4 text-[#62716A]">
        <span className="block">Submitted {formatTime(request.createdAt)}</span>
        <span className="block">
          Completed {request.archivedAt ? formatTime(request.archivedAt) : "—"}
        </span>
      </span>
    </li>
  );
}

function groupArchived(archived: StudentRequest[]): ArchivedItem[] {
  const bySection = new Map<string, Map<string, StudentRequest[]>>();
  for (const r of archived) {
    const section = r.section ?? "Unknown";
    const date = formatArchiveDate(r.archivedAt ?? r.createdAt);
    const sg = bySection.get(section) ?? new Map<string, StudentRequest[]>();
    const dg = sg.get(date) ?? [];
    dg.push(r);
    sg.set(date, dg);
    bySection.set(section, sg);
  }
  return [...bySection.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([section, dateGroups]) => ({
      section,
      rows: [...dateGroups.entries()]
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .map(([date, requests]) => ({
          date,
          requests: requests.sort((a, b) => a.queueNumber - b.queueNumber),
        })),
    }));
}
