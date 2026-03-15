"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "signin" | "signup";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: Mode;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.3 9 3.4l6.7-6.7C35.6 2.5 30.1 0 24 0 14.7 0 6.8 5.4 3 13.3l7.8 6C12.7 13.3 17.9 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z" />
      <path fill="#FBBC05" d="M10.8 28.7A14.4 14.4 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7L2.5 13.3A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l8.3-6z" />
      <path fill="#34A853" d="M24 48c6.1 0 11.2-2 14.9-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.4 2.2-6.1 0-11.3-3.8-13.2-9.2l-7.8 6C6.8 42.6 14.7 48 24 48z" />
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose, defaultMode = "signin" }: Props) {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>(defaultMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/mode changes
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setPassword("");
      setUsername("");
      setConfirmPassword("");
      setError(null);
      setLoading(false);
      setShowPassword(false);
    }
  }, [isOpen, mode]);

  // Sync defaultMode when it changes externally
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const switchMode = useCallback((next: Mode) => {
    setMode(next);
    setError(null);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Registration failed.");
      }
      await loginWithEmail(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    loginWithGoogle();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border shadow-2xl p-6 relative"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: "var(--muted)" }}
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {/* Logo + heading */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
          >
            <Zap size={13} className="text-white" />
          </div>
          <span className="font-bold text-base" style={{ color: "var(--foreground)" }}>Medipear</span>
        </div>
        <h2 className="text-xl font-bold mt-3 mb-1" style={{ color: "var(--foreground)" }}>
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
          {mode === "signin"
            ? "Sign in to your Medipear account"
            : "Join the Medipear community today"}
        </p>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border text-sm font-medium hover:bg-white/5 transition-colors mb-4"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--muted)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Form */}
        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="flex flex-col gap-3">
          {mode === "signup" && (
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
                onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          )}

          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
              onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm outline-none transition-colors"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
              onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
              style={{ color: "var(--muted)" }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {mode === "signup" && (
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
                onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          )}

          {error && (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{ color: "#f87171", background: "rgba(248,113,113,0.1)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 mt-1"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </span>
            ) : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-xs text-center mt-4" style={{ color: "var(--muted)" }}>
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => switchMode("signup")}
                className="font-medium hover:opacity-80 transition-opacity"
                style={{ color: "#a78bfa" }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => switchMode("signin")}
                className="font-medium hover:opacity-80 transition-opacity"
                style={{ color: "#a78bfa" }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
