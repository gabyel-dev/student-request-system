"use client";

import { useState } from "react";
import { FiChevronDown, FiChevronRight, FiUsers } from "react-icons/fi";
import { RequestCardList } from "./requests-list";
import type { RequestListContext } from "./types";
import type { StudentRequest } from "@/src/domain/request";

export function SectionGroups({
  groups,
  context,
}: {
  groups: [string, StudentRequest[]][];
  context: RequestListContext;
}) {
  return (
    <div className="divide-y divide-[#dbebe3]">
      {groups.map(([section, requests]) => (
        <SectionGroup key={section} section={section} requests={requests} context={context} />
      ))}
    </div>
  );
}

function SectionGroup({
  section,
  requests,
  context,
}: {
  section: string;
  requests: StudentRequest[];
  context: RequestListContext;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex w-full items-center justify-between bg-[#f7fbf9] px-4 py-3 text-left sm:px-6">
        <span className="flex items-center gap-2.5">
          <FiUsers className="text-[#087a54]" aria-hidden="true" />
          <strong className="text-sm font-bold text-[#14251d]">{section}</strong>
          <span className="font-mono text-xs tabular-nums text-[#5d6f66]">
            {requests.length} request{requests.length === 1 ? "" : "s"}
          </span>
        </span>
        <span className="grid h-6 w-6 place-items-center text-[#6f8579]">
          {open ? (
            <FiChevronDown aria-hidden="true" />
          ) : (
            <FiChevronRight aria-hidden="true" />
          )}
        </span>
      </button>
      {open ? <RequestCardList requests={requests} context={context} /> : null}
    </div>
  );
}