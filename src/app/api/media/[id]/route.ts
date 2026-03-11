import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const rawId = id.split(".")[0] ?? "";

  if (!mongoose.mongo.ObjectId.isValid(rawId)) {
    return NextResponse.json({ error: "Invalid media id" }, { status: 400 });
  }

  const conn = await connectDB();
  if (!conn.connection.db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const db = conn.connection.db;
  const objectId = new mongoose.mongo.ObjectId(rawId);

  const fileDoc = await db.collection("uploads.files").findOne<{
    length: number;
    metadata?: { mimeType?: string };
  }>({ _id: objectId });
  if (!fileDoc) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "uploads" });
  const nodeStream = bucket.openDownloadStream(objectId);

  return new NextResponse(Readable.toWeb(nodeStream) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": fileDoc.metadata?.mimeType ?? "application/octet-stream",
      "Content-Length": String(fileDoc.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
