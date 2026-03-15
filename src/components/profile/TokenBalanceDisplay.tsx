"use client";

import { useTokenBalance, useStakingInfo } from "@/hooks/useBlockchain";
import { Zap, Lock } from "lucide-react";
import Link from "next/link";

interface TokenBalanceDisplayProps {
  walletAddress?: string | null;
}

export default function TokenBalanceDisplay({ walletAddress }: TokenBalanceDisplayProps) {
  const { balance, loading: balanceLoading, error: balanceError } = useTokenBalance(walletAddress);
  const { stakeInfo, loading: stakeLoading, error: stakeError } = useStakingInfo(walletAddress);

  if (!walletAddress) {
    return null;
  }

  // Show helpful error message if contracts aren't deployed
  if ((balanceError || stakeError) && (balanceError?.includes("not deployed") || stakeError?.includes("not deployed"))) {
    return (
      <div
        className="rounded-lg p-4 border mt-4"
        style={{ borderColor: "#ef4444", background: "rgba(239, 68, 68, 0.1)" }}>
        <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>
          <span style={{ fontWeight: "600" }}>Contracts not deployed yet.</span> Run your deployment script and update .env.local with contract addresses.
        </p>
      </div>
    );
  }

  const formattedBalance = balance ? parseFloat(balance).toFixed(2) : "0.00";
  const stakedAmount = stakeInfo?.amount ? (Number(stakeInfo.amount) / 1e18).toFixed(2) : "0.00";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
      {/* Token Balance */}
      <div
        className="rounded-lg p-3 border"
        style={{ borderColor: "var(--border)", background: "rgba(167, 139, 250, 0.05)" }}>
        <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          MPR Balance
        </p>
        <div className="flex items-baseline gap-2">
          {balanceLoading ? (
            <div className="h-6 w-20 bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <>
              <p className="font-bold text-lg" style={{ color: "#a78bfa" }}>
                {formattedBalance}
              </p>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                MPR
              </span>
            </>
          )}
        </div>
      </div>

      {/* Staked Amount */}
      <div
        className="rounded-lg p-3 border"
        style={{ borderColor: "var(--border)", background: "rgba(52, 211, 153, 0.05)" }}>
        <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          Staked MPR
        </p>
        <div className="flex items-baseline gap-2">
          {stakeLoading ? (
            <div className="h-6 w-16 bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <>
              <p className="font-bold text-lg" style={{ color: "#34d399" }}>
                {stakedAmount}
              </p>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                MPR
              </span>
            </>
          )}
        </div>
      </div>

      {/* Staking Action */}
      <div className="col-span-2 sm:col-span-1">
        <Link
          href="/stake"
          className="w-full h-full rounded-lg p-3 border flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
          style={{ borderColor: "var(--border)", background: "rgba(99, 165, 250, 0.05)" }}>
          <Zap size={14} style={{ color: "#60a5fa" }} />
          <p className="text-xs font-medium mt-1" style={{ color: "#60a5fa" }}>
            Stake
          </p>
        </Link>
      </div>

      {/* Unlock Info (if staked) */}
      {stakeInfo && stakeInfo.amount > BigInt(0) && (
        <div
          className="col-span-2 sm:col-span-3 rounded-lg p-3 border flex items-center gap-2"
          style={{ borderColor: "var(--border)", background: "rgba(107, 114, 128, 0.05)" }}>
          <Lock size={14} style={{ color: "var(--muted)" }} />
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Unlocks: {formatUnlockTime(stakeInfo.unlockedAt)}
          </p>
        </div>
      )}
    </div>
  );
}

function formatUnlockTime(unlockedAtTimestamp: number): string {
  if (unlockedAtTimestamp === 0) return "Already unlocked";

  const unlockedAt = new Date(unlockedAtTimestamp * 1000);
  const now = new Date();

  if (unlockedAt <= now) {
    return "Ready to unstake";
  }

  const diffMs = unlockedAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return `in ${diffHours}h`;
  }

  return `in ${diffDays}d`;
}
