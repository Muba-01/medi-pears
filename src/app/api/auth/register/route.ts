import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/password";
import { findUserByEmail, createUserWithEmail } from "@/services/userService";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens and underscores allowed"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const message = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Validation failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const { email, password, username } = parsed.data;

  try {
    await connectDB();

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUserWithEmail(email, username, passwordHash);

    return NextResponse.json(
      { userId: user._id.toString(), username: user.username, email: user.email },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    console.error("[register]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
