"use client";

import { useMemo, useState } from "react";
import {
  FiArchive,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiUsers,
  FiFileText,
} from "react-icons/fi";
import { statusMeta, statusTone } from "../lib/request-utils";
import type { StudentRequest } from "@/src/domain/request";

function formatArchiveDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

type ArchivedItem = {
  section: string;
  rows: {
    date: string;
    requests: StudentRequest[];
  }[];
};

/**
 * Archived request records from completed queue cycles, grouped by
 * section, then by the date the cycle was completed. Every row keeps its
 * original queue number, so each section/date is a self-contained snapshot.
 */
export function ArchivePanel({
  archived,
  studentNumberByEmail,
}: {
  archived: StudentRequest[];
  studentNumberByEmail: Map<string, string | null>;
}) {
  const groups = useMemo(() => groupArchived(archived), [archived]);

  if (archived.length === 0) {
    return (
      <section
        id="archive"
        className="dash-glass overflow-hidden rounded-tr-4xl rounded-bl-4xl scroll-mt-24">
        <ArchiveHeader total={0} />
        <div className="px-4 py-10 text-center sm:px-6">
          <FiArchive
            className="mx-auto text-2xl text-[#a9bdb3]"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm font-semibold text-[#14251d]">
            No archived cycles yet
          </p>
          <p className="mt-1 text-xs text-[#5d6f66]">
            Completed queue cycles will appear here, grouped by section and date.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="archive"
      className="dash-glass overflow-hidden rounded-tr-4xl rounded-bl-4xl scroll-mt-24">
      <ArchiveHeader total={archived.length} />

      <div className="divide-y divide-[#e7efea]">
        {groups.map(({ section, rows }) => (
          <SectionGroup
            key={section}
            section={section}
            rows={rows}
            studentNumberByEmail={studentNumberByEmail}
          />
        ))}
      </div>
    </section>
  );
}

function ArchiveHeader({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#e7efea] px-4 py-3.5 sm:px-6">
      <div>
        <h2 className="text-base font-bold tracking-[-.02em] text-[#123b32]">
          Archived queues
        </h2>
        <p className="mt-0.5 text-xs text-[#5d6f66]">
          Records from completed cycles, preserved by section and date.
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-[#e7efe9] px-3 py-1 font-mono text-xs font-semibold tabular-nums text-[#2c4036]">
        {total} record{total === 1 ? "" : "s"}
      </span>
    </div>
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
  const recordCount = rows.reduce((sum, row) => sum + row.requests.length, 0);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 bg-[#f7fbf9] px-4 py-3 text-left transition hover:bg-[#f1f8f4] sm:px-6">
        {open ? (
          <FiChevronDown className="shrink-0 text-[#087a54]" aria-hidden="true" />
        ) : (
          <FiChevronRight className="shrink-0 text-[#6f8579]" aria-hidden="true" />
        )}
        <FiUsers className="shrink-0 text-[#087a54]" aria-hidden="true" />
        <strong className="truncate text-sm font-bold text-[#14251d]">
          {section}
        </strong>
        <span className="ml-auto rounded-full bg-[#e7efe9] px-2.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-[#5d6f66]">
          {recordCount}
        </span>
      </button>

      {open ? (
        <div className="border-t border-[#e7efea] divide-y divide-[#e7efea]">
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

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[#f7fbf9] sm:px-6">
        {open ? (
          <FiChevronDown className="shrink-0 text-[#5d6f66]" aria-hidden="true" />
        ) : (
          <FiChevronRight className="shrink-0 text-[#a9bdb3]" aria-hidden="true" />
        )}
        <FiCalendar className="shrink-0 text-[#5d6f66]" aria-hidden="true" />
        <span className="text-[13px] font-semibold text-[#2c4036]">
          {date}
        </span>
        <span className="ml-auto font-mono text-[11px] text-[#6f8579]">
          {requests.length} {requests.length === 1 ? "record" : "records"}
        </span>
      </button>

      {open ? (
        <div className="px-4 pb-3 sm:px-6">
          <ul className="overflow-hidden rounded-tr-2xl rounded-bl-2xl border border-[#e7efea]">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#eef4f0] bg-white px-3.5 py-2.5 last:border-b-0 hover:bg-[#fbfdfc]">
                <span className="w-10 shrink-0 font-mono text-xs font-bold tabular-nums text-[#087a54]">
                  #{String(request.queueNumber).padStart(3, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[#14251d]">
                    {request.studentName}
                  </span>
                  <span className="block truncate text-[11px] text-[#6f8579]">
                    {request.studentEmail}
                    {studentNumberByEmail.get(
                      request.studentEmail.toLowerCase(),
                    )
                      ? ` Â· ${studentNumberByEmail.get(
                          request.studentEmail.toLowerCase(),
                        )}`
                      : ""}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-[#41584c]">
                  <FiFileText
                    className="text-[#087a54]"
                    aria-hidden="true"
                  />
                  {request.documentType}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold ${statusMeta[request.status].text}`}>
                  <span
                    className={`h-2 w-2 rounded-full ${statusTone[request.status]}`}
                    aria-hidden="true"
                  />
                  {statusMeta[request.status].label}
                </span>
                <span className="shrink-0 text-right text-[11px] text-[#6f8579]">
                  <span className="block">
                    Submitted {
                      formatTime(request.createdAt)
                    }
                  </span>
                  <span className="block">
                    Completed {
                      request.archivedAt
                        ? formatTime(request.archivedAt)
                        : "â€”"
                    }
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function groupArchived(archived: StudentRequest[]): ArchivedItem[] {
  const bySection = new Map<string, Map<string, StudentRequest[]>>();

  for (const request of archived) {
    const section = request.section ?? "Unknown";
    const key = request.archivedAt ?? request.createdAt;
    const date = formatArchiveDate(key);
    const sectionGroups = bySection.get(section) ?? new Map<string, StudentRequest[]>();
    const dateGroup = sectionGroups.get(date) ?? [];
    dateGroup.push(request);
    sectionGroups.set(date, dateGroup);
    bySection.set(section, sectionGroups);
  }

  return [...bySection.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([section, dateGroups]) => ({
      section,
      rows: [...dateGroups.entries()]
        // Newest completed cycle first.
        .sort(
          ([aKey], [bKey]) =>
            parseKey(bKey) - parseKey(aKey),
        )
        .map(([date, requests]) => ({
          date,
          // Records appear in queue order: Queue 1 first.
          requests: requests.sort(
            (a, b) => a.queueNumber - b.queueNumber,
          ),
        })),
    }));
}

function parseKey(date: string): number {
  return new Date(date).getTime() || 0;
}