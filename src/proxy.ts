import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyJWT } from "@/lib/jwt";

<<<<<<< HEAD
const PROTECTED_PATHS = ["/create"];
=======
const PROTECTED_PATHS = ["/create", "/onboarding"];
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
const WALLET_COOKIE = "mp_token";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected) return NextResponse.next();

  // 1. Check wallet JWT cookie
  const walletToken = req.cookies.get(WALLET_COOKIE)?.value;
  if (walletToken) {
    const payload = await verifyJWT(walletToken);
    if (payload?.walletAddress) return NextResponse.next();
  }

  // 2. Check NextAuth session (Google OAuth)
  const nextAuthToken = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (nextAuthToken?.userId) return NextResponse.next();

  // Not authenticated — send home (CreatePostForm will show sign-in gate)
  return NextResponse.redirect(new URL("/", req.url));
}

export const config = {
<<<<<<< HEAD
  matcher: ["/create", "/create/:path*"],
=======
  matcher: ["/create", "/create/:path*", "/onboarding", "/onboarding/:path*"],
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
};
