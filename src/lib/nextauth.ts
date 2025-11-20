import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

/**
 * Extend Session to include user.id
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,

      /** ⭐ FIXED ⭐  
       * This forces NextAuth to ALWAYS use your production redirect URL.
       * Google will reject incorrect preview URLs.
       */
      authorization: {
        params: {
          redirect_uri:
            process.env.NEXTAUTH_URL +
            "/api/auth/callback/google",
        },
      },
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
      // Only allow redirects inside your domain
      try {
        const to = new URL(url, baseUrl).toString();
        if (to.startsWith(baseUrl)) return to;
      } catch (e) {
        if (url.startsWith("/")) return `${baseUrl}${url}`;
      }
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export const getAuthSession = () => getServerSession(authOptions);
