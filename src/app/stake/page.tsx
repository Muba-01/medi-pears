"use client";

import { useState, useEffect } from "react";
import { Zap, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useStakingInfo, useStakeTransaction, useTokenBalance } from "@/hooks/useBlockchain";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function StakePage() {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress;

  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");

  const { balance = "0", loading: balanceLoading } = useTokenBalance(walletAddress);
  const { stakeInfo, loading: stakeLoading, refetch: refetchStakeInfo } = useStakingInfo(walletAddress);
  const { transactionState, transactionHash, error, stake, unstake, reset } = useStakeTransaction();

  useEffect(() => {
    // Refetch staking info after successful transaction
    if (transactionState === "success") {
      const timer = setTimeout(() => {
        refetchStakeInfo();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [transactionState, refetchStakeInfo]);

  if (!session || !walletAddress) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="rounded-lg border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <p className="mb-4" style={{ color: "var(--muted)" }}>
            Please sign in to access staking
          </p>
          <Link
            href="/api/auth/signin"
            className="inline-block px-6 py-2 rounded-lg font-medium"
            style={{ background: "#7c3aed", color: "white" }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const numBalance = balance ? parseFloat(balance) : 0;
  const canStake = numBalance > 0;
  const canUnstake = stakeInfo ? stakeInfo.amount > BigInt(0) : false;
  const isStaking = stakeInfo ? stakeInfo.amount > BigInt(0) : false;

  const handleStake = async () => {
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) {
      alert("Please enter a valid amount");
      return;
    }
    await stake(stakeAmount);
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || isNaN(parseFloat(unstakeAmount))) {
      alert("Please enter a valid amount");
      return;
    }
    await unstake(unstakeAmount);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: "var(--foreground)" }}>
          <Zap size={32} style={{ color: "#a78bfa" }} />
          Token Staking
        </h1>
        <p style={{ color: "var(--muted)" }} className="mt-2">
          Stake your MPR tokens to unlock tiers, boost rewards, and unlock exclusive features
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Staking Card */}
        <div className="lg:col-span-3 space-y-6">
      <div className="rounded-lg border p-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              Your Balance
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Available
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: "#a78bfa" }}>
                  {balanceLoading ? "..." : (balance ? parseFloat(balance).toFixed(2) : "0.00")}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  MPR
                </p>
              </div>

              <div>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Staked
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: "#34d399" }}>
                  {stakeLoading ? "..." : stakeInfo ? (Number(stakeInfo.amount) / 1e18).toFixed(2) : "0.00"}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  MPR
                </p>
              </div>
            </div>

            {isStaking && stakeInfo && (
              <div
                className="mt-4 p-3 rounded-lg flex items-start gap-2"
                style={{ background: "rgba(107, 114, 128, 0.2)" }}>
                <Lock size={16} style={{ color: "var(--muted)" }} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Locked until: {new Date(stakeInfo.unlockedAt * 1000).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Staking Form */}
          <div className="rounded-lg border p-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => {
                  setActiveTab("stake");
                  reset();
                }}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === "stake" ? "border-purple-500" : ""
                }`}
                style={{
                  color: activeTab === "stake" ? "#a78bfa" : "var(--muted)",
                  borderBottomColor: activeTab === "stake" ? "#a78bfa" : "transparent",
                }}>
                Stake Tokens
              </button>
              <button
                onClick={() => {
                  setActiveTab("unstake");
                  reset();
                }}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === "unstake" ? "border-purple-500" : ""
                }`}
                style={{
                  color: activeTab === "unstake" ? "#a78bfa" : "var(--muted)",
                  borderBottomColor: activeTab === "unstake" ? "#a78bfa" : "transparent",
                }}>
                Unstake Tokens
              </button>
            </div>

            {activeTab === "stake" ? (
              <StakingForm
                amount={stakeAmount}
                setAmount={setStakeAmount}
                onSubmit={handleStake}
                loading={transactionState === "pending"}
                canStake={canStake}
                maxAmount={balance ? parseFloat(balance) : 0}
                label="Amount to Stake"
              />
            ) : (
              <StakingForm
                amount={unstakeAmount}
                setAmount={setUnstakeAmount}
                onSubmit={handleUnstake}
                loading={transactionState === "pending"}
                canStake={canUnstake}
                maxAmount={stakeInfo ? Number(stakeInfo.amount) / 1e18 : 0}
                label="Amount to Unstake"
              />
            )}

            {/* Transaction Status */}
            {transactionState !== "idle" && (
              <TransactionStatus
                state={transactionState}
                hash={transactionHash}
                error={error}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StakingForm({
  amount,
  setAmount,
  onSubmit,
  loading,
  canStake,
  maxAmount,
  label,
}: {
  amount: string;
  setAmount: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
  canStake: boolean;
  maxAmount: number;
  label: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
          {label}
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          disabled={!canStake || loading}
          className="w-full px-4 py-2 rounded-lg border outline-none transition-colors"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#a78bfa";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        />
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          Max: {maxAmount.toFixed(2)} MPR
        </p>
      </div>

      <button
        onClick={onSubmit}
        disabled={!canStake || !amount || loading}
        className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: canStake && amount ? "#a78bfa" : "#6b7280",
          color: "white",
        }}>
        {loading ? "Processing..." : amount ? "Confirm" : "Enter Amount"}
      </button>
    </div>
  );
}

function TransactionStatus({
  state,
  hash,
  error,
}: {
  state: "pending" | "success" | "error";
  hash?: string;
  error?: string;
}) {
  return (
    <div
      className="mt-4 p-4 rounded-lg flex items-start gap-3"
      style={{
        background:
          state === "success"
            ? "rgba(52, 211, 153, 0.1)"
            : state === "pending"
              ? "rgba(99, 165, 250, 0.1)"
              : "rgba(239, 68, 68, 0.1)",
      }}>
      {state === "pending" && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
      {state === "success" && <CheckCircle size={20} style={{ color: "#34d399" }} />}
      {state === "error" && <AlertCircle size={20} style={{ color: "#ef4444" }} />}

      <div className="flex-1">
        {state === "pending" && <p style={{ color: "#60a5fa" }}>Processing transaction...</p>}
        {state === "success" && (
          <div>
            <p style={{ color: "#34d399", fontWeight: "600" }}>Transaction successful!</p>
            {hash && (
              <a
                href={`https://etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline"
                style={{ color: "#34d399" }}>
                View on Etherscan
              </a>
            )}
          </div>
        )}
        {state === "error" && <p style={{ color: "#ef4444" }}>Error: {error}</p>}
      </div>
    </div>
  );
}
