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

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let startUTC: Date;
  let endUTC: Date;

  if (from && to) {
    const [fy, fm, fd] = from.split("-").map(Number);
    const [ty, tm, td] = to.split("-").map(Number);
    startUTC = fromZonedTime(new Date(fy, fm - 1, fd, 0, 0, 0), TORONTO_TZ);
    endUTC = fromZonedTime(new Date(ty, tm - 1, td, 23, 59, 59), TORONTO_TZ);
  } else {
    // Default: current week Mon–Sun in Toronto time
    const nowToronto = toZonedTime(new Date(), TORONTO_TZ);
    const day = nowToronto.getDay();
    const monday = new Date(nowToronto);
    monday.setDate(nowToronto.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    startUTC = fromZonedTime(monday, TORONTO_TZ);
    endUTC = fromZonedTime(sunday, TORONTO_TZ);
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: session.user.id,
      scannedAt: { gte: startUTC, lte: endUTC },
    },
    include: { event: true },
    orderBy: { scannedAt: "asc" },
  });

  return NextResponse.json(attendances);
}
