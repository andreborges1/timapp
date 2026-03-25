"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ManualCodeInput } from "@/components/scan/ManualCodeInput";
import { ScanResult } from "@/components/scan/ScanResult";
import { EventBadge } from "@/components/events/EventBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatToronto, TORONTO_TZ } from "@/lib/utils";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { ScanLine, Keyboard, Camera, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const QRScanner = dynamic(
  () => import("@/components/scan/QRScanner").then((m) => m.QRScanner),
  { ssr: false }
);

interface Event {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string | null;
}

type ScanResultData = {
  type: "success" | "error" | "overlap" | "too-early";
  message: string;
  user?: { name: string; email: string; image?: string | null };
  event?: { title: string; startTime: string };
};

export default function ScanPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [showEventList, setShowEventList] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResultData | null>(null);

  useEffect(() => {
    const toronto = toZonedTime(new Date(), TORONTO_TZ);
    const dateStr = format(toronto, "yyyy-MM-dd");
    fetch(`/api/events?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(data);
        if (data.length === 1) {
          setSelectedEventId(data[0].id);
        } else {
          const now = new Date();
          const happening = data.find(
            (e: Event) => new Date(e.startTime) <= now && new Date(e.endTime) >= now
          );
          if (happening) setSelectedEventId(happening.id);
          else setShowEventList(true);
        }
      });
  }, []);

  const handleScan = useCallback(
    async (qrCode: string) => {
      if (!selectedEventId) return;
      setScanning(true);
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrCode, eventId: selectedEventId }),
        });
        const data = await res.json();
        if (res.ok) {
          setResult({ type: "success", message: "Attendance registered!", user: data.user, event: data.event });
        } else {
          const type = data.code === "OVERLAP_CONFLICT" ? "overlap" : data.code === "TOO_EARLY" ? "too-early" : "error";
          setResult({ type, message: data.error ?? "Registration failed." });
        }
      } finally {
        setScanning(false);
      }
    },
    [selectedEventId]
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const now = new Date();

  return (
    <div className="max-w-lg space-y-3">
      {/* Event selector — compact pill, expands to list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowEventList((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div className="min-w-0 flex-1">
            {selectedEvent ? (
              <>
                <p className="text-xs text-slate-500 mb-0.5">Scanning for</p>
                <p className="font-semibold text-slate-900 text-sm truncate">
                  {selectedEvent.title.split(" - ")[0]}
                </p>
                <p className="text-xs text-slate-400">
                  {formatToronto(new Date(selectedEvent.startTime), "HH:mm")}–
                  {formatToronto(new Date(selectedEvent.endTime), "HH:mm")}
                  {selectedEvent.location ? ` · ${selectedEvent.location}` : ""}
                </p>
              </>
            ) : (
              <p className="text-slate-400 text-sm">Tap to select an event</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {selectedEvent && <EventBadge type={selectedEvent.type} />}
            <ChevronDown size={16} className={cn("text-slate-400 transition-transform", showEventList && "rotate-180")} />
          </div>
        </button>

        {/* Expandable event list */}
        {showEventList && (
          <div className="border-t border-slate-100 max-h-52 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-sm">No events today</p>
            ) : (
              events.map((e) => {
                const isNow = new Date(e.startTime) <= now && new Date(e.endTime) >= now;
                return (
                  <button
                    key={e.id}
                    onClick={() => { setSelectedEventId(e.id); setShowEventList(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 border-b border-slate-50 last:border-0",
                      selectedEventId === e.id && "bg-blue-50"
                    )}
                  >
                    <span className="text-sm text-slate-800 truncate font-medium">{e.title.split(" - ")[0]}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {isNow && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                      <span className="text-xs text-slate-500">{formatToronto(new Date(e.startTime), "HH:mm")}</span>
                      <EventBadge type={e.type} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <ScanResult
          type={result.type}
          message={result.message}
          user={result.user}
          event={result.event}
          onDismiss={() => setResult(null)}
        />
      )}

      {/* Scanner — always visible */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <Tabs defaultValue="camera">
          <TabsList className="mb-3 w-full">
            <TabsTrigger value="camera" className="flex-1 gap-1.5">
              <Camera size={14} /> Camera
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 gap-1.5">
              <Keyboard size={14} /> Manual
            </TabsTrigger>
          </TabsList>
          <TabsContent value="camera">
            {selectedEventId ? (
              <QRScanner onScan={handleScan} active={!scanning} />
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
                <div className="text-center">
                  <ScanLine size={32} className="mx-auto mb-2 opacity-30" />
                  Select an event above
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="manual">
            <ManualCodeInput onScan={handleScan} disabled={scanning || !selectedEventId} />
            {!selectedEventId && (
              <p className="text-xs text-slate-400 mt-2">Select an event above to enable</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
