import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { verifyJWT } from "@/lib/jwt";
import { linkWalletToUser, getUserByWallet } from "@/services/userService";

/**
 * POST /api/auth/link-wallet
 * Links a verified wallet address to the currently authenticated user (Google or wallet session).
 * Body: { address: string, signature: string }
 */
export async function POST(req: NextRequest) {
  let body: { address?: string; signature?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { address, signature } = body;

  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }
  if (!signature || typeof signature !== "string") {
    return NextResponse.json({ error: "signature is required" }, { status: 400 });
  }

  const nonceCookie = req.cookies.get("mp_nonce")?.value;
  if (!nonceCookie) {
    return NextResponse.json({ error: "Nonce expired or not found. Please try again." }, { status: 401 });
  }

  let nonce = "";
  try {
    const decoded = JSON.parse(Buffer.from(nonceCookie, "base64url").toString("utf8")) as {
      address?: string;
      nonce?: string;
      exp?: number;
    };

    if (
      decoded.address?.toLowerCase() !== address.toLowerCase() ||
      !decoded.nonce ||
      typeof decoded.exp !== "number" ||
      Date.now() > decoded.exp
    ) {
      throw new Error("Invalid nonce challenge");
    }

    nonce = decoded.nonce;
  } catch {
    return NextResponse.json({ error: "Nonce expired or not found. Please try again." }, { status: 401 });
  }

  const message = `Sign this message to authenticate with Medipear.\n\nNonce: ${nonce}`;

  // Verify signature
  let recovered: string;
  try {
    recovered = verifyMessage(message, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return NextResponse.json({ error: "Signature mismatch" }, { status: 401 });
  }

  // Check wallet not already taken by another user
  const existing = await getUserByWallet(address);
  if (existing) {
    return NextResponse.json({ error: "Wallet already linked to another account" }, { status: 409 });
  }

  // Resolve current user from either a wallet JWT or a NextAuth Google session
  let userId: string | null = null;

  const token = req.cookies.get("mp_token")?.value;
  if (token) {
    const payload = await verifyJWT(token);
    if (payload?.walletAddress) {
      return NextResponse.json({ error: "Already authenticated with a wallet" }, { status: 400 });
    }
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    userId = session.user.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const updated = await linkWalletToUser(userId, address);
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const res = NextResponse.json({
    walletAddress: updated.walletAddress,
    username: updated.username,
    userId: updated._id.toString(),
  });

  res.cookies.set("mp_nonce", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return res;
}
