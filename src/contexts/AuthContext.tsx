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
  email: string | null;
  karma: number;
  provider: "wallet" | "google" | "email" | null;
  walletLinked: boolean;
  googleLinked: boolean;
  emailLinked: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  linkWallet: () => Promise<void>;
  linkGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const EMPTY: AuthState = {
  walletAddress: null,
  userId: null,
  username: null,
  avatarUrl: null,
  email: null,
  karma: 0,
  provider: null,
  walletLinked: false,
  googleLinked: false,
  emailLinked: false,
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
            email: data.email ?? null,
            karma: data.karma ?? 0,
            provider: data.provider ?? null,
            walletLinked: data.walletLinked ?? !!data.walletAddress,
            googleLinked: data.googleLinked ?? false,
            emailLinked: data.emailLinked ?? false,
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
          email: (u as { email?: string | null }).email ?? null,
          karma: 0,
          provider: "google" as const,
          walletLinked: !!((u as { walletAddress?: string | null }).walletAddress),
          googleLinked: true,
          emailLinked: false,
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
        email: null,
        karma: 0,
        provider: "wallet",
        walletLinked: true,
        googleLinked: false,
        emailLinked: false,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut({ redirect: false });
    setState({ ...EMPTY });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          username: data.username ?? prev.username,
          avatarUrl: data.avatarUrl ?? prev.avatarUrl,
          email: data.email ?? prev.email,
          walletAddress: data.walletAddress ?? prev.walletAddress,
          walletLinked: data.walletLinked ?? prev.walletLinked,
          googleLinked: data.googleLinked ?? prev.googleLinked,
          emailLinked: data.emailLinked ?? prev.emailLinked,
        }));
      }
    } catch { /* silent */ }
  }, []);

  const linkWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }
    const { BrowserProvider } = await import("ethers");
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const address: string = accounts[0];
    if (!address) throw new Error("No account selected.");

    const nonceRes = await fetch(`/api/auth/nonce?address=${address}`);
    if (!nonceRes.ok) throw new Error((await nonceRes.json()).error ?? "Failed to get nonce.");
    const { message } = await nonceRes.json();

    const signer = await new BrowserProvider(window.ethereum).getSigner();
    const signature = await signer.signMessage(message);

    const linkRes = await fetch("/api/auth/link-wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, signature, message }),
    });
    if (!linkRes.ok) {
      const data = await linkRes.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to link wallet.");
    }
    await refreshProfile();
  }, [refreshProfile]);

  const linkGoogle = useCallback(async () => {
    const initRes = await fetch("/api/auth/link-google/initiate", { method: "POST" });
    if (!initRes.ok) {
      const data = await initRes.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to initiate Google link.");
    }
    await signIn("google", { callbackUrl: window.location.href });
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await signIn("google", { callbackUrl: window.location.href });
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (result?.error) {
      setState((s) => ({ ...s, isLoading: false, error: "Invalid email or password." }));
      throw new Error("Invalid email or password.");
    }
    // Fetch full profile after credentials sign-in
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setState({
        walletAddress: data.walletAddress ?? null,
        userId: data.userId ?? null,
        username: data.username ?? null,
        avatarUrl: data.avatarUrl ?? null,
        email: data.email ?? null,
        karma: data.karma ?? 0,
        provider: data.provider ?? "email",
        walletLinked: data.walletLinked ?? false,
        googleLinked: data.googleLinked ?? false,
        emailLinked: data.emailLinked ?? true,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, loginWithEmail, linkWallet, linkGoogle, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}