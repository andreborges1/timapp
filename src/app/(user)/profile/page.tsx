import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QRCodeDisplay } from "@/components/profile/QRCodeDisplay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, User, LogOut } from "lucide-react";

async function logoutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, email: true, image: true, qrCode: true },
  });

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      {/* QR Code — first and prominent */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-3">
        <QRCodeDisplay value={user.qrCode} size={240} />
        <p className="text-xs text-slate-400 text-center">
          Show this to the host to register your attendance
        </p>
      </div>

      {/* User info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
        <Avatar className="w-12 h-12 shrink-0">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="bg-slate-100">
            {user.name?.charAt(0) ?? <User size={18} />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{user.name}</p>
          <p className="flex items-center gap-1 text-xs text-slate-500 truncate">
            <Mail size={11} />
            {user.email}
          </p>
        </div>
      </div>

      {/* Logout */}
      <form action={logoutAction}>
        <button type="submit" className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-red-200 text-red-600 text-sm font-medium bg-white">
          <LogOut size={16} />
          Sign Out
        </button>
      </form>
    </div>
  );
}
