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
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      {filterTabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            className={`pb-1.5 text-[13px] font-semibold transition-colors ${
              isActive
                ? "border-b-2 border-[#087a54] text-[#087a54]"
                : "border-b-2 border-transparent text-[#5d6f66] hover:text-[#14251d]"
            }`}
            type="button"
            key={tab.value}
            onClick={() => onSelect(tab.value)}
            aria-pressed={isActive}>
            {tab.label}{" "}
            <span
              className={`ml-0.5 font-mono text-xs tabular-nums ${
                isActive ? "text-[#087a54]" : "text-[#6f8579]"
              }`}>
              {counts[tab.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}