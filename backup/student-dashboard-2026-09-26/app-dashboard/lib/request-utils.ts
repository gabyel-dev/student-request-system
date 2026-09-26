import type { StudentRequest, RequestStatus } from "@/src/domain/request";
import type { User } from "@/src/domain/user";

export const filterTabs = [
  { value: "all", label: "All records" },
  { value: "pending", label: "Needs review" },
  { value: "processing", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
] as const;

export type StatusFilter = RequestStatus | "all";
export type SortOrder = "newest" | "oldest";
export type ViewMode = "flat" | "section";

export const statusTone: Record<RequestStatus, string> = {
  pending: "bg-[#b07b17]",
  processing: "bg-[#1f6fb2]",
  completed: "bg-[#087a54]",
  rejected: "bg-[#b0423c]",
};

export const statusMeta: Record<
  RequestStatus,
  { label: string; width: number; bar: string; text: string }
> = {
  pending: {
    label: "Pending review",
    width: 25,
    bar: "bg-gradient-to-r from-[#c9922b] to-[#b07b17]",
    text: "text-[#8a5e10]",
  },
  processing: {
    label: "Being processed",
    width: 65,
    bar: "bg-gradient-to-r from-[#4fa3e3] to-[#1f6fb2]",
    text: "text-[#16578f]",
  },
  completed: {
    label: "Completed",
    width: 100,
    bar: "bg-gradient-to-r from-[#28b48a] to-[#087a54]",
    text: "text-[#0a6a49]",
  },
  rejected: {
    label: "Rejected",
    width: 100,
    bar: "bg-gradient-to-r from-[#c96a63] to-[#b0423c]",
    text: "text-[#8f3029]",
  },
};

export type EmailMaps = {
  sectionByEmail: Map<string, string>;
  studentNumberByEmail: Map<string, string | null>;
};

/** Lookup maps derived from the student profiles list. */
export function buildEmailMaps(students: User[]): EmailMaps {
  const sectionByEmail = new Map<string, string>();
  const studentNumberByEmail = new Map<string, string | null>();

  for (const student of students) {
    const email = student.email.toLowerCase();
    sectionByEmail.set(email, student.section ?? "Unknown");
    studentNumberByEmail.set(email, student.studentNumber);
  }

  return { sectionByEmail, studentNumberByEmail };
}

export function countRequests(
  requests: StudentRequest[],
): Record<StatusFilter, number> {
  return {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    processing: requests.filter((r) => r.status === "processing").length,
    completed: requests.filter((r) => r.status === "completed").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };
}

export function filterRequests(
  requests: StudentRequest[],
  { search, statusFilter, sectionByEmail }: {
    search: string;
    statusFilter: StatusFilter;
    sectionByEmail: Map<string, string>;
  },
): StudentRequest[] {
  const normalized = search.trim().toLowerCase();

  return requests.filter((request) => {
    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;
    // Prefer the section snapshotted onto the request; fall back to the
    // student's current profile section.
    const section =
      request.section ??
      sectionByEmail.get(request.studentEmail.toLowerCase()) ??
      "Unknown";
    const matchesSearch = normalized
      ? [
          request.studentName,
          request.studentEmail,
          request.documentType,
          section,
          String(request.queueNumber),
        ].some((value) => value.toLowerCase().includes(normalized))
      : true;
    return matchesStatus && matchesSearch;
  });
}

export function sortRequests(
  requests: StudentRequest[],
  order: SortOrder,
): StudentRequest[] {
  return [...requests].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return order === "newest" ? bTime - aTime : aTime - bTime;
  });
}

/**
 * Groups requests by the student who submitted them (matched on email), keeping
 * the list's existing order. Used by the admin queue so a student with several
 * requests collapses into one dropdown instead of cluttering the list. Requests
 * with no email are never grouped (each stays its own row).
 */
export function groupRequestsByStudent(
  requests: StudentRequest[],
): StudentRequest[][] {
  const groups: StudentRequest[][] = [];
  const index = new Map<string, number>();

  for (const request of requests) {
    const key = request.studentEmail.trim().toLowerCase() || request.id;
    const existing = index.get(key);
    if (existing === undefined) {
      index.set(key, groups.length);
      groups.push([request]);
    } else {
      groups[existing].push(request);
    }
  }

  return groups;
}

export function groupRequestsBySection(
  requests: StudentRequest[],
  sectionByEmail: Map<string, string>,
): [string, StudentRequest[]][] {
  const groups = new Map<string, StudentRequest[]>();

  for (const request of requests) {
    const section =
      request.section ??
      sectionByEmail.get(request.studentEmail.toLowerCase()) ??
      "Unknown";
    const existing = groups.get(section);
    if (existing) {
      existing.push(request);
    } else {
      groups.set(section, [request]);
    }
  }

  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}