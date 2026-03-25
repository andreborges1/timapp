import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latest = await prisma.attendance.findFirst({
    where: { userId: session.user.id },
    include: { event: { select: { id: true, title: true, startTime: true } } },
    orderBy: { scannedAt: "desc" },
  });

  if (!latest) {
    return NextResponse.json({ attendance: null });
  }

  return NextResponse.json({
    attendance: {
      id: latest.id,
      eventId: latest.eventId,
      scannedAt: latest.scannedAt.toISOString(),
      event: {
        id: latest.event.id,
        title: latest.event.title,
        startTime: latest.event.startTime.toISOString(),
      },
    },
  });
}
