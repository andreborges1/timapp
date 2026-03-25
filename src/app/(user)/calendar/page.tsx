"use client";

import { useEffect, useState } from "react";
import { WeeklyCalendar } from "@/components/events/WeeklyCalendar";
import { EventCard } from "@/components/events/EventCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventBadge } from "@/components/events/EventBadge";
import { MapPin, Clock } from "lucide-react";
import { formatToronto, TORONTO_TZ } from "@/lib/utils";
import { toZonedTime } from "date-fns-tz";
import { format, startOfWeek, addDays } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  _count: { attendances: number };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [myAttendanceIds, setMyAttendanceIds] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const now = toZonedTime(new Date(), TORONTO_TZ);
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    const weekMonday = addDays(monday, weekOffset * 7);
    const weekStr = format(weekMonday, "yyyy-MM-dd");

    Promise.all([
      fetch(`/api/events?week=${weekStr}`).then((r) => r.json()),
      fetch("/api/attendance/my").then((r) => r.json()),
    ]).then(([evs, att]) => {
      setEvents(evs);
      setMyAttendanceIds(att.map((a: any) => a.eventId));
    });
  }, [weekOffset]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <p className="text-slate-500 text-sm">Weekly view of all events</p>
      </div>

      <WeeklyCalendar
        events={events}
        myAttendanceEventIds={myAttendanceIds}
        onEventClick={setSelectedEvent}
      />

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        {selectedEvent && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-start gap-2 pr-4">
                <span className="leading-tight">{selectedEvent.title.split(" - ")[0]}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <EventBadge type={selectedEvent.type} />
                {myAttendanceIds.includes(selectedEvent.id) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    Registered
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={14} />
                {formatToronto(new Date(selectedEvent.startTime), "EEEE, MMM d · HH:mm")} –{" "}
                {formatToronto(new Date(selectedEvent.endTime), "HH:mm")}
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={14} />
                  {selectedEvent.location}
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
