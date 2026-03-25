import { NextRequest, NextResponse } from "next/server";
import { getHostSession } from "@/lib/host-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const hostSession = await getHostSession(request);
  if (!hostSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { qrCode } = await request.json();
    if (!qrCode) {
      return NextResponse.json({ error: "qrCode is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { qrCode },
      select: { id: true, name: true, email: true, image: true, qrCode: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found for this QR code." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
