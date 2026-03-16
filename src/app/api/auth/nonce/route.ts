import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
<<<<<<< HEAD

const NONCE_COOKIE = "mp_nonce";
=======
import { connectDB } from "@/lib/db";
import AuthNonce from "@/models/AuthNonce";

const NONCE_COOKIE = "mp_nonce_id";
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
const NONCE_TTL_SECONDS = 5 * 60;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const normalizedAddress = address.toLowerCase();
  const nonce = randomBytes(32).toString("hex");
<<<<<<< HEAD
  const challenge = {
    address: normalizedAddress,
    nonce,
    exp: Date.now() + NONCE_TTL_SECONDS * 1000,
  };
=======

  try {
    await connectDB();
  } catch {
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 });
  }

  const nonceDoc = await AuthNonce.create({
    address: normalizedAddress,
    nonce,
    expiresAt: new Date(Date.now() + NONCE_TTL_SECONDS * 1000),
  });
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a

  const res = NextResponse.json({
    nonce,
    message: `Sign this message to authenticate with Medipear.\n\nNonce: ${nonce}`,
  });

<<<<<<< HEAD
  res.cookies.set(NONCE_COOKIE, Buffer.from(JSON.stringify(challenge)).toString("base64url"), {
=======
  res.cookies.set(NONCE_COOKIE, nonceDoc._id.toString(), {
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: NONCE_TTL_SECONDS,
    path: "/",
  });

  return res;
}
