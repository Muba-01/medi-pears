import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import mongoose from "mongoose";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectDB } from "@/lib/db";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed. Supported: JPG, PNG, GIF, WebP, MP4, WebM, MOV" },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 413 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Sanitise original name — keep only safe characters
  const originalExt = (file.name.split(".").pop() ?? "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${originalExt}`;

  const conn = await connectDB();
  if (!conn.connection.db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const bucket = new mongoose.mongo.GridFSBucket(conn.connection.db, { bucketName: "uploads" });
  const uploadStream = bucket.openUploadStream(safeName, {
    metadata: {
      uploaderId: user._id.toString(),
      originalName: file.name,
      mimeType: file.type,
    },
  });

  await pipeline(Readable.from(buffer), uploadStream);

  return NextResponse.json({ url: `/api/media/${uploadStream.id.toString()}.${originalExt}` }, { status: 201 });
}
