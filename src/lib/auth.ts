import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.EMAIL_FROM ?? "noreply@example.com",
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { qrCode: true, name: true },
        });
        if (dbUser) {
          (session.user as any).qrCode = dbUser.qrCode;
          if (!session.user.name && dbUser.name) {
            session.user.name = dbUser.name;
          }
        }
      }
      return session;
    },
    async signIn({ user }) {
      // Ensure the user has a name set from their email if no name provided
      if (!user.name && user.email) {
        user.name = user.email.split("@")[0];
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  session: { strategy: "database" },
});
