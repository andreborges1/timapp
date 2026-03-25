import { UserLoginForm } from "@/components/auth/UserLoginForm";
import { ScanLine } from "lucide-react";

interface Props {
  searchParams: Promise<{ verify?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { verify } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ScanLine size={28} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-white">TimApp</h1>
          <p className="text-slate-400 text-sm mt-1">Corporate Attendance Tracker</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-6">
            Use your work account to access TimApp.
          </p>
          <UserLoginForm verifyMode={verify === "1"} />
        </div>

        {/* Host link */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Are you a host?{" "}
          <a href="/host/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Host sign in →
          </a>
        </p>
      </div>
    </div>
  );
}
