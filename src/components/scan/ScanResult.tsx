"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatToronto } from "@/lib/utils";

interface ScanResultProps {
  type: "success" | "error" | "overlap" | "too-early";
  message: string;
  user?: { name: string; email: string; image?: string | null };
  event?: { title: string; startTime: string };
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function ScanResult({ type, message, user, event, onDismiss, autoDismissMs = 6000 }: ScanResultProps) {
  useEffect(() => {
    if (type === "success") {
      const t = setTimeout(onDismiss, autoDismissMs);
      return () => clearTimeout(t);
    }
  }, [type, onDismiss, autoDismissMs]);

  const colorMap = {
    success: "border-green-200 bg-green-50",
    error: "border-red-200 bg-red-50",
    overlap: "border-orange-200 bg-orange-50",
    "too-early": "border-amber-200 bg-amber-50",
  };

  const iconMap = {
    success: <CheckCircle size={24} className="text-green-500" />,
    error: <XCircle size={24} className="text-red-500" />,
    overlap: <AlertTriangle size={24} className="text-orange-500" />,
    "too-early": <Clock size={24} className="text-amber-500" />,
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[type]}`}>
      <div className="flex items-start gap-3">
        {iconMap[type]}
        <div className="flex-1 min-w-0">
          {type === "success" && user && (
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-green-900">{user.name}</p>
                <p className="text-xs text-green-700">{user.email}</p>
              </div>
            </div>
          )}
          {type === "success" && event && (
            <p className="text-xs text-green-700 mb-1">
              Registered for: <strong>{event.title}</strong> at {formatToronto(new Date(event.startTime), "HH:mm")}
            </p>
          )}
          <p className={`text-sm font-medium ${
            type === "success" ? "text-green-900" :
            type === "overlap" ? "text-orange-900" :
            type === "too-early" ? "text-amber-900" :
            "text-red-900"
          }`}>
            {message}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDismiss} className="text-slate-500 h-auto p-1">
          ×
        </Button>
      </div>
    </div>
  );
}
