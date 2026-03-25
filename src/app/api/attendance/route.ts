import { NextRequest, NextResponse } from "next/server";
import { getHostSession } from "@/lib/host-auth";
import { registerAttendance } from "@/lib/attendance";

export async function POST(request: NextRequest) {
  const hostSession = await getHostSession(request);
  if (!hostSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { qrCode, eventId } = await request.json();

    if (!qrCode || !eventId) {
      return NextResponse.json({ error: "qrCode and eventId are required." }, { status: 400 });
    }

    const result = await registerAttendance(qrCode, eventId, hostSession.hostId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: result.code === "TOO_EARLY" || result.code === "OVERLAP_CONFLICT" ? 422 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      attendanceId: result.attendance.id,
      scannedAt: result.attendance.scannedAt.toISOString(),
      user: result.user,
      event: {
        title: result.event.title,
        startTime: result.event.startTime.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
