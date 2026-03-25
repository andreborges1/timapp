import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, toZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TORONTO_TZ = "America/Toronto";

export const EVENT_TYPES = [
  "INTERVIEW",
  "MEETING",
  "WORKSHOP",
  "TRAINING",
  "CONFERENCE",
  "OTHER",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  INTERVIEW: "Interview",
  MEETING: "Meeting",
  WORKSHOP: "Workshop",
  TRAINING: "Training",
  CONFERENCE: "Conference",
  OTHER: "Other",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  INTERVIEW: "bg-blue-100 text-blue-800 border-blue-200",
  MEETING: "bg-green-100 text-green-800 border-green-200",
  WORKSHOP: "bg-orange-100 text-orange-800 border-orange-200",
  TRAINING: "bg-purple-100 text-purple-800 border-purple-200",
  CONFERENCE: "bg-red-100 text-red-800 border-red-200",
  OTHER: "bg-gray-100 text-gray-800 border-gray-200",
};

export function nowInToronto(): Date {
  return toZonedTime(new Date(), TORONTO_TZ);
}

export function formatToronto(date: Date | string, fmt: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const zonedDate = toZonedTime(d, TORONTO_TZ);
  return format(zonedDate, fmt, { timeZone: TORONTO_TZ });
}

export function toTorontoDate(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return toZonedTime(d, TORONTO_TZ);
}

export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const toronto = toZonedTime(date, TORONTO_TZ);
  const day = toronto.getDay();
  const monday = new Date(toronto);
  monday.setDate(toronto.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export function isSameDay(a: Date, b: Date): boolean {
  const ta = toZonedTime(a, TORONTO_TZ);
  const tb = toZonedTime(b, TORONTO_TZ);
  return (
    ta.getFullYear() === tb.getFullYear() &&
    ta.getMonth() === tb.getMonth() &&
    ta.getDate() === tb.getDate()
  );
}

export function getStartOfDayToronto(date: Date): Date {
  const tz = toZonedTime(date, TORONTO_TZ);
  tz.setHours(0, 0, 0, 0);
  return tz;
}

export function getEndOfDayToronto(date: Date): Date {
  const tz = toZonedTime(date, TORONTO_TZ);
  tz.setHours(23, 59, 59, 999);
  return tz;
}
