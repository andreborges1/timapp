import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: "blue" | "green" | "purple" | "orange";
  className?: string;
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  green: "bg-green-50 text-green-600 border-green-100",
  purple: "bg-purple-50 text-purple-600 border-purple-100",
  orange: "bg-orange-50 text-orange-600 border-orange-100",
};

const iconColorMap = {
  blue: "text-blue-500",
  green: "text-green-500",
  purple: "text-purple-500",
  orange: "text-orange-500",
};

export function StatCard({ label, value, icon: Icon, color = "blue", className }: StatCardProps) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4", className)}>
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border", colorMap[color])}>
        <Icon size={20} className={iconColorMap[color]} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
