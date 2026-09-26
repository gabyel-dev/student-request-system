"use client";

import { useMemo, useState } from "react";
import type { StudentRequest } from "@/src/domain/request";
import type { User } from "@/src/domain/user";
import {
  buildEmailMaps,
  countRequests,
  filterRequests,
  groupRequestsBySection,
  sortRequests,
  type SortOrder,
  type StatusFilter,
  type ViewMode,
} from "./request-utils";

export function useRequestFilters(requests: StudentRequest[], students: User[]) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [sortBy, setSortBy] = useState<SortOrder>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("flat");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const emailMaps = useMemo(() => buildEmailMaps(students), [students]);

  const counts = useMemo(() => countRequests(requests), [requests]);

  const visibleRequests = useMemo(
    () =>
      filterRequests(requests, {
        search,
        statusFilter,
        sectionByEmail: emailMaps.sectionByEmail,
      }),
    [requests, search, statusFilter, emailMaps],
  );

  const sortedRequests = useMemo(
    () => sortRequests(visibleRequests, sortBy),
    [visibleRequests, sortBy],
  );

  const groupedBySection = useMemo(
    () => groupRequestsBySection(sortedRequests, emailMaps.sectionByEmail),
    [sortedRequests, emailMaps],
  );

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    expandedId,
    setExpandedId,
    counts,
    sortedRequests,
    groupedBySection,
    emailMaps,
  };
}