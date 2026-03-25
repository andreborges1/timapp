import { cn, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, EventType } from "@/lib/utils";

interface EventBadgeProps {
  type: string;
  className?: string;
}

export function EventBadge({ type, className }: EventBadgeProps) {
  const label = EVENT_TYPE_LABELS[type as EventType] ?? type;
  const colors = EVENT_TYPE_COLORS[type as EventType] ?? "bg-gray-100 text-gray-800 border-gray-200";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        colors,
        className
      )}
    >
      {label}
    </span>
  );
}
