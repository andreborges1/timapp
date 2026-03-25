import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "host-token";
const EXPIRY = "8h";

export interface HostSession {
  hostId: string;
  email: string;
  name: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.HOST_JWT_SECRET;
  if (!secret) throw new Error("HOST_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signHostToken(payload: HostSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifyHostToken(token: string): Promise<HostSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      hostId: payload.hostId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function getHostSession(request?: NextRequest): Promise<HostSession | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(COOKIE_NAME)?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  }

  if (!token) return null;
  return verifyHostToken(token);
}

export function createHostCookieHeader(token: string): string {
  const maxAge = 8 * 60 * 60; // 8 hours in seconds
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

export function clearHostCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}
