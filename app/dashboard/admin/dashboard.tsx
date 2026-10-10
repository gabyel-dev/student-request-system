"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  useTransition,
  type ReactElement,
  type ReactNode,
} from "react";
import { FiArrowRight } from "react-icons/fi";
import { updateRequestStatus } from "@/app/actions/requests";
import { useToast } from "@/app/components/toaster";
import type { StudentRequest, RequestStatus } from "@/src/domain/request";
import type { User } from "@/src/domain/user";
import { useRequestFilters } from "../lib/use-request-filters";
import { useRealtimeRequests } from "../lib/use-realtime-requests";

import type { StatusFilter } from "../lib/request-utils";
import { RequestCardList, RequestTable } from "./requests-list";
import { SectionGroups } from "./section-groups";
import { EmailPanel } from "./email-panel";
import { SummaryTabs } from "./summary-tabs";
import { Toolbar } from "./toolbar";
import { QueueCyclePanel } from "./queue-cycle-panel";
import type { RequestListContext } from "./types";

/* ------------------------------------------------------------------ */
/* Hand-drawn stat icons — two-tone set made for this dashboard.       */
/* Ink carries the form, green carries the meaning.                    */
/* ------------------------------------------------------------------ */

const INK = "#17211B";
const ACCENT = "#0B6B4A";

function IconShell({
  size = 28,
  children,
}: {
  size?: number;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={INK}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      {children}
    </svg>
  );
}

/** Total requests — stacked documents, green fold. */
function TotalRequestsIcon({ size }: { size?: number }) {
  return (
    <IconShell size={size}>
      <path d="M4.5 9.5v-3a2 2 0 0 1 2-2H12" />
      <path d="M14 4H9.5A2.5 2.5 0 0 0 7 6.5v11A2.5 2.5 0 0 0 9.5 20h7A2.5 2.5 0 0 0 19 17.5V9L14 4z" />
      <path d="M14 4v5h5" stroke={ACCENT} />
    </IconShell>
  );
}

/** Needs review — an eye waiting on someone, green pupil. */
function NeedsReviewIcon({ size }: { size?: number }) {
  return (
    <IconShell size={size}>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.6" />
      <circle cx="12" cy="12" r="0.9" fill={ACCENT} stroke="none" />
    </IconShell>
  );
}

/** Completed — a claim ticket, green check. */
function CompletedIcon({ size }: { size?: number }) {
  return (
    <IconShell size={size}>
      <path d="M7 5h10a2 2 0 0 1 2 2v2.2a2.3 2.3 0 0 0 0 4.6V16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2.2a2.3 2.3 0 0 0 0-4.6V7a2 2 0 0 1 2-2z" />
      <path d="M9.3 12.2l2 2 3.6-4" stroke={ACCENT} />
    </IconShell>
  );
}

/** Students — a graduation cap, green tassel. */
function StudentsIcon({ size }: { size?: number }) {
  return (
    <IconShell size={size}>
      <path d="M12 4.5L2.8 9l9.2 4.5L21.2 9 12 4.5z" />
      <path d="M6.5 11.2v4.3c0 1.6 2.5 2.9 5.5 2.9s5.5-1.3 5.5-2.9v-4.3" />
      <path d="M21.2 9v4.5" stroke={ACCENT} />
      <circle cx="21.2" cy="14.8" r="1" fill={ACCENT} stroke="none" />
    </IconShell>
  );
}

type StatIcon = (props: { size?: number }) => ReactElement;

