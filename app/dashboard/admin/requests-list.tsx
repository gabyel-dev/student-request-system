"use client";

import { Fragment } from "react";
import { FiChevronRight } from "react-icons/fi";
import { formatAge, isOverdue } from "../lib/format";
import { RequestDetailGrid } from "./request-details";
import { StatusControl } from "./status-control";
import type { RequestListItemProps, RequestListContext } from "./types";

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

/** Desktop-only table with expandable detail rows. */
export function RequestTable({
  requests,
  context,
}: {
  requests: RequestListItemProps["request"][];
  context: RequestListContext;
}) {
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
          {requests.map((request) => (
            <RequestTableRow key={request.id} request={request} context={context} />
          ))}
        </tbody>
      </table>
    </div>
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
          {studentNumber ?? "—"}
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
  return (
    <div className="divide-y divide-[#dbebe3]">
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} context={context} />
      ))}
    </div>
  );
}