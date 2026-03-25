import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getHostSession } from "@/lib/host-auth";
import { TORONTO_TZ } from "@/lib/utils";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export async function GET(request: NextRequest) {
  // Accept both user and host sessions
  const userSession = await auth();
  const hostSession = await getHostSession(request);
  if (!userSession && !hostSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYY-MM-DD Toronto local
  const week = searchParams.get("week"); // YYYY-MM-DD Monday Toronto local
  const type = searchParams.get("type");

  let startUTC: Date;
  let endUTC: Date;

  if (date) {
    // Single day
    const [y, m, d] = date.split("-").map(Number);
    startUTC = fromZonedTime(new Date(y, m - 1, d, 0, 0, 0), TORONTO_TZ);
    endUTC = fromZonedTime(new Date(y, m - 1, d, 23, 59, 59), TORONTO_TZ);
  } else if (week) {
    // Full week starting from Monday
    const [y, m, d] = week.split("-").map(Number);
    startUTC = fromZonedTime(new Date(y, m - 1, d, 0, 0, 0), TORONTO_TZ);
    const endDate = new Date(y, m - 1, d + 6, 23, 59, 59);
    endUTC = fromZonedTime(endDate, TORONTO_TZ);
  } else {
    // Default: today in Toronto
    const nowToronto = toZonedTime(new Date(), TORONTO_TZ);
    startUTC = fromZonedTime(
      new Date(nowToronto.getFullYear(), nowToronto.getMonth(), nowToronto.getDate(), 0, 0, 0),
      TORONTO_TZ
    );
    endUTC = fromZonedTime(
      new Date(nowToronto.getFullYear(), nowToronto.getMonth(), nowToronto.getDate(), 23, 59, 59),
      TORONTO_TZ
    );
  }

  const where: any = {
    startTime: { gte: startUTC, lte: endUTC },
  };
  if (type && type !== "ALL") where.type = type;

  const events = await prisma.event.findMany({
    where,
    include: {
      _count: { select: { attendances: true } },
      host: { select: { id: true, name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const hostSession = await getHostSession(request);
  if (!hostSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, type, description, startTime, endTime, location } = await request.json();

    if (!title || !type || !startTime || !endTime) {
      return NextResponse.json({ error: "title, type, startTime, endTime are required." }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        type,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        hostId: hostSession.hostId,
      },
      include: { _count: { select: { attendances: true } } },
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
