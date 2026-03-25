import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { verifyHostToken } from "@/lib/host-auth";

export default async function RootPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/profile");
  }

  const cookieStore = await cookies();
  const hostToken = cookieStore.get("host-token")?.value;
  if (hostToken) {
    const hostSession = await verifyHostToken(hostToken);
    if (hostSession) redirect("/host/scan");
  }

  redirect("/login");
}
