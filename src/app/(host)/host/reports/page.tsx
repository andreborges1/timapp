"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TORONTO_TZ } from "@/lib/utils";
import { toZonedTime } from "date-fns-tz";
import { format, subDays } from "date-fns";

function todayStr() {
  return format(toZonedTime(new Date(), TORONTO_TZ), "yyyy-MM-dd");
}
function thirtyDaysAgoStr() {
  return format(subDays(toZonedTime(new Date(), TORONTO_TZ), 30), "yyyy-MM-dd");
}

export default function ReportsPage() {
  const [from, setFrom] = useState(thirtyDaysAgoStr());
  const [to, setTo] = useState(todayStr());
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?from=${from}&to=${to}`);
      if (!res.ok) {
        toast.error("Failed to generate report.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const filename = `timapp-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully.");
    } finally {
      setLoading(false);
    }
  }

  const sheets = [
    { name: "All Events", description: "All events in the date range with title, type, date, time, location, and total attendance count." },
    { name: "By Event Type", description: "Total attendances and unique users per event type (Meeting, Interview, Workshop, etc.)." },
    { name: "By Day of Week", description: "Attendance distribution across Monday–Saturday." },
    { name: "By Hour of Day", description: "Hourly attendance distribution (8am–9pm) to identify peak times." },
    { name: "Top 10 Events", description: "The 10 most attended events in the period, sorted by attendance count." },
    { name: "Daily Trend", description: "Total attendances per calendar day — useful for spotting trends and anomalies." },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 size={22} />
          Reports
        </h1>
        <p className="text-slate-500 text-sm">Export attendance data as an Excel workbook</p>
      </div>

      {/* Export form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <h2 className="font-semibold text-slate-900">Date Range</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <Button onClick={handleExport} disabled={loading || !from || !to} className="gap-2 w-full">
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Download size={15} />
          )}
          {loading ? "Generating report..." : "Export Excel Report"}
        </Button>
      </div>

      {/* Sheets preview */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Report Contents</h2>
        <p className="text-sm text-slate-500 mb-4">
          The exported Excel file contains {sheets.length} sheets:
        </p>
        <div className="space-y-3">
          {sheets.map((sheet, i) => (
            <div key={sheet.name} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">{sheet.name}</p>
                <p className="text-xs text-slate-500">{sheet.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
