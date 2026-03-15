import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { createCommunity, getCommunities } from "@/services/communityService";
import { CreateCommunitySchema } from "@/lib/validations";

export async function GET() {
  try {
    const communities = await getCommunities();
    return NextResponse.json({ communities });
  } catch {
    return NextResponse.json({ communities: [] });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateCommunitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const community = await createCommunity(parsed.data, user._id.toString());
    return NextResponse.json({ community }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create community";
    const status = message.includes("duplicate") || message.includes("unique") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
