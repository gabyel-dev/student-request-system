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
      className="grid h-7 w-7 place-items-center rounded-lg text-[#62716A] hover:bg-black/5">
      <FiChevronRight
        className={`text-[15px] transition-transform ${expanded ? "rotate-90" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}

function lookupStudentNumber(context: RequestListContext, email: string) {
  return (
    context.emailMaps.studentNumberByEmail.get(email.toLowerCase()) ?? null
  );
}

function queueRangeLabel(requests: StudentRequest[]): string {
  const queues = requests.map((r) => r.queueNumber).sort((a, b) => a - b);
  const first = String(queues[0]).padStart(3, "0");
  const last = String(queues[queues.length - 1]).padStart(3, "0");
  return queues.length > 1 && first !== last
    ? `#${first}–#${last}`
    : `#${first}`;
}

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
          <tr className="border-b border-[#EEF2EF] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#62716A]">
            <th className="w-12 px-4 py-3">
              <span className="sr-only">Details</span>
            </th>
            <th className="py-3 pr-4 font-semibold">Queue</th>
            <th className="py-3 pr-4 font-semibold">Student</th>
            <th className="py-3 pr-4 font-semibold">Section</th>
            <th className="py-3 pr-4 font-semibold">Document</th>
            <th className="py-3 pr-4 font-semibold">Submitted</th>
            <th className="px-4 py-3 font-semibold">Status</th>
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
      <tr className="border-b border-[#EEF2EF] bg-[#FAFBFA] hover:bg-[#F4F7F5]">
        <td className="px-4 py-3">
          <ExpandButton expanded={open} onToggle={() => setOpen(!open)} />
        </td>
        <td className="py-3 pr-4 font-mono text-[13px] tabular-nums text-[#17211B]">
          {queueRangeLabel(requests)}
        </td>
        <td className="max-w-[220px] py-3 pr-4">
          <p className="truncate font-medium text-[#17211B]">
            {first.studentName}
          </p>
          <p className="truncate text-xs text-[#62716A]">
            {first.studentEmail}
          </p>
        </td>
        <td className="max-w-[140px] truncate py-3 pr-4 text-[13px] text-[#62716A]">
          {first.section ?? "Unknown"}
        </td>
        <td className="py-3 pr-4 text-[13px] text-[#3E4B44]">
          {requests.length} documents
        </td>
        <td className="py-3 pr-4" />
        <td className="px-4 py-3 text-xs text-[#62716A]">
          {requests.length} requests
        </td>
      </tr>
      {open
        ? requests.map((r) => (
            <RequestTableRow key={r.id} request={r} context={context} />
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
      <tr className="border-b border-[#EEF2EF] hover:bg-[#FAFBFA]">
        <td className="px-4 py-3">
          <ExpandButton
            expanded={expanded}
            onToggle={() => onToggleRequest(expanded ? null : request.id)}
          />
        </td>
        <td className="py-3 pr-4 font-mono text-[13px] tabular-nums text-[#17211B]">
          #{String(request.queueNumber).padStart(3, "0")}
        </td>
        <td className="max-w-[220px] py-3 pr-4">
          <p className="truncate font-medium text-[#17211B]">
            {request.studentName}
          </p>
          <p className="truncate text-xs text-[#62716A]">
            {request.studentEmail}
          </p>
        </td>
        <td className="max-w-[140px] truncate py-3 pr-4 text-[13px] text-[#62716A]">
          {request.section ?? "Unknown"}
        </td>
        <td className="max-w-[180px] truncate py-3 pr-4 text-[13px] text-[#3E4B44]">
          {request.documentType}
        </td>
        <td className="py-3 pr-4">
          <span className="text-[13px] tabular-nums text-[#62716A]">
            {formatAge(request.createdAt)}
          </span>
          {isOverdue(request) ? (
            <span className="ml-2 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Overdue
            </span>
          ) : null}
        </td>
        <td className="px-4 py-3">
          <StatusControl
            request={request}
            isPending={context.isPending}
            updatingId={context.updatingId}
            onChangeStatus={context.onChangeStatus}
          />
        </td>
      </tr>
      {expanded ? (
        <tr>
          <td
            colSpan={7}
            className="border-b border-[#EEF2EF] bg-[#FAFBFA] px-6 py-4">
            <RequestDetailGrid
              request={request}
              studentNumber={studentNumber}
            />
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

export function RequestCard({ request, context }: RequestListItemProps) {
  const { expandedId, onToggleRequest } = context;
  const expanded = expandedId === request.id;
  const studentNumber = lookupStudentNumber(context, request.studentEmail);
  return (
    <article className="px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="font-mono text-xs tabular-nums text-[#62716A]">
            #{String(request.queueNumber).padStart(3, "0")}
          </span>
          <span className="ml-2 text-sm font-medium text-[#17211B]">
            {request.studentName}
          </span>
          <span className="block truncate text-xs text-[#62716A]">
            {request.studentEmail}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs tabular-nums text-[#62716A]">
            {formatAge(request.createdAt)}
          </span>
          <ExpandButton
            expanded={expanded}
            onToggle={() => onToggleRequest(expanded ? null : request.id)}
          />
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className="truncate text-sm text-[#3E4B44]">
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
        <div className="mt-3 border-t border-[#EEF2EF] pt-3">
          <RequestDetailGrid request={request} studentNumber={studentNumber} />
        </div>
      ) : null}
    </article>
  );
}

export function RequestCardList({
  requests,
  context,
}: {
  requests: RequestListItemProps["request"][];
  context: RequestListContext;
}) {
  const groups = useMemo(() => groupRequestsByStudent(requests), [requests]);
  return (
    <div className="divide-y divide-[#EEF2EF]">
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
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 bg-[#FAFBFA] px-4 py-3 text-left hover:bg-[#F4F7F5] sm:px-5">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-[#17211B]">
            {first.studentName}
          </span>
          <span className="block truncate text-xs text-[#62716A]">
            {first.studentEmail}
          </span>
        </span>
        <span className="font-mono text-xs tabular-nums text-[#62716A]">
          {queueRangeLabel(requests)}
        </span>
        <span className="rounded-full bg-[#EEF2EF] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[#3E4B44]">
          {requests.length}
        </span>
        <FiChevronRight
          className={`text-[#62716A] transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="divide-y divide-[#EEF2EF] bg-white">
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} context={context} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
