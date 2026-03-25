import { ScanLine } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signHostToken } from "@/lib/host-auth";

async function loginAction(formData: FormData) {
  "use server";
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) {
    redirect("/host/login?error=missing");
  }

  const host = await prisma.host.findUnique({ where: { email } });
  if (!host) {
    redirect("/host/login?error=invalid");
  }

  const valid = await bcrypt.compare(password, host.passwordHash);
  if (!valid) {
    redirect("/host/login?error=invalid");
  }

  const token = await signHostToken({ hostId: host.id, email: host.email, name: host.name });
  const cookieStore = await cookies();
  cookieStore.set("host-token", token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  redirect("/host/scan");
}

export default function HostLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const errorMessages: Record<string, string> = {
    missing: "Please enter your email and password.",
    invalid: "Invalid email or password.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ScanLine size={28} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-white">TimApp</h1>
          <p className="text-slate-400 text-sm mt-1">Host Portal</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Host Sign In</h2>
          <p className="text-slate-500 text-sm mb-6">
            Sign in with your host credentials to manage events and scan attendees.
          </p>

          <form action={loginAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <ErrorMessage searchParams={searchParams} errorMessages={errorMessages} />
            <button
              type="submit"
              className="w-full h-11 rounded-lg bg-slate-900 text-white text-sm font-medium"
            >
              Sign In as Host
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Are you an attendee?{" "}
          <a href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            User sign in →
          </a>
        </p>
      </div>
    </div>
  );
}

async function ErrorMessage({
  searchParams,
  errorMessages,
}: {
  searchParams: Promise<{ error?: string }>;
  errorMessages: Record<string, string>;
}) {
  const { error } = await searchParams;
  if (!error || !errorMessages[error]) return null;
  return (
    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMessages[error]}</p>
  );
}
