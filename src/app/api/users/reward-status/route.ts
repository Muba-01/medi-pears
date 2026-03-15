import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { rewardEligibilityService } from "@/services/rewardEligibilityService";
import { verifyJWT } from "@/lib/jwt";

/**
 * GET /api/users/reward-status
 * Returns the current user's reward eligibility status
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - no token provided" },
        { status: 401 }
      );
    }

    // Verify token (this is for wallet auth tokens, not link tokens)
    const payload = await verifyJWT(token);
    if (!payload || !payload.walletAddress) {
      return NextResponse.json(
        { error: "Unauthorized - invalid token" },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Find user by wallet address
    const user = await User.findOne({ walletAddress: payload.walletAddress })
      .select(
        "username avatar bio walletAddress eligibleForRewards trustScoreAverage crediblePostCount rewardEligibilityCheckedAt"
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = user._id?.toString();

    // Check and update eligibility if cache is stale (older than 1 hour)
    const now = new Date();
    const cacheAge = user.rewardEligibilityCheckedAt
      ? new Date(user.rewardEligibilityCheckedAt).getTime()
      : 0;
    const isStale = now.getTime() - cacheAge > 3600000; // 1 hour in milliseconds

    let eligibilityResult = null;
    if (isStale) {
      console.log(`[REWARD_STATUS] Checking eligibility for user ${user.username}`);
      eligibilityResult = await rewardEligibilityService.checkUserRewardEligibility(userId);
      
      // Update user with new eligibility info
      await User.findByIdAndUpdate(
        userId,
        {
          eligibleForRewards: eligibilityResult.eligible,
          trustScoreAverage: eligibilityResult.averageTrustScore,
          crediblePostCount: eligibilityResult.crediblePostCount,
          rewardEligibilityCheckedAt: new Date(),
        },
        { new: true }
      );
    } else {
      // Use cached values
      eligibilityResult = {
        eligible: user.eligibleForRewards,
        crediblePostCount: user.crediblePostCount,
        totalPostCount: 0, // Will be populated if needed
        averageTrustScore: user.trustScoreAverage,
        accountAgeValid: true, // Will be re-checked above
        reasons: [],
      };
    }

    // Return eligibility status
    return NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        walletAddress: user.walletAddress,
      },
      eligibility: {
        eligible: eligibilityResult.eligible,
        crediblePostCount: eligibilityResult.crediblePostCount,
        totalPostsRequired: 10,
        averageTrustScore: eligibilityResult.averageTrustScore?.toFixed(2),
        minimumTrustScore: 0.7,
        accountAgeValid: eligibilityResult.accountAgeValid,
        reasons: eligibilityResult.reasons,
        checkedAt: new Date().toISOString(),
      },
      progress: {
        posts: {
          current: eligibilityResult.crediblePostCount,
          required: 10,
          percentage: Math.min(
            100,
            Math.round((eligibilityResult.crediblePostCount / 10) * 100)
          ),
        },
        trustScore: {
          current: eligibilityResult.averageTrustScore?.toFixed(2) || 0,
          required: 0.7,
          percentage: Math.min(
            100,
            Math.round(
              ((eligibilityResult.averageTrustScore || 0) / 0.7) * 100
            )
          ),
        },
      },
    });
  } catch (error) {
    console.error("[REWARD_STATUS] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reward status" },
      { status: 500 }
    );
  }
}
