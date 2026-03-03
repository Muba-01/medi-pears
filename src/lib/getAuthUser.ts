import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { verifyJWT } from "@/lib/jwt";
import { getUserByWallet, getUserById } from "@/services/userService";
import type { IUser } from "@/models/User";

/**
 * Resolves the authenticated user from either:
 * 1. Wallet JWT cookie (mp_token)
 * 2. NextAuth session (Google OAuth)
 *
 * Returns null if unauthenticated.
 */
export async function getAuthUser(req: NextRequest): Promise<IUser | null> {
  // 1. Check wallet JWT cookie
  const token = req.cookies.get("mp_token")?.value;
  if (token) {
    const payload = await verifyJWT(token);
    if (payload?.walletAddress) {
      const user = await getUserByWallet(payload.walletAddress);
      if (user) return user;
    }
  }

  // 2. Check NextAuth session (Google)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return getUserById(session.user.id);
  }

  return null;
}
