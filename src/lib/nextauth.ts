// src/lib/nextauth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

/**
 * Module augmentation to add `id` to session.user
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

function ensureEnv(name: string) {
  if (!process.env[name]) {
    throw new Error(`Missing required env var ${name}`);
  }
  return process.env[name]!;
}

const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "";

// NOTE: We do NOT hard-code preview domains here. NextAuth will build the correct callback
// using NEXTAUTH_URL; ensure that NEXTAUTH_URL is your stable production URL.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: ensureEnv("GOOGLE_CLIENT_ID"),
      clientSecret: ensureEnv("GOOGLE_CLIENT_SECRET"),
      // DO NOT hardcode preview URLs here. NextAuth will compute callback using NEXTAUTH_URL.
      // The provider will accept the callback derived from NEXTAUTH_URL.
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Only allow same-origin redirects
      try {
        const to = new URL(url, baseUrl).toString();
        if (to.startsWith(baseUrl)) return to;
      } catch {
        if (url.startsWith("/")) return `${baseUrl}${url}`;
      }
      return baseUrl;
    },
  },
  secret: ensureEnv("NEXTAUTH_SECRET"),
};

export const getAuthSession = () => {
  return getServerSession(authOptions);
};
