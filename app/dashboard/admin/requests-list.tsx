"use client";

import { Fragment, useMemo, useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { formatAge, isOverdue } from "../lib/format";
import { groupRequestsByStudent } from "../lib/request-utils";
import { RequestDetailGrid } from "./request-details";
import { StatusControl } from "./status-control";
import type { RequestListItemProps, RequestListContext } from "./types";
import type { StudentRequest } from "@/src/domain/request";

function ExpandButton({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="grid h-6 w-6 place-items-center rounded-sm text-[#6f8579] transition-colors hover:text-[#087a54]">
      <FiChevronRight
        className={`text-[14px] transition-transform ${expanded ? "rotate-90" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}

function lookupStudentNumber(context: RequestListContext, email: string) {
  return context.emailMaps.studentNumberByEmail.get(email.toLowerCase()) ?? null;
}

/** Human-range label for a student's queue numbers, e.g. "#001–#003". */
function queueRangeLabel(requests: StudentRequest[]): string {
  const queues = requests
    .map((request) => request.queueNumber)
    .sort((a, b) => a - b);
  const first = String(queues[0]).padStart(3, "0");
  const last = String(queues[queues.length - 1]).padStart(3, "0");
  return queues.length > 1 && first !== last ? `#${first}–#${last}` : `#${first}`;
}

/** Desktop-only table with expandable detail rows. */
export function RequestTable({
  requests,
  context,
}: {
  requests: RequestListItemProps["request"][];
  context: RequestListContext;
}) {
  const groups = useMemo(() => groupRequestsByStudent(requests), [requests]);

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#e7efea] text-[11px] font-semibold uppercase tracking-[.08em] text-[#5d6f66]">
            <th className="w-12 px-4 py-3">
              <span className="sr-only">Details</span>
            </th>
            <th className="py-3">Queue</th>
            <th className="py-3">Student</th>
            <th className="py-3">Section</th>
            <th className="py-3">Document</th>
            <th className="py-3">Submitted</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) =>
            group.length === 1 ? (
              <RequestTableRow
                key={group[0].id}
                request={group[0]}
                context={context}
              />
            ) : (
              <StudentGroupRow
                key={group[0].studentEmail.toLowerCase()}
                requests={group}
                context={context}
              />
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Header row for a student who has several requests. Collapsed by default so
 * the queue stays readable; expanding shows the student's individual rows.
 */
function StudentGroupRow({
  requests,
  context,
}: {
  requests: StudentRequest[];
  context: RequestListContext;
}) {
  const [open, setOpen] = useState(false);
  const first = requests[0];

  return (
    <Fragment>
      <tr className="border-b border-[#e7efea] bg-[#fbfdfc] transition-colors hover:bg-[#f1f8f4]">
        <td className="px-4 py-3.5">
          <ExpandButton expanded={open} onToggle={() => setOpen(!open)} />
        </td>
        <td className="py-3.5 font-mono font-bold tabular-nums text-[#087a54]">
          {queueRangeLabel(requests)}
        </td>
        <td className="max-w-55 py-3.5">
          <strong className="block truncate font-medium text-[#14251d]">
            {first.studentName}
          </strong>
          <span className="block truncate text-xs text-[#5d6f66]">
            {first.studentEmail}
          </span>
        </td>
        <td className="max-w-32 truncate py-3.5 text-xs text-[#5d6f66]">
          {first.section ?? "Unknown"}
        </td>
        <td className="max-w-40 truncate py-3.5 text-[#41584c]">
          {requests.length} {requests.length === 1 ? "document" : "documents"}
        </td>
        <td className="py-3.5" />
        <td className="px-6 py-3.5 text-xs font-semibold text-[#5d6f66]">
          {requests.length} request{requests.length === 1 ? "" : "s"}
        </td>
      </tr>
      {open
        ? requests.map((request) => (
            <RequestTableRow key={request.id} request={request} context={context} />
          ))
        : null}
    </Fragment>
  );
}

function RequestTableRow({ request, context }: RequestListItemProps) {
  const { expandedId, onToggleRequest } = context;
  const expanded = expandedId === request.id;
  const studentNumber = lookupStudentNumber(context, request.studentEmail);

  return (
    <Fragment>
      <tr className="border-b border-[#e7efea] transition-colors hover:bg-[#f7fbf9]">
        <td className="px-4 py-3.5">
          <ExpandButton
            expanded={expanded}
            onToggle={() => onToggleRequest(expanded ? null : request.id)}
          />
        </td>
        <td className="py-3.5 font-mono font-bold tabular-nums text-[#087a54]">
          #{String(request.queueNumber).padStart(3, "0")}
        </td>
        <td className="max-w-55 py-3.5">
          <strong className="block truncate font-medium text-[#14251d]">
            {request.studentName}
          </strong>
          <span className="block truncate text-xs text-[#5d6f66]">
            {request.studentEmail}
          </span>
        </td>
        <td className="max-w-32 truncate py-3.5 text-xs text-[#5d6f66]">
          {request.section ?? "Unknown"}
        </td>
        <td className="max-w-40 truncate py-3.5 text-[#41584c]">
          {request.documentType}
        </td>
        <td className="py-3.5">
          <span className="text-xs tabular-nums text-[#5d6f66]">
            {formatAge(request.createdAt)}
          </span>
          {isOverdue(request) ? (
            <span className="ml-2 border border-[#ecd3a4] px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a5a16]">
              Overdue
            </span>
          ) : null}
        </td>
        <td className="px-6 py-3.5">
          <StatusControl
            request={request}
            isPending={context.isPending}
            updatingId={context.updatingId}
            onChangeStatus={context.onChangeStatus}
          />
        </td>
      </tr>
      {expanded ? (
        <tr key={`${request.id}-details`} id={`request-detail-${request.id}`}>
          <td colSpan={7} className="border-b border-[#e7efea] bg-[#f7fbf9] px-6 py-4">
            <RequestDetailGrid request={request} studentNumber={studentNumber} />
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

/** Compact card layout used on mobile and inside section groups. */
export function RequestCard({ request, context }: RequestListItemProps) {
  const { expandedId, onToggleRequest } = context;
  const expanded = expandedId === request.id;
  const studentNumber = lookupStudentNumber(context, request.studentEmail);

  return (
    <article className={`px-4 py-4 sm:px-6 ${expanded ? "bg-[#f7fbf9]" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="font-mono text-xs font-bold tabular-nums text-[#087a54]">
            #{String(request.queueNumber).padStart(3, "0")}
          </span>
          <strong className="ml-2 text-sm text-[#14251d]">
            {request.studentName}
          </strong>
          <span className="ml-2 text-xs text-[#5d6f66]">
            {request.studentEmail}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs tabular-nums text-[#5d6f66]">
            {formatAge(request.createdAt)}
          </span>
          <ExpandButton
            expanded={expanded}
            onToggle={() => onToggleRequest(expanded ? null : request.id)}
          />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="truncate text-sm text-[#41584c]">
          {request.documentType}
        </span>
        <StatusControl
          request={request}
          isPending={context.isPending}
          updatingId={context.updatingId}
          onChangeStatus={context.onChangeStatus}
        />
      </div>
      {expanded ? (
        <div
          id={`request-detail-${request.id}`}
          className="mt-3 border-t border-[#dbebe3] pt-3">
          <RequestDetailGrid request={request} studentNumber={studentNumber} />
        </div>
      ) : null}
    </article>
  );
}

/** Stacked card list for small screens and section-group views. */
export function RequestCardList({
  requests,
  context,
}: {
  requests: RequestListItemProps["request"][];
  context: RequestListContext;
}) {
  const groups = useMemo(() => groupRequestsByStudent(requests), [requests]);

  return (
    <div className="divide-y divide-[#dbebe3]">
      {groups.map((group) =>
        group.length === 1 ? (
          <RequestCard key={group[0].id} request={group[0]} context={context} />
        ) : (
          <StudentCardGroup
            key={group[0].studentEmail.toLowerCase()}
            requests={group}
            context={context}
          />
        ),
      )}
    </div>
  );
}

/** Card-list version of the per-student dropdown header. */
function StudentCardGroup({
  requests,
  context,
}: {
  requests: StudentRequest[];
  context: RequestListContext;
}) {
  const [open, setOpen] = useState(false);
  const first = requests[0];

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 bg-[#fbfdfc] px-4 py-3 text-left transition hover:bg-[#f1f8f4] sm:px-6">
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm text-[#14251d]">
            {first.studentName}
          </strong>
          <span className="block truncate text-xs text-[#5d6f66]">
            {first.studentEmail}
          </span>
        </span>
        <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-[#087a54]">
          {queueRangeLabel(requests)}
        </span>
        <span className="shrink-0 rounded-full bg-[#e7efe9] px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-[#5d6f66]">
          {requests.length}
        </span>
        <span className="grid h-6 w-6 shrink-0 place-items-center text-[#6f8579]">
          <FiChevronRight
            className={`text-[14px] transition-transform ${open ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>
      {open ? (
        <div className="divide-y divide-[#dbebe3] bg-white">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} context={context} />
          ))}
        </div>
      ) : null}
    </div>
  );
}