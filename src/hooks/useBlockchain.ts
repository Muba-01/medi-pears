"use client";

import { useState, useEffect, useCallback } from "react";
import { blockchainService, type StakeInfo } from "@/services/blockchainService";

interface UseTokenBalanceReturn {
  balance: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTokenBalance(walletAddress: string | null | undefined): UseTokenBalanceReturn {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await blockchainService.getTokenBalance(walletAddress);
      setBalance(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch balance";
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);

    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { balance, loading, error, refetch: fetchBalance };
}

interface UseStakingInfoReturn {
  stakeInfo: StakeInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStakingInfo(walletAddress: string | null | undefined): UseStakingInfoReturn {
  const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStakingInfo = useCallback(async () => {
    if (!walletAddress) {
      setStakeInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const info = await blockchainService.getStakingInfo(walletAddress);
      setStakeInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch staking info";
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchStakingInfo();

    // Refresh staking info every 30 seconds
    const interval = setInterval(fetchStakingInfo, 30000);

    return () => clearInterval(interval);
  }, [fetchStakingInfo]);

  return { stakeInfo, loading, error, refetch: fetchStakingInfo };
}

interface UseStakeTransactionReturn {
  transactionState: "idle" | "pending" | "success" | "error";
  transactionHash?: string;
  error?: string;
  stake: (amount: string) => Promise<void>;
  unstake: (amount: string) => Promise<void>;
  reset: () => void;
}

export function useStakeTransaction(): UseStakeTransactionReturn {
  const [transactionState, setTransactionState] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [transactionHash, setTransactionHash] = useState<string>();
  const [error, setError] = useState<string>();

  const stake = useCallback(async (amount: string) => {
    setTransactionState("pending");
    setError(undefined);

    try {
      const result = await blockchainService.stake(amount);

      if (result.status === "success") {
        setTransactionState("success");
        setTransactionHash(result.hash);
      } else {
        setTransactionState("error");
        setError(result.error || "Transaction failed");
      }
    } catch (err) {
      setTransactionState("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  const unstake = useCallback(async (amount: string) => {
    setTransactionState("pending");
    setError(undefined);

    try {
      const result = await blockchainService.unstake(amount);

      if (result.status === "success") {
        setTransactionState("success");
        setTransactionHash(result.hash);
      } else {
        setTransactionState("error");
        setError(result.error || "Transaction failed");
      }
    } catch (err) {
      setTransactionState("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  const reset = useCallback(() => {
    setTransactionState("idle");
    setTransactionHash(undefined);
    setError(undefined);
  }, []);

  return {
    transactionState,
    transactionHash,
    error,
    stake,
    unstake,
    reset,
  };
}
