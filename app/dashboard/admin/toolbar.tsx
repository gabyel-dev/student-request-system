"use client";

import { FiRotateCw, FiSearch } from "react-icons/fi";
import type { SortOrder, ViewMode } from "../lib/request-utils";

export function Toolbar({
  viewMode,
  onViewMode,
  search,
  onSearch,
  sortBy,
  onSort,
  onRefresh,
}: {
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  search: string;
  onSearch: (value: string) => void;
  sortBy: SortOrder;
  onSort: (order: SortOrder) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-full border border-[#E6ECE8] bg-[#F7F9F8] p-1">
        {(["flat", "section"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewMode(mode)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              viewMode === mode
                ? "bg-white text-[#17211B] shadow-[0_1px_2px_rgba(18,28,22,0.08)]"
                : "text-[#62716A] hover:text-[#17211B]"
            }`}>
            {mode === "flat" ? "Flat" : "By section"}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 rounded-full border border-[#E6ECE8] bg-white px-3 py-1.5">
        <FiSearch className="text-[#62716A]" aria-hidden="true" />
        <span className="sr-only">Search requests</span>
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search name, doc, section"
          className="w-40 bg-transparent text-[13px] text-[#17211B] outline-none placeholder:text-[#8A9A92] sm:w-48"
        />
      </label>

      <select
        value={sortBy}
        onChange={(e) => onSort(e.target.value as SortOrder)}
        aria-label="Sort requests"
        className="rounded-full border border-[#E6ECE8] bg-white px-3 py-1.5 text-[13px] text-[#17211B] outline-none">
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>

      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-[#0B6B4A] hover:bg-[#0B6B4A]/5">
        <FiRotateCw className="text-xs" aria-hidden="true" />
        Refresh
      </button>
    </div>
  );
}
