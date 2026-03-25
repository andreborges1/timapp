import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/layout/UserNav";
import { AttendancePoller } from "@/components/attendance/AttendancePoller";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pb-20 min-h-screen">{children}</main>
      <UserNav />
      <AttendancePoller userName={session.user.name ?? undefined} />
    </div>
  );
}
