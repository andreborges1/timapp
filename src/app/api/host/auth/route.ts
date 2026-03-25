import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signHostToken, clearHostCookieHeader, createHostCookieHeader } from "@/lib/host-auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const host = await prisma.host.findUnique({ where: { email } });
    if (!host) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, host.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await signHostToken({ hostId: host.id, email: host.email, name: host.name });
    const cookieHeader = createHostCookieHeader(token);

    const response = NextResponse.json({
      success: true,
      host: { id: host.id, name: host.name, email: host.email },
    });
    response.headers.set("Set-Cookie", cookieHeader);
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", clearHostCookieHeader());
  return response;
}
