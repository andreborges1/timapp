import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { TORONTO_TZ } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // 2-hour window for "starting soon"
  const twoHoursLater = new Date(nowUTC.getTime() + 2 * 60 * 60 * 1000);

  // Current week for stats
  const day = nowToronto.getDay();
  const monday = new Date(nowToronto);
  monday.setDate(nowToronto.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const weekStart = fromZonedTime(monday, TORONTO_TZ);
  const weekEnd = fromZonedTime(
    new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59),
    TORONTO_TZ
  );

  const [allToday, myAttendancesToday, weekAttendanceCount] = await Promise.all([
    prisma.event.findMany({
      where: { startTime: { gte: todayStart, lte: todayEnd } },
      include: { _count: { select: { attendances: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.attendance.findMany({
      where: { userId: session.user.id, scannedAt: { gte: todayStart, lte: todayEnd } },
      select: { eventId: true },
    }),
    prisma.attendance.count({
      where: { userId: session.user.id, scannedAt: { gte: weekStart, lte: weekEnd } },
    }),
  ]);

  const myAttendanceEventIds = myAttendancesToday.map((a) => a.eventId);

  // Categorize events
  const happeningNow = allToday.filter(
    (e) => e.startTime <= nowUTC && e.endTime >= nowUTC
  );
  const startingSoon = allToday.filter(
    (e) => e.startTime > nowUTC && e.startTime <= twoHoursLater
  );

  return NextResponse.json({
    happeningNow,
    startingSoon,
    allToday,
    myAttendanceEventIds,
    weekAttendanceCount,
  });
}
