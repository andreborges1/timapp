import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getHostSession } from "@/lib/host-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userSession = await auth();
  const hostSession = await getHostSession(request);

  const { id } = await params;

  // Users can only see themselves; hosts can see anyone
  if (!hostSession && userSession?.user?.id !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, image: true, qrCode: true },
  });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json(user);
}
