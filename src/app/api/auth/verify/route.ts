import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import { signJWT } from "@/lib/jwt";
import { findOrCreateUserByWallet } from "@/services/userService";
<<<<<<< HEAD
import { rewardsOracle } from "@/services/rewardsOracleService";

const COOKIE_NAME = "mp_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const NONCE_COOKIE = "mp_nonce";
=======
import { connectDB } from "@/lib/db";
import AuthNonce from "@/models/AuthNonce";

const COOKIE_NAME = "mp_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const NONCE_COOKIE = "mp_nonce_id";
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a

export async function POST(req: NextRequest) {
  let body: { address?: string; signature?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { address, signature } = body;

  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  if (!signature || typeof signature !== "string") {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

<<<<<<< HEAD
  const nonceCookie = req.cookies.get(NONCE_COOKIE)?.value;
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

=======
  const nonceId = req.cookies.get(NONCE_COOKIE)?.value;
  if (!nonceId) {
    return NextResponse.json({ error: "Nonce expired or not found. Please try again." }, { status: 401 });
  }

  try {
    await connectDB();
  } catch {
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 });
  }

  const nonceDoc = await AuthNonce.findOne({
    _id: nonceId,
    address: address.toLowerCase(),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!nonceDoc) {
    return NextResponse.json({ error: "Nonce expired or not found. Please try again." }, { status: 401 });
  }

  const nonce = nonceDoc.nonce;

>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
  const message = `Sign this message to authenticate with Medipear.\n\nNonce: ${nonce}`;

  let recoveredAddress: string;
  try {
    recoveredAddress = verifyMessage(message, signature);
  } catch {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
  }

  if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    return NextResponse.json({ error: "Signature does not match address" }, { status: 401 });
  }

<<<<<<< HEAD
=======
  const consumed = await AuthNonce.findOneAndUpdate(
    {
      _id: nonceDoc._id,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
    { new: true }
  );
  if (!consumed) {
    return NextResponse.json({ error: "Nonce already used. Please try again." }, { status: 409 });
  }

>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
  const normalizedWalletAddress = address.toLowerCase();
  const token = await signJWT(address.toLowerCase());

  // Upsert user record in MongoDB (no-op if DB not configured)
  let dbUser = null;
<<<<<<< HEAD
  if (process.env.MONGODB_URI) {
    try {
      dbUser = await findOrCreateUserByWallet(address);
=======
  let isNewUser = false;
  if (process.env.MONGODB_URI) {
    try {
      const result = await findOrCreateUserByWallet(address);
      dbUser = result.user;
      isNewUser = result.isNewUser;
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
    } catch {
      // Non-fatal: proceed without DB
    }
  }
<<<<<<< HEAD
  
  // Trigger daily login reward asynchronously (fire and forget)
  rewardsOracle.onDailyLogin(normalizedWalletAddress, dbUser?._id?.toString()).catch(console.error);
=======
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a

  const res = NextResponse.json({
    walletAddress: normalizedWalletAddress,
    username: dbUser?.username ?? null,
<<<<<<< HEAD
    userId: dbUser?._id?.toString() ?? null,
=======
    displayName: dbUser?.displayName ?? dbUser?.username ?? null,
    userId: dbUser?._id?.toString() ?? null,
    onboardingCompleted: !!dbUser?.onboardingCompleted,
    onboardingStep: dbUser?.onboardingStep ?? 1,
    email: dbUser?.email ?? null,
    walletLinked: true,
    googleLinked: !!dbUser?.googleId,
    emailLinked: !!dbUser?.email,
    provider: "wallet",
    isNewUser,
    needsGoogleLink: !dbUser?.googleId,
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
  });

  console.info("[wallet-auth] verify success", {
    providerWalletAddress: normalizedWalletAddress,
    sessionWalletAddress: normalizedWalletAddress,
    matches: true,
  });

  res.cookies.set(NONCE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return res;
}
