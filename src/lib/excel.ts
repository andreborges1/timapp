import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { TORONTO_TZ, EVENT_TYPE_LABELS, EventType } from "@/lib/utils";
import { toZonedTime, format } from "date-fns-tz";

function torontoHour(date: Date): number {
  return toZonedTime(date, TORONTO_TZ).getHours();
}

function torontoDayName(date: Date): string {
  return format(date, "EEEE", { timeZone: TORONTO_TZ });
}

function torontoDateStr(date: Date): string {
  return format(date, "yyyy-MM-dd", { timeZone: TORONTO_TZ });
}

function torontoTimeStr(date: Date): string {
  return format(date, "HH:mm", { timeZone: TORONTO_TZ });
}

export async function generateReport(from: Date, to: Date): Promise<Buffer> {
  const wb = XLSX.utils.book_new();

  // Fetch all events with attendance counts in range
  const events = await prisma.event.findMany({
    where: { startTime: { gte: from, lte: to } },
    include: { _count: { select: { attendances: true } } },
    orderBy: { startTime: "asc" },
  });

  // Fetch all attendances in range
  const attendances = await prisma.attendance.findMany({
    where: { scannedAt: { gte: from, lte: to } },
    include: { event: true, user: true },
  });

  // ── Sheet 1: All Events ────────────────────────────────────────────────────
  const eventsSheet = events.map((e) => ({
    Title: e.title,
    Type: EVENT_TYPE_LABELS[e.type as EventType] ?? e.type,
    Date: torontoDateStr(e.startTime),
    "Start Time": torontoTimeStr(e.startTime),
    "End Time": torontoTimeStr(e.endTime),
    Location: e.location ?? "",
    Attendances: e._count.attendances,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eventsSheet), "All Events");

  // ── Sheet 2: By Event Type ─────────────────────────────────────────────────
  const byType: Record<string, { total: number; users: Set<string> }> = {};
  for (const a of attendances) {
    const type = a.event.type;
    if (!byType[type]) byType[type] = { total: 0, users: new Set() };
    byType[type].total++;
    byType[type].users.add(a.userId);
  }
  const typeSheet = Object.entries(byType).map(([type, d]) => ({
    "Event Type": EVENT_TYPE_LABELS[type as EventType] ?? type,
    "Total Attendances": d.total,
    "Unique Users": d.users.size,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(typeSheet), "By Event Type");

  // ── Sheet 3: By Day of Week ────────────────────────────────────────────────
  const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const byDay: Record<string, number> = {};
  for (const d of DAY_ORDER) byDay[d] = 0;
  for (const a of attendances) {
    const day = torontoDayName(a.scannedAt);
    if (byDay[day] !== undefined) byDay[day]++;
  }
  const daySheet = DAY_ORDER.map((day) => ({ "Day of Week": day, "Total Attendances": byDay[day] }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(daySheet), "By Day of Week");

  // ── Sheet 4: By Hour of Day ────────────────────────────────────────────────
  const byHour: Record<number, number> = {};
  for (let h = 8; h <= 21; h++) byHour[h] = 0;
  for (const a of attendances) {
    const h = torontoHour(a.scannedAt);
    if (byHour[h] !== undefined) byHour[h]++;
  }
  const hourSheet = Object.entries(byHour).map(([h, count]) => ({
    Hour: `${h.toString().padStart(2, "0")}:00`,
    "Total Attendances": count,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hourSheet), "By Hour of Day");

  // ── Sheet 5: Top 10 Events ────────────────────────────────────────────────
  const top10 = [...events]
    .sort((a, b) => b._count.attendances - a._count.attendances)
    .slice(0, 10)
    .map((e) => ({
      Title: e.title,
      Type: EVENT_TYPE_LABELS[e.type as EventType] ?? e.type,
      Date: torontoDateStr(e.startTime),
      "Start Time": torontoTimeStr(e.startTime),
      Attendances: e._count.attendances,
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(top10), "Top 10 Events");

  // ── Sheet 6: Daily Trend ──────────────────────────────────────────────────
  const dailyCount: Record<string, number> = {};
  for (const a of attendances) {
    const d = torontoDateStr(a.scannedAt);
    dailyCount[d] = (dailyCount[d] ?? 0) + 1;
  }
  const trendSheet = Object.entries(dailyCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ Date: date, "Total Attendances": count }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trendSheet), "Daily Trend");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
