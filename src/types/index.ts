import type { User, Host, Event, Attendance } from "@prisma/client";

export type EventWithCount = Event & {
  _count: { attendances: number };
  host?: Pick<Host, "id" | "name">;
};

export type EventWithAttendances = Event & {
  attendances: Array<Attendance & { user: Pick<User, "id" | "name" | "email" | "image"> }>;
  _count: { attendances: number };
};

export type AttendanceWithDetails = Attendance & {
  event: Event;
  user: Pick<User, "id" | "name" | "email" | "image">;
};

export type UserPublic = Pick<User, "id" | "name" | "email" | "image" | "qrCode">;

export type HostSession = {
  hostId: string;
  email: string;
  name: string;
};

export type ApiError = {
  error: string;
  code?: string;
};

export type ScanResponse = {
  user: UserPublic;
};

export type AttendanceRegisterResponse = {
  success: true;
  attendanceId: string;
  scannedAt: string;
  user: { name: string; email: string };
  event: { title: string; startTime: string };
};

export type HostDashboardStats = {
  totalEvents: number;
  totalAttendances: number;
  todayEvents: number;
  todayAttendances: number;
  topEvents: Array<{ id: string; title: string; type: string; count: number }>;
  recentAttendances: AttendanceWithDetails[];
};

export type UserDashboardData = {
  happeningNow: EventWithCount[];
  startingSoon: EventWithCount[];
  allToday: EventWithCount[];
  myAttendanceEventIds: string[];
  weekAttendanceCount: number;
};

// Extend NextAuth session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      qrCode?: string;
    };
  }
}
