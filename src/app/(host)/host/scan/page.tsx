"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ManualCodeInput } from "@/components/scan/ManualCodeInput";
import { ScanResult } from "@/components/scan/ScanResult";
import { PaymentModal } from "@/components/attendance/PaymentModal";
import { AutoPayModal } from "@/components/attendance/AutoPayModal";
import { EventBadge } from "@/components/events/EventBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatToronto, TORONTO_TZ } from "@/lib/utils";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { ScanLine, Keyboard, Camera, Clock, MapPin } from "lucide-react";
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
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showAutoPay, setShowAutoPay] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<{
    userName: string;
    eventTitle: string;
  } | null>(null);

  useEffect(() => {
    const toronto = toZonedTime(new Date(), TORONTO_TZ);
    const dateStr = format(toronto, "yyyy-MM-dd");
    fetch(`/api/events?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(data);
        // Auto-select if only one event, or the currently happening one
        if (data.length === 1) {
          setSelectedEventId(data[0].id);
        } else {
          const now = new Date();
          const happening = data.find(
            (e: Event) => new Date(e.startTime) <= now && new Date(e.endTime) >= now
          );
          if (happening) setSelectedEventId(happening.id);
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
          setResult({
            type: "success",
            message: "Attendance registered successfully!",
            user: data.user,
            event: data.event,
          });
          setLastSuccess({ userName: data.user.name, eventTitle: data.event.title });
          setTimeout(() => setShowPayment(true), 2000);
        } else {
          const type =
            data.code === "OVERLAP_CONFLICT" ? "overlap" :
            data.code === "TOO_EARLY" ? "too-early" : "error";
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
    <div className="max-w-lg space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ScanLine size={22} />
          Scan Attendance
        </h1>
        <p className="text-slate-500 text-sm">Tap an event, then scan the attendee's QR code</p>
      </div>

      {/* Event cards */}
      {events.length === 0 ? (
        <div className="text-center py-8 text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl text-sm">
          No events today
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e) => {
            const isActive = selectedEventId === e.id;
            const isNow = new Date(e.startTime) <= now && new Date(e.endTime) >= now;
            return (
              <button
                key={e.id}
                onClick={() => setSelectedEventId(e.id)}
                className={cn(
                  "w-full text-left rounded-xl border-2 px-4 py-3 transition-all",
                  isActive
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={cn("font-semibold text-sm truncate", isActive ? "text-blue-900" : "text-slate-800")}>
                    {e.title.split(" - ")[0]}
                  </span>
                  {isNow && (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Now
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatToronto(new Date(e.startTime), "HH:mm")}–{formatToronto(new Date(e.endTime), "HH:mm")}
                  </span>
                  {e.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={11} />
                      {e.location}
                    </span>
                  )}
                  <EventBadge type={e.type} />
                </div>
              </button>
            );
          })}
        </div>
      )}

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

      {/* Scanner */}
      {selectedEventId ? (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <Tabs defaultValue="camera">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="camera" className="flex-1 gap-1.5">
                <Camera size={14} /> Camera
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1 gap-1.5">
                <Keyboard size={14} /> Manual
              </TabsTrigger>
            </TabsList>
            <TabsContent value="camera">
              <QRScanner onScan={handleScan} active={!scanning && !!selectedEventId} />
            </TabsContent>
            <TabsContent value="manual">
              <ManualCodeInput onScan={handleScan} disabled={scanning} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl text-sm">
          Select an event above to start scanning
        </div>
      )}

      {/* Payment stub modals */}
      <PaymentModal
        open={showPayment}
        onClose={() => {
          setShowPayment(false);
          setTimeout(() => setShowAutoPay(true), 300);
        }}
        userName={lastSuccess?.userName}
        eventTitle={lastSuccess?.eventTitle}
      />
      <AutoPayModal
        open={showAutoPay}
        onClose={() => setShowAutoPay(false)}
      />
    </div>
  );
}
