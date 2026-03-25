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
    select: { id: true, name: true, email: true, image: true, qrCode: true, createdAt: true },
  });

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 text-sm">Your identity and QR code</p>
      </div>

      {/* User info card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="text-xl bg-slate-100">
            {user.name?.charAt(0) ?? <User size={24} />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900 truncate">{user.name}</p>
          <p className="flex items-center gap-1 text-sm text-slate-500 truncate">
            <Mail size={13} />
            {user.email}
          </p>
        </div>
      </div>

      {/* QR Code section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Your QR Code</h2>
        <p className="text-sm text-slate-500 mb-5">
          Show this QR code to the event host to register your attendance.
        </p>
        <QRCodeDisplay value={user.qrCode} size={220} />
      </div>

      {/* Hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> You can also find your unique code below the QR image.
          The host can type it manually if the camera isn't working.
        </p>
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
