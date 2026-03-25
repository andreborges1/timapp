"use client";

import { useEffect, useState } from "react";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { TORONTO_TZ, EVENT_TYPES, EVENT_TYPE_LABELS, formatToronto } from "@/lib/utils";
import { toZonedTime } from "date-fns-tz";
import { format, addDays } from "date-fns";

interface Event {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  _count: { attendances: number };
}

function todayStr() {
  const t = toZonedTime(new Date(), TORONTO_TZ);
  return format(t, "yyyy-MM-dd");
}

export default function HostEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [dateStr, setDateStr] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", type: "MEETING", description: "", startTime: "", endTime: "", location: "",
  });

  useEffect(() => {
    if (!dateStr) {
      setDateStr(todayStr());
      return;
    }
    const params = new URLSearchParams({ date: dateStr });
    if (filterType !== "ALL") params.set("type", filterType);
    fetch(`/api/events?${params}`)
      .then((r) => r.json())
      .then(setEvents);
  }, [dateStr, filterType]);

  function prevDay() {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    setDateStr(format(d, "yyyy-MM-dd"));
  }
  function nextDay() {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    setDateStr(format(d, "yyyy-MM-dd"));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Failed to create event.");
        return;
      }
      toast.success("Event created successfully.");
      setShowCreate(false);
      setForm({ title: "", type: "MEETING", description: "", startTime: "", endTime: "", location: "" });
      // Refresh
      const params = new URLSearchParams({ date: dateStr });
      if (filterType !== "ALL") params.set("type", filterType);
      fetch(`/api/events?${params}`).then((r) => r.json()).then(setEvents);
    } finally {
      setCreating(false);
    }
  }

  if (!dateStr) return null;

  const displayDate = new Date(dateStr + "T12:00:00");

  return (
    <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Events</h1>
            <p className="text-slate-500 text-sm">Manage and view scheduled events</p>
          </div>
          <div className="flex gap-2">
            {/* XLSX Import stub */}
            <Button variant="outline" disabled className="gap-2 opacity-60 hidden sm:flex">
              <Upload size={15} />
              Import XLSX
            </Button>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus size={15} />
              New Event
            </Button>
          </div>
        </div>

        {/* Date navigator + type filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevDay}>
              <ChevronLeft size={14} />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[120px] text-center">
              {format(displayDate, "EEE, MMM d yyyy")}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextDay}>
              <ChevronRight size={14} />
            </Button>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="ALL">All Types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {/* Events list */}
        {events.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No events for this date.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} showAttendanceCount />
            ))}
          </div>
        )}

        {/* Create event dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="mt-1" required />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mt-1 bg-white"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Time</Label>
                  <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="mt-1" required />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="mt-1" required />
                </div>
              </div>
              <div>
                <Label>Location (optional)</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room, online, etc." className="mt-1" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Event"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}
