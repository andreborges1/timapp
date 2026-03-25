import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getHostSession } from "@/lib/host-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userSession = await auth();
  const hostSession = await getHostSession(request);
  if (!userSession && !hostSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      _count: { select: { attendances: true } },
      host: { select: { id: true, name: true } },
      ...(hostSession
        ? {
            attendances: {
              include: { user: { select: { id: true, name: true, email: true, image: true } } },
              orderBy: { scannedAt: "asc" },
            },
          }
        : {}),
    },
  });

  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  return NextResponse.json(event);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const hostSession = await getHostSession(request);
  if (!hostSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (event.hostId !== hostSession.hostId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await request.json();
  const updated = await prisma.event.update({
    where: { id },
    data: {
      title: data.title,
      type: data.type,
      description: data.description,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      location: data.location,
    },
    include: { _count: { select: { attendances: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const hostSession = await getHostSession(request);
  if (!hostSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (event.hostId !== hostSession.hostId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
