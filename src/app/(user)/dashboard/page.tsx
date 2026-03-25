import { auth } from "@/lib/auth";
import { TorontoClock } from "@/components/dashboard/TorontoClock";
import { StatCard } from "@/components/dashboard/StatCard";
import { EventCard } from "@/components/events/EventCard";
import { CalendarCheck, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { TORONTO_TZ } from "@/lib/utils";

async function getDashboardData(userId: string) {
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

  const twoHoursLater = new Date(nowUTC.getTime() + 2 * 60 * 60 * 1000);

  const day = nowToronto.getDay();
  const monday = new Date(nowToronto);
  monday.setDate(nowToronto.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const weekStart = fromZonedTime(monday, TORONTO_TZ);
  const weekEnd = fromZonedTime(
    new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59),
    TORONTO_TZ
  );

  const [allToday, myTodayAttendances, weekAttendanceCount] = await Promise.all([
    prisma.event.findMany({
      where: { startTime: { gte: todayStart, lte: todayEnd } },
      include: { _count: { select: { attendances: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.attendance.findMany({
      where: { userId, scannedAt: { gte: todayStart, lte: todayEnd } },
      select: { eventId: true },
    }),
    prisma.attendance.count({
      where: { userId, scannedAt: { gte: weekStart, lte: weekEnd } },
    }),
  ]);

  const myEventIds = myTodayAttendances.map((a) => a.eventId);
  const happeningNow = allToday.filter((e) => e.startTime <= nowUTC && e.endTime >= nowUTC);
  const startingSoon = allToday.filter((e) => e.startTime > nowUTC && e.startTime <= twoHoursLater);

  return { allToday, happeningNow, startingSoon, myEventIds, weekAttendanceCount };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const { allToday, happeningNow, startingSoon, myEventIds, weekAttendanceCount } =
    await getDashboardData(userId);

  const name = session!.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hi, {name} 👋</h1>
          <p className="text-slate-500 text-sm">Here's what's happening today</p>
        </div>
        <TorontoClock />
      </div>

      {/* Stats */}
      <StatCard
        label="Attendances this week"
        value={weekAttendanceCount}
        icon={CalendarCheck}
        color="blue"
      />

      {/* Happening Now */}
      {happeningNow.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Happening Now ({happeningNow.length})
          </h2>
          <div className="space-y-2">
            {happeningNow.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                isHappeningNow
                isRegistered={myEventIds.includes(e.id)}
                showAttendanceCount={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Starting Soon */}
      {startingSoon.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-2">
            <TrendingUp size={14} />
            Starting Soon — Register Now ({startingSoon.length})
          </h2>
          <div className="space-y-2">
            {startingSoon.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                isRegistered={myEventIds.includes(e.id)}
                showAttendanceCount={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Today */}
      <section>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
          All Today ({allToday.length})
        </h2>
        {allToday.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No events scheduled for today.</div>
        ) : (
          <div className="space-y-2">
            {allToday.map((e) => {
              const isPast = new Date(e.endTime) < new Date();
              return (
                <div key={e.id} className={isPast ? "opacity-40" : ""}>
                  <EventCard
                    event={e}
                    isRegistered={myEventIds.includes(e.id)}
                    showAttendanceCount={false}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
