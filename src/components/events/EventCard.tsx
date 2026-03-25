import { formatToronto } from "@/lib/utils";
import { EventBadge } from "./EventBadge";
import { MapPin, Clock, Users, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  type: string;
  startTime: string | Date;
  endTime: string | Date;
  location?: string | null;
  _count?: { attendances: number };
}

interface EventCardProps {
  event: Event;
  isRegistered?: boolean;
  isHappeningNow?: boolean;
  showAttendanceCount?: boolean;
  onClick?: () => void;
  className?: string;
}

export function EventCard({
  event,
  isRegistered,
  isHappeningNow,
  showAttendanceCount,
  onClick,
  className,
}: EventCardProps) {
  const start = formatToronto(new Date(event.startTime), "HH:mm");
  const end = formatToronto(new Date(event.endTime), "HH:mm");

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex gap-3 p-3 rounded-xl border bg-white transition-all",
        isHappeningNow && "ring-2 ring-green-400 border-green-200",
        isRegistered && !isHappeningNow && "border-blue-200 bg-blue-50",
        !isHappeningNow && !isRegistered && "border-slate-200 hover:border-slate-300 hover:shadow-sm",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Time column */}
      <div className="flex-shrink-0 text-right w-14">
        <p className="text-sm font-semibold text-slate-800">{start}</p>
        <p className="text-xs text-slate-400">{end}</p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-900 leading-tight truncate">{event.title}</p>
          {isRegistered && (
            <CheckCircle size={16} className="flex-shrink-0 text-blue-500 mt-0.5" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <EventBadge type={event.type} />
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={11} />
              {event.location}
            </span>
          )}
          {showAttendanceCount && event._count !== undefined && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Users size={11} />
              {event._count.attendances}
            </span>
          )}
        </div>
        {isHappeningNow && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            In progress
          </span>
        )}
      </div>
    </div>
  );
}
