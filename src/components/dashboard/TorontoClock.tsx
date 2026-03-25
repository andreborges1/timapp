"use client";

import { useEffect, useState } from "react";
import { formatToronto, TORONTO_TZ } from "@/lib/utils";
import { toZonedTime } from "date-fns-tz";
import { Clock } from "lucide-react";

export function TorontoClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const toronto = toZonedTime(now, TORONTO_TZ);
  const time = formatToronto(toronto, "HH:mm:ss");
  const date = formatToronto(toronto, "EEEE, MMM d");

  return (
    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl">
      <Clock size={16} className="text-blue-400" />
      <div>
        <p className="text-xl font-bold tabular-nums leading-none">{time}</p>
        <p className="text-slate-400 text-xs mt-0.5">{date} — Toronto</p>
      </div>
    </div>
  );
}
