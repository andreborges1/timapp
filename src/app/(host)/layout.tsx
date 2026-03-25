import { cookies } from "next/headers";
import { verifyHostToken } from "@/lib/host-auth";
import { redirect } from "next/navigation";
import { HostSidebar } from "@/components/layout/HostSidebar";

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("host-token")?.value;

  if (!token) redirect("/host/login");

  const host = await verifyHostToken(token);
  if (!host) redirect("/host/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <HostSidebar hostName={host.name} hostEmail={host.email} />
      <main className="md:ml-64 min-h-screen pt-14 md:pt-0 pb-16 md:pb-0 p-4 md:p-6">{children}</main>
    </div>
  );
}
