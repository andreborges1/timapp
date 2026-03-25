import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateShortCode(): string {
  return Array.from({ length: 7 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
}

const adapter = PrismaAdapter(prisma) as any;
const originalCreateUser = adapter.createUser.bind(adapter);
adapter.createUser = async (data: any) => {
  let qrCode = generateShortCode();
  // Ensure uniqueness
  while (await prisma.user.findUnique({ where: { qrCode } })) {
    qrCode = generateShortCode();
  }
  return originalCreateUser({ ...data, qrCode });
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
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
      if (!user.name && user.email) {
        user.name = user.email.split("@")[0];
      }
      return true;
    },
  },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  session: { strategy: "database" },
});
