import { prisma } from "@/lib/prisma";
import { toZonedTime } from "date-fns-tz";
import { TORONTO_TZ } from "@/lib/utils";

export type AttendanceErrorCode =
  | "USER_NOT_FOUND"
  | "EVENT_NOT_FOUND"
  | "ALREADY_REGISTERED"
  | "TOO_EARLY"
  | "OVERLAP_CONFLICT";

export type AttendanceResult =
  | {
      success: true;
      attendance: { id: string; scannedAt: Date };
      user: { name: string; email: string };
      event: { title: string; startTime: Date };
    }
  | {
      success: false;
      code: AttendanceErrorCode;
      message: string;
    };

export async function registerAttendance(
  qrCode: string,
  eventId: string,
  scannedBy: string
): Promise<AttendanceResult> {
  // 1. Resolve user
  const user = await prisma.user.findUnique({ where: { qrCode } });
  if (!user) {
    return { success: false, code: "USER_NOT_FOUND", message: "QR code not recognized. User not found." };
  }

  // 2. Resolve event
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return { success: false, code: "EVENT_NOT_FOUND", message: "Event not found." };
  }

  // 3. Duplicate check
  const existing = await prisma.attendance.findUnique({
    where: { userId_eventId: { userId: user.id, eventId } },
  });
  if (existing) {
    return {
      success: false,
      code: "ALREADY_REGISTERED",
      message: `${user.name} is already registered for this event.`,
    };
  }

  // 4. 2-hour window check (in Toronto time)
  const nowUTC = new Date();
  const twoHoursBefore = new Date(event.startTime.getTime() - 2 * 60 * 60 * 1000);
  if (nowUTC < twoHoursBefore) {
    const opensAt = toZonedTime(twoHoursBefore, TORONTO_TZ);
    const hours = opensAt.getHours().toString().padStart(2, "0");
    const minutes = opensAt.getMinutes().toString().padStart(2, "0");
    return {
      success: false,
      code: "TOO_EARLY",
      message: `Registration opens at ${hours}:${minutes} Toronto time (2 hours before the event).`,
    };
  }

  // 5. Overlap check
  const overlapping = await prisma.attendance.findFirst({
    where: {
      userId: user.id,
      event: {
        AND: [
          { startTime: { lt: event.endTime } },
          { endTime: { gt: event.startTime } },
          { id: { not: eventId } },
        ],
      },
    },
    include: { event: true },
  });
  if (overlapping) {
    return {
      success: false,
      code: "OVERLAP_CONFLICT",
      message: `Cannot register: ${user.name} is already registered for "${overlapping.event.title}" which runs at the same time.`,
    };
  }

  // 6. Create attendance (P2002 guard for race conditions)
  try {
    const attendance = await prisma.attendance.create({
      data: { userId: user.id, eventId, scannedBy },
    });
    return {
      success: true,
      attendance: { id: attendance.id, scannedAt: attendance.scannedAt },
      user: { name: user.name, email: user.email },
      event: { title: event.title, startTime: event.startTime },
    };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return {
        success: false,
        code: "ALREADY_REGISTERED",
        message: `${user.name} is already registered for this event.`,
      };
    }
    throw err;
  }
}
