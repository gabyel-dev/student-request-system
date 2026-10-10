import type { StudentRequest } from "@/src/domain/request";

export const APP_TIME_ZONE = "Asia/Manila";

export function parseDatabaseDate(value: string): Date {
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
    ? value
    : `${value.replace(" ", "T")}Z`;
  return new Date(normalized);
}

export function ageInMilliseconds(value: string): number {
  const time = parseDatabaseDate(value).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : Date.now() - time;
}

export function isOverdue(request: StudentRequest): boolean {
  if (request.status === "completed" || request.status === "rejected") {
    return false;
  }
  return ageInMilliseconds(request.createdAt) > 48 * 60 * 60 * 1000;
}

export function formatAge(value: string): string {
  const minutes = Math.floor(ageInMilliseconds(value) / 60000);
  if (minutes === Number.POSITIVE_INFINITY || Number.isNaN(minutes)) {
    return "Date unavailable";
  }
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return days < 365
    ? `${months}mo ago`
    : `${Math.floor(days / 365)}y ago`;
}

export function formatDateTime(value: string): string {
  const date = parseDatabaseDate(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function getStartOfTodayInAppTimeZone(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return new Date(
    `${values.year}-${values.month}-${values.day}T00:00:00+08:00`,
  );
}