import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { toggleJoinCommunity } from "@/services/communityService";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const result = await toggleJoinCommunity(slug, user._id.toString());
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to join community";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
