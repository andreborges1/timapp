import { NextRequest, NextResponse } from "next/server";
import { getHostSession } from "@/lib/host-auth";
import { prisma } from "@/lib/prisma";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { TORONTO_TZ } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const hostSession = await getHostSession(request);
  if (!hostSession) {
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

  const [totalEvents, totalAttendances, todayEvents, todayAttendances, topEventsRaw, recentAttendances] =
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
        take: 20,
      }),
    ]);

  const topEvents = topEventsRaw.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    count: e._count.attendances,
  }));

  return NextResponse.json({
    totalEvents,
    totalAttendances,
    todayEvents,
    todayAttendances,
    topEvents,
    recentAttendances,
  });
}
