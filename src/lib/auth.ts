import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findOrCreateUserByEmail } from "@/services/userService";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ account, user }) {
      // Always allow sign-in; DB upsert happens in the jwt callback
      if (account?.provider === "google" && !user.email) {
        return false; // block only if no email
      }
      return true;
    },

    async jwt({ token, account, user }) {
      // Only runs on first sign-in (account is populated)
      if (account?.provider === "google" && user?.email) {
        try {
          const dbUser = await findOrCreateUserByEmail(
            user.email,
            user.name ?? undefined,
            user.image ?? undefined
          );
          token.userId = dbUser._id.toString();
          token.username = dbUser.username;
          token.walletAddress = dbUser.walletAddress ?? null;
          token.provider = "google";
        } catch {
          // DB unavailable — store basic info from Google directly
          token.userId = token.sub ?? undefined;
          token.username = user.name ?? user.email ?? undefined;
          token.walletAddress = null;
          token.provider = "google";
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId;
        session.user.username = token.username ?? "";
        session.user.walletAddress = token.walletAddress ?? null;
        session.user.provider = token.provider ?? "google";
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
