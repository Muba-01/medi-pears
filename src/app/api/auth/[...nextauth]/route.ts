import NextAuth from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
<<<<<<< HEAD
import { NextRequest } from "next/server";
=======
import { NextRequest, NextResponse } from "next/server";
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a

async function handler(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const rawLinkToken = req.cookies.get("mp_link")?.value ?? null;
  const options = buildAuthOptions(rawLinkToken);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
<<<<<<< HEAD
  return (NextAuth(options) as any)(req, ctx);
=======
  const response = await (NextAuth(options) as any)(req, ctx);

  if (rawLinkToken && req.nextUrl.pathname.includes("/callback/google")) {
    const wrapped = new NextResponse(response.body, response);
    wrapped.cookies.set("mp_link", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return wrapped;
  }

  return response;
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
}

export { handler as GET, handler as POST };