export function AdminDashboard({
  requests: initialRequests,
  students,
}: {
  requests: StudentRequest[];
  students: User[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const resolveUser = useMemo(() => {
    const byId = new Map(
      students.map((s) => [s.id, { fullName: s.fullName, email: s.email }]),
    );
    return (userId: string) => byId.get(userId);
  }, [students]);

  const { requests, isLive } = useRealtimeRequests({
    initialRequests,
    filter: undefined,
    resolveUser,
  });

  const filters = useRequestFilters(requests, students);

  const requestContext: RequestListContext = {
    emailMaps: filters.emailMaps,
    isPending,
    updatingId,
    expandedId: filters.expandedId,
    onToggleRequest: filters.setExpandedId,
    onChangeStatus: changeStatus,
  };

  function selectStatus(status: StatusFilter) {
    filters.setStatusFilter(status);
  }
  function refresh() {
    router.refresh();
  }

  function runStatusUpdate(
    id: string,
    status: RequestStatus,
    message: string,
    previousStatus?: RequestStatus,
  ) {
    setUpdatingId(id);
    startTransition(() => {
      void updateRequestStatus(id, status)
        .then((result) => {
          if (result.error) {
            toastError(result.error);
            return;
          }
          if (previousStatus) {
            toastSuccess(result.success ?? message, {
              label: "Undo",
              onClick: () => undoChange(id, previousStatus),
            });
          } else {
            toastSuccess(result.success ?? message);
          }
          router.refresh();
        })
        .catch(() => toastError("The request could not be updated. Try again."))
        .finally(() => setUpdatingId(null));
    });
  }

  function changeStatus(id: string, status: RequestStatus) {
    const request = requests.find((item) => item.id === id);
    if (!request || request.status === status) return;
    if (
      status === "rejected" &&
      !window.confirm(
        "Reject this request? The student will need to submit a new request if they still need the document.",
      )
    )
      return;
    runStatusUpdate(id, status, "Record status updated.", request.status);
  }

  function undoChange(id: string, from: RequestStatus) {
    runStatusUpdate(id, from, `Reverted to ${from}.`);
  }

  const counts = filters.counts;
  const stats: {
    label: string;
    value: number;
    icon: StatIcon;
    filter?: StatusFilter;
    href?: string;
  }[] = [
    {
      label: "Total requests",
      value: counts.all,
      icon: TotalRequestsIcon,
      filter: "all",
    },
    {
      label: "Needs review",
      value: counts.pending,
      icon: NeedsReviewIcon,
      filter: "pending",
    },
    {
      label: "Completed",
      value: counts.completed,
      icon: CompletedIcon,
      filter: "completed",
    },
    {
      label: "Students",
      value: students.length,
      icon: StudentsIcon,
      href: "/dashboard/admin/students",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-[#17211B]">
            Welcome, <span className="font-bold text-emerald-600">Admin</span>!
          </h1>
          <p className="mt-1 text-sm text-[#62716A]">
            Review, process, and track student document requests.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="#requests"
            className="inline-flex items-center rounded-full bg-[#0B6B4A] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#095a3e]">
            Review queue
          </a>
          <a
            href="#email"
            className="inline-flex items-center rounded-full border border-[#DDE5E0] bg-white px-4 py-2 text-[13px] font-semibold text-[#17211B] transition hover:border-[#0B6B4A]/40">
            Email students
          </a>
        </div>
      </div>

      <section className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <QueueCyclePanel requests={requests} />
        </div>
        <div className="grid grid-cols-2 content-stretch gap-3 lg:col-span-2">
          {stats.map(({ label, value, icon: Icon, filter, href }) => {
            const isActive = filter != null && filters.statusFilter === filter;
            const className = `flex h-full w-full overflow-hidden rounded-2xl border bg-white text-left shadow-[0_1px_2px_rgba(18,28,22,0.06)] transition ${
              isActive
                ? "border-[#0B6B4A]/60"
                : "border-[#E6ECE8] hover:border-[#0B6B4A]/30"
            }`;
            const inner = (
              <>
                <span
                  className={`flex w-[68px] shrink-0 items-center justify-center transition ${
                    isActive ? "bg-[#0B6B4A]/[0.12]" : "bg-[#0B6B4A]/[0.06]"
                  }`}>
                  <Icon size={28} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3.5">
                  <span className="truncate text-[13px] font-medium text-[#62716A]">
                    {label}
                  </span>
                  <span className="mt-1 text-[28px] font-semibold tabular-nums leading-none tracking-tight text-[#17211B]">
                    {value}
                  </span>
                </span>
                {href ? (
                  <span className="flex items-center pr-4">
                    <FiArrowRight
                      className="text-[#0B6B4A]"
                      aria-hidden="true"
                    />
                  </span>
                ) : null}
              </>
            );
            return (
              <div key={label} className="h-full min-w-0">
                {href ? (
                  <Link href={href} className={className}>
                    {inner}
                  </Link>
                ) : (
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => filter && selectStatus(filter)}
                    className={className}>
                    {inner}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="requests"
        className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#E6ECE8] bg-white shadow-[0_1px_2px_rgba(18,28,22,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-[#EEF2EF] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <SummaryTabs
              counts={filters.counts}
              active={filters.statusFilter}
              onSelect={selectStatus}
            />
          </div>
          <Toolbar
            viewMode={filters.viewMode}
            onViewMode={filters.setViewMode}
            search={filters.search}
            onSearch={filters.setSearch}
            sortBy={filters.sortBy}
            onSort={filters.setSortBy}
            onRefresh={refresh}
          />
        </div>

        {filters.sortedRequests.length ? (
          filters.viewMode === "flat" ? (
            <>
              <RequestTable
                requests={filters.sortedRequests}
                context={requestContext}
              />
              <div className="md:hidden">
                <RequestCardList
                  requests={filters.sortedRequests}
                  context={requestContext}
                />
              </div>
            </>
          ) : (
            <SectionGroups
              groups={filters.groupedBySection}
              context={requestContext}
            />
          )
        ) : (
          <div className="px-4 py-16 text-center sm:px-6">
            <p className="text-sm font-semibold text-[#17211B]">
              {requests.length
                ? "No records match this view"
                : "No requests yet"}
            </p>
            <p className="mt-1 text-[13px] text-[#62716A]">
              {requests.length
                ? "Change the status filter or clear the search."
                : "New student requests will appear here."}
            </p>
          </div>
        )}
      </section>

      <EmailPanel students={students} requests={requests} />
    </div>
  );
}
