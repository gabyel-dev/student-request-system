"use client";

import { FiFilter, FiRotateCw, FiSearch } from "react-icons/fi";
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
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex items-center gap-1 rounded-sm border border-[#d3e1d9] bg-[#f7fbf9] p-0.5">
        <ViewToggle
          active={viewMode === "flat"}
          label="Flat"
          onClick={() => onViewMode("flat")}
        />
        <ViewToggle
          active={viewMode === "section"}
          label="By section"
          onClick={() => onViewMode("section")}
        />
      </div>

      <label className="flex items-center gap-2">
        <FiSearch className="text-[#6f8579]" aria-hidden="true" />
        <span className="sr-only">Search requests</span>
        <input
          className="w-40 border-b border-[#cfddd5] bg-transparent py-1 text-sm text-[#14251d] outline-none transition-colors placeholder:text-[#8ba196] focus:border-[#087a54] sm:w-52"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search name, doc, section"
        />
      </label>

      <label className="flex items-center gap-1.5">
        <FiFilter className="text-[#6f8579]" aria-hidden="true" />
        <span className="sr-only">Sort requests</span>
        <select
          className="border-0 bg-transparent py-1 text-sm text-[#14251d] outline-none focus:ring-0"
          value={sortBy}
          onChange={(event) => onSort(event.target.value as SortOrder)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </label>

      <div className="flex items-center gap-1.5 text-xs text-[#5d6f66]">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 font-semibold text-[#087a54] hover:underline">
          <FiRotateCw className="text-[11px]" aria-hidden="true" />
          Refresh
        </button>
      </div>
    </div>
  );
}

function ViewToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
        active
          ? "bg-[#087a54] text-white"
          : "text-[#5d6f66] hover:text-[#14251d]"
      }`}>
      {label}
    </button>
  );
}