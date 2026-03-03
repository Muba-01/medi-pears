"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { BrowserProvider, Wallet } from "ethers";
import { signIn, signOut, useSession } from "next-auth/react";

// Dev-mode test wallet (never use in production)
const DEV_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const IS_DEV_MODE =
  process.env.NEXT_PUBLIC_DEV_WALLET === "true" &&
  process.env.NODE_ENV !== "production";

interface AuthState {
  walletAddress: string | null;
  userId: string | null;
  username: string | null;
  avatarUrl: string | null;
  karma: number;
  provider: "wallet" | "google" | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const EMPTY: AuthState = {
  walletAddress: null,
  userId: null,
  username: null,
  avatarUrl: null,
  karma: 0,
  provider: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ ...EMPTY, isLoading: true });
  const { data: nextAuthSession, status: sessionStatus } = useSession();

  const setError = (error: string | null) =>
    setState((s) => ({ ...s, error, isLoading: false }));

  // Restore session on mount (handles wallet JWT cookie)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setState({
            walletAddress: data.walletAddress ?? null,
            userId: data.userId ?? null,
            username: data.username ?? null,
            avatarUrl: data.avatarUrl ?? null,
            karma: data.karma ?? 0,
            provider: data.provider ?? null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState({ ...EMPTY });
        }
      } catch {
        setState({ ...EMPTY });
      }
    })();
  }, []);

  // Sync Google OAuth session from next-auth into app state
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "authenticated" && nextAuthSession?.user) {
      setState((prev) => {
        // Don't overwrite a fully-loaded session (wallet or google from /api/auth/me)
        if (prev.isAuthenticated && prev.userId) return prev;
        const u = nextAuthSession.user;
        return {
          walletAddress: (u as { walletAddress?: string | null }).walletAddress ?? null,
          userId: (u as { id?: string }).id ?? null,
          username: (u as { username?: string }).username ?? u.name ?? null,
          avatarUrl: u.image ?? null,
          karma: 0,
          provider: "google",
          isAuthenticated: true,
          isLoading: false,
          error: null,
        };
      });
    } else if (sessionStatus === "unauthenticated") {
      setState((prev) => {
        // Don't clear a wallet session on unauthenticated nextAuth status
        if (prev.provider === "wallet" && prev.isAuthenticated) return prev;
        return prev;
      });
    }
  }, [sessionStatus, nextAuthSession]);

  const login = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      let address: string;
      let signature: string;

      if (IS_DEV_MODE) {
        const devWallet = new Wallet(DEV_PRIVATE_KEY);
        address = devWallet.address;
        const nonceRes = await fetch(`/api/auth/nonce?address=${address}`);
        if (!nonceRes.ok) throw new Error((await nonceRes.json()).error ?? "Failed to get nonce.");
        const { message } = await nonceRes.json();
        signature = await devWallet.signMessage(message);
      } else {
        if (typeof window === "undefined" || !window.ethereum) {
          throw new Error("MetaMask is not installed. Please install it from metamask.io to continue.");
        }
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        address = accounts[0];
        if (!address) throw new Error("No account selected.");
        const nonceRes = await fetch(`/api/auth/nonce?address=${address}`);
        if (!nonceRes.ok) throw new Error((await nonceRes.json()).error ?? "Failed to get nonce.");
        const { message } = await nonceRes.json();
        signature = await (new BrowserProvider(window.ethereum)).getSigner().then((s) => s.signMessage(message));
      }

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });
      if (!verifyRes.ok) throw new Error((await verifyRes.json()).error ?? "Verification failed.");
      const data = await verifyRes.json();

      setState({
        walletAddress: data.walletAddress,
        userId: data.userId ?? null,
        username: data.username ?? null,
        avatarUrl: null,
        karma: 0,
        provider: "wallet",
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await signIn("google", { callbackUrl: "/" });
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut({ redirect: false });
    setState({ ...EMPTY });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}