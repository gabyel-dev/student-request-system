"use client";

import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
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
    <div className="divide-y divide-[#EEF2EF]">
      {groups.map(([section, requests]) => (
        <SectionGroup
          key={section}
          section={section}
          requests={requests}
          context={context}
        />
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
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#FAFBFA] sm:px-5">
        <span className="flex items-center gap-2.5">
          <strong className="text-sm font-semibold text-[#17211B]">
            {section}
          </strong>
          <span className="text-xs tabular-nums text-[#62716A]">
            {requests.length} request{requests.length === 1 ? "" : "s"}
          </span>
        </span>
        <span className="text-[#62716A]">
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
