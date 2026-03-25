import { NextRequest, NextResponse } from "next/server";
import { getHostSession } from "@/lib/host-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const hostSession = await getHostSession(request);
  if (!hostSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined,
    select: { id: true, name: true, email: true, image: true, qrCode: true, createdAt: true },
    orderBy: { name: "asc" },
    take: 50,
  });

  return NextResponse.json(users);
}
