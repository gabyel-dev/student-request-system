"use client";

import { filterTabs, type StatusFilter } from "../lib/request-utils";

export function SummaryTabs({
  counts,
  active,
  onSelect,
}: {
  counts: Record<StatusFilter, number>;
  active: StatusFilter;
  onSelect: (status: StatusFilter) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-[#E6ECE8] bg-[#F7F9F8] p-1">
      {filterTabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onSelect(tab.value)}
            aria-pressed={isActive}
            className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
              isActive
                ? "bg-white text-[#17211B] shadow-[0_1px_2px_rgba(18,28,22,0.08)]"
                : "text-[#62716A] hover:text-[#17211B]"
            }`}>
            {tab.label}{" "}
            <span className="font-mono text-xs tabular-nums">
              {counts[tab.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
