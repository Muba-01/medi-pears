import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

export interface JWTData extends JWTPayload {
  walletAddress: string;
}

export interface LinkTokenData extends JWTPayload {
  userId: string;
  type: "link";
}

export async function signJWT(walletAddress: string): Promise<string> {
  return new SignJWT({ walletAddress })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTData | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTData;
  } catch {
    return null;
  }
}

export async function signLinkJWT(userId: string): Promise<string> {
  return new SignJWT({ userId, type: "link" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);
}

export async function verifyLinkJWT(token: string): Promise<LinkTokenData | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if ((payload as LinkTokenData).type !== "link") return null;
    return payload as LinkTokenData;
  } catch {
    return null;
  }
}
