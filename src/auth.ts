import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const limited = rateLimit(`login:${email.toLowerCase()}`, 10, 5 * 60 * 1000);
        if (!limited.allowed) return null;

        const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          await db.securityLog.create({
            data: { userId: user.id, type: "login_failed" },
          });
          return null;
        }

        await db.securityLog.create({ data: { userId: user.id, type: "login" } });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl ?? undefined,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 0;
      }

      // Revalida periodicamente se a sessão ainda é válida (logout remoto / "sair de todos os dispositivos")
      if (trigger === "update" || !user) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { sessionVersion: true },
        });
        if (!dbUser || dbUser.sessionVersion !== token.sessionVersion) {
          return {} as typeof token;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.id) {
        // token invalidado (logout remoto)
        return { ...session, user: undefined } as unknown as typeof session;
      }
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
