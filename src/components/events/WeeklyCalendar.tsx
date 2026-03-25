"use client";

import { useState } from "react";
import { formatToronto, toTorontoDate, TORONTO_TZ } from "@/lib/utils";
import { EventBadge } from "./EventBadge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, startOfWeek, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface CalEvent {
  id: string;
  title: string;
  type: string;
  startTime: string | Date;
  endTime: string | Date;
  location?: string | null;
  _count?: { attendances: number };
}

interface WeeklyCalendarProps {
  events: CalEvent[];
  myAttendanceEventIds?: string[];
  onEventClick?: (event: any) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8–21

export function WeeklyCalendar({ events, myAttendanceEventIds = [], onEventClick }: WeeklyCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const now = toZonedTime(new Date(), TORONTO_TZ);
  const baseMonday = startOfWeek(now, { weekStartsOn: 1 });
  const monday = addDays(baseMonday, weekOffset * 7);
  const days = Array.from({ length: 6 }, (_, i) => addDays(monday, i));

  const weekLabel = `${format(monday, "MMM d")} – ${format(addDays(monday, 6), "MMM d, yyyy")}`;

  function getEventsForDayHour(day: Date, hour: number) {
    return events.filter((e) => {
      const start = toZonedTime(new Date(e.startTime), TORONTO_TZ);
      return (
        start.getFullYear() === day.getFullYear() &&
        start.getMonth() === day.getMonth() &&
        start.getDate() === day.getDate() &&
        start.getHours() === hour
      );
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft size={16} />
        </Button>
        <p className="text-sm font-medium text-slate-700">{weekLabel}</p>
        <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o + 1)}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Calendar grid — horizontal scroll on mobile */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <div className="min-w-[640px]">
          {/* Header row */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            <div className="p-2 text-xs text-slate-400 font-medium" />
            {days.map((day, i) => {
              const isToday =
                day.getFullYear() === now.getFullYear() &&
                day.getMonth() === now.getMonth() &&
                day.getDate() === now.getDate();
              return (
                <div key={i} className="p-2 text-center">
                  <p className={`text-xs font-medium ${isToday ? "text-blue-600" : "text-slate-500"}`}>
                    {DAY_NAMES[i]}
                  </p>
                  <p className={`text-sm font-bold ${isToday ? "text-blue-600" : "text-slate-800"}`}>
                    {format(day, "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-7 border-b border-slate-100 last:border-0">
              <div className="p-1.5 text-xs text-slate-400 font-medium text-right pr-2 self-start pt-2">
                {hour.toString().padStart(2, "0")}:00
              </div>
              {days.map((day, i) => {
                const dayEvents = getEventsForDayHour(day, hour);
                return (
                  <div key={i} className="p-1 min-h-[52px] flex flex-col gap-0.5 border-l border-slate-100">
                    {dayEvents.map((e) => {
                      const registered = myAttendanceEventIds.includes(e.id);
                      return (
                        <button
                          key={e.id}
                          onClick={() => onEventClick?.(e)}
                          className={`text-left text-xs rounded px-1.5 py-1 truncate w-full transition-colors ${
                            registered
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                          title={e.title}
                        >
                          {e.title.split(" - ")[0]}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
