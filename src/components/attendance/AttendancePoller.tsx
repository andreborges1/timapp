"use client";

import { useEffect, useRef, useState } from "react";
import { PaymentModal } from "./PaymentModal";
import { AutoPayModal } from "./AutoPayModal";

const POLL_INTERVAL = 5000; // 5 seconds

interface LatestAttendance {
  id: string;
  eventId: string;
  scannedAt: string;
  event: { id: string; title: string; startTime: string };
}

export function AttendancePoller({ userName }: { userName?: string }) {
  const [showPayment, setShowPayment] = useState(false);
  const [showAutoPay, setShowAutoPay] = useState(false);
  const [eventTitle, setEventTitle] = useState<string>();
  const lastSeenIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const res = await fetch("/api/attendance/latest");
        if (!res.ok) return;
        const data = await res.json();
        const attendance: LatestAttendance | null = data.attendance;

        // On first poll, just record the current latest — don't trigger modal
        if (!initializedRef.current) {
          lastSeenIdRef.current = attendance?.id ?? null;
          initializedRef.current = true;
          return;
        }

        if (!attendance) return;

        // New attendance detected
        if (attendance.id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = attendance.id;
          setEventTitle(attendance.event.title);
          setShowPayment(true);
        }
      } catch {
        // Silently ignore network errors during polling
      }
    }

    poll();
    timer = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <PaymentModal
        open={showPayment}
        onClose={() => {
          setShowPayment(false);
          setTimeout(() => setShowAutoPay(true), 300);
        }}
        userName={userName}
        eventTitle={eventTitle}
      />
      <AutoPayModal open={showAutoPay} onClose={() => setShowAutoPay(false)} />
    </>
  );
}
