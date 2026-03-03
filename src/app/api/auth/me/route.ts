import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserByWallet, getUserById } from "@/services/userService";

const COOKIE_NAME = "mp_token";

export async function GET(req: NextRequest) {
  // 1. Wallet JWT cookie
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    const payload = await verifyJWT(token);
    if (payload?.walletAddress) {
      if (process.env.MONGODB_URI) {
        try {
          const dbUser = await getUserByWallet(payload.walletAddress);
          if (dbUser) {
            return NextResponse.json({
              walletAddress: dbUser.walletAddress ?? null,
              userId: dbUser._id.toString(),
              username: dbUser.username,
              avatarUrl: dbUser.avatarUrl,
              karma: dbUser.karma,
              provider: dbUser.authProvider,
            });
          }
        } catch { /* fall through */ }
      }
      return NextResponse.json({
        walletAddress: payload.walletAddress,
        userId: null,
        username: null,
        provider: "wallet",
      });
    }
  }

  // 2. NextAuth session (Google OAuth)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    if (process.env.MONGODB_URI) {
      try {
        const dbUser = await getUserById(session.user.id);
        if (dbUser) {
          return NextResponse.json({
            walletAddress: dbUser.walletAddress ?? null,
            userId: dbUser._id.toString(),
            username: dbUser.username,
            avatarUrl: dbUser.avatarUrl,
            karma: dbUser.karma,
            provider: dbUser.authProvider,
          });
        }
      } catch { /* fall through */ }
    }
    return NextResponse.json({
      walletAddress: null,
      userId: session.user.id,
      username: session.user.name ?? null,
      provider: "google",
    });
  }

  return NextResponse.json({ walletAddress: null }, { status: 401 });
}
