import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { EventBadge } from "@/components/events/EventBadge";
import { TorontoClock } from "@/components/dashboard/TorontoClock";
import { formatToronto, TORONTO_TZ } from "@/lib/utils";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { CalendarDays, Users, CheckSquare, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

async function getStats() {
  const nowUTC = new Date();
  const nowToronto = toZonedTime(nowUTC, TORONTO_TZ);
  const todayStart = fromZonedTime(
    new Date(nowToronto.getFullYear(), nowToronto.getMonth(), nowToronto.getDate(), 0, 0, 0),
    TORONTO_TZ
  );
  const todayEnd = fromZonedTime(
    new Date(nowToronto.getFullYear(), nowToronto.getMonth(), nowToronto.getDate(), 23, 59, 59),
    TORONTO_TZ
  );

  const [totalEvents, totalAttendances, todayEvents, todayAttendances, topEvents, recentAttendances] =
    await Promise.all([
      prisma.event.count(),
      prisma.attendance.count(),
      prisma.event.count({ where: { startTime: { gte: todayStart, lte: todayEnd } } }),
      prisma.attendance.count({ where: { scannedAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.event.findMany({
        include: { _count: { select: { attendances: true } } },
        orderBy: { attendances: { _count: "desc" } },
        take: 5,
      }),
      prisma.attendance.findMany({
        include: {
          event: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { scannedAt: "desc" },
        take: 10,
      }),
    ]);

  return { totalEvents, totalAttendances, todayEvents, todayAttendances, topEvents, recentAttendances };
}

export default async function HostDashboardPage() {
  const { totalEvents, totalAttendances, todayEvents, todayAttendances, topEvents, recentAttendances } =
    await getStats();

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Overview of all events and attendances</p>
        </div>
        <TorontoClock />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Events" value={totalEvents} icon={CalendarDays} color="blue" />
        <StatCard label="Total Attendances" value={totalAttendances} icon={CheckSquare} color="green" />
        <StatCard label="Events Today" value={todayEvents} icon={TrendingUp} color="purple" />
        <StatCard label="Attendances Today" value={todayAttendances} icon={Users} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Events */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Top Events by Attendance</h2>
          <div className="space-y-3">
            {topEvents.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{e.title.split(" - ")[0]}</p>
                  <EventBadge type={e.type} />
                </div>
                <span className="text-sm font-bold text-slate-700">{e._count.attendances}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendances */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Registrations</h2>
          <div className="space-y-3">
            {recentAttendances.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={a.user.image ?? undefined} />
                  <AvatarFallback className="text-xs">{a.user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{a.user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{a.event.title.split(" - ")[0]}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {formatToronto(a.scannedAt, "HH:mm")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
