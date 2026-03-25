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
import { ScanLine, Keyboard, Camera } from "lucide-react";

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
      .then(setEvents);
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
          setTimeout(() => {
            setShowPayment(true);
          }, 2000);
        } else {
          const type =
            data.code === "OVERLAP_CONFLICT" ? "overlap" :
            data.code === "TOO_EARLY" ? "too-early" :
            "error";
          setResult({ type, message: data.error ?? "Registration failed." });
        }
      } finally {
        setScanning(false);
      }
    },
    [selectedEventId]
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="max-w-lg space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ScanLine size={22} />
          Scan Attendance
        </h1>
        <p className="text-slate-500 text-sm">Select an event, then scan or enter the attendee's code</p>
      </div>

      {/* Event selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Select Event *</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-slate-700"
          >
            <option value="">Choose an event to scan for...</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title.split(" - ")[0]} — {formatToronto(new Date(e.startTime), "HH:mm")}–{formatToronto(new Date(e.endTime), "HH:mm")}
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <EventBadge type={selectedEvent.type} />
            <span className="text-xs text-slate-500">
              {formatToronto(new Date(selectedEvent.startTime), "HH:mm")} –{" "}
              {formatToronto(new Date(selectedEvent.endTime), "HH:mm")}
              {selectedEvent.location ? ` · ${selectedEvent.location}` : ""}
            </span>
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

      {/* Scanner — only show when event selected */}
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
        <div className="text-center py-12 text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl text-sm">
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
