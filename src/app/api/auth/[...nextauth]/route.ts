import NextAuth from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

async function handler(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const rawLinkToken = req.cookies.get("mp_link")?.value ?? null;
  const options = buildAuthOptions(rawLinkToken);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (NextAuth(options) as any)(req, ctx);
}

export { handler as GET, handler as POST };
