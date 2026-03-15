import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

// Activity schema for storing reward history
const activitySchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, lowercase: true },
  type: { type: String, enum: ["post", "upvote", "comment", "daily_login"], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  txHash: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const walletAddress = searchParams.get("walletAddress");
  const limit = parseInt(searchParams.get("limit") || "5");

  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
  }

  try {
    await connectDB();

    const activities = await Activity.find({
      walletAddress: walletAddress.toLowerCase(),
    })
      .sort({ timestamp: -1 })
      .limit(Math.min(limit, 50))
      .lean();

    return NextResponse.json({
      activities: activities.map((activity: any) => ({
        id: activity._id.toString(),
        type: activity.type,
        amount: activity.amount,
        description: activity.description,
        timestamp: activity.timestamp,
        txHash: activity.txHash,
      })),
    });
  } catch (error) {
    console.error("[Rewards API] Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, type, amount, description, txHash } = body;

    if (!walletAddress || !type || !amount || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const activity = await Activity.create({
      walletAddress: walletAddress.toLowerCase(),
      type,
      amount,
      description,
      txHash,
      timestamp: new Date(),
    });

    return NextResponse.json({
      id: activity._id.toString(),
      type: activity.type,
      amount: activity.amount,
      description: activity.description,
      timestamp: activity.timestamp,
      txHash: activity.txHash,
    });
  } catch (error) {
    console.error("[Rewards API] Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
