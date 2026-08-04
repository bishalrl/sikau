import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

/** Runtime lookup — avoids Next inlining empty GOOGLE_* at compile time. */
function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

const googleClientId = env("AUTH_GOOGLE_ID") || env("GOOGLE_CLIENT_ID");
const googleClientSecret = env("AUTH_GOOGLE_SECRET") || env("GOOGLE_CLIENT_SECRET");

export const authOptions: NextAuthOptions = {
  secret: env("NEXTAUTH_SECRET") || undefined,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        if (!user.emailVerifiedAt) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email.split("@")[0],
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email?.toLowerCase();
      if (!email) {
        return false;
      }

      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: user.name ?? existing.name,
            emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
            // Keep email accounts as email if they already have a password; otherwise mark Google.
            authProvider: existing.passwordHash ? existing.authProvider || "email" : "google",
          },
        });
      } else {
        await prisma.user.create({
          data: {
            email,
            name: user.name ?? email.split("@")[0],
            passwordHash: null,
            emailVerifiedAt: new Date(),
            authProvider: "google",
            role: "LEARNER",
          },
        });
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
        return token;
      }

      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "ADMIN" | "INSTRUCTOR" | "LEARNER") ?? "LEARNER";
      }
      return session;
    },
  },
};
