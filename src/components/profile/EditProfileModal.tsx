"use client";

import { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { X, Loader2, Check, Zap, Link2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { shortenAddress } from "@/lib/utils";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { username: currentUsername, walletAddress, googleLinked, walletLinked, provider, refreshProfile, linkWallet, linkGoogle } = useAuth();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Per-link-button state
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<"wallet" | "google" | null>(null);

  // Fetch current profile data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setOriginalAvatarUrl(null);
    // Pre-fill from context
    setUsername(currentUsername ?? "");
    // Fetch bio and avatar from /api/auth/me
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.bio !== undefined) setBio(d.bio ?? "");
        if (d.avatarUrl) {
          setAvatarPreview(d.avatarUrl);
          setOriginalAvatarUrl(d.avatarUrl);
        }
      })
      .catch(() => {});
  }, [isOpen, currentUsername]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB.');
      return;
    }

    setAvatarFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload avatar');
      }

      const data = await res.json();
      return data.avatarUrl;
    } catch (err) {
      throw err;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let avatarUrl = null;

      // Upload avatar if changed
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Update profile
      const updateData: any = {
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
      };

      // Handle avatar changes
      if (avatarUrl) {
        // New avatar uploaded
        updateData.avatarUrl = avatarUrl;
      } else if (originalAvatarUrl && !avatarPreview) {
        // Avatar was removed
        updateData.avatarUrl = "";
      }

      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }

      setSuccess(true);
      await refreshProfile();
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, background: "rgba(0,0,0,0.7)" }}
      onClick={handleClose}>
      <div
        className="w-full max-w-md rounded-2xl border p-6 flex flex-col gap-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
            Edit Profile
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: "var(--muted)" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-xl object-cover border-2"
                    style={{ borderColor: "var(--border)" }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold text-white border-2"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                      borderColor: "var(--border)",
                    }}>
                    {(username || 'U').slice(0, 2).toUpperCase()}
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="inline-block px-3 py-1.5 rounded-lg text-sm border hover:bg-white/5 transition-colors cursor-pointer"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                    Choose Image
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        setError(null);
                      }}
                      className="inline-block px-3 py-1.5 rounded-lg text-sm border hover:bg-red-500/10 transition-colors"
                      style={{ borderColor: "var(--border)", color: "#ef4444" }}>
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  JPG, PNG, GIF up to 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              maxLength={30}
              className="px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              3–30 characters. Letters, numbers, underscores, hyphens only.
            </span>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Bio
              </label>
              <span className="text-xs" style={{ color: bio.length > 280 ? "#f87171" : "var(--muted)" }}>
                {bio.length}/300
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself..."
              rows={3}
              maxLength={300}
              className="px-3 py-2 rounded-lg border text-sm leading-relaxed resize-none outline-none transition-colors"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)" }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm border hover:bg-white/5 transition-colors disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: success ? "#22c55e" : "var(--accent)" }}>
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : success ? (
                <><Check size={14} /> Saved</>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>

        {/* ───────── Connected Accounts ───────── */}
        <div className="mt-2 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Connected Accounts</h3>

          <div className="flex flex-col gap-2">
            {/* Wallet */}
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
                  <Zap size={14} style={{ color: "#a78bfa" }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Wallet</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {walletLinked && walletAddress ? shortenAddress(walletAddress) : "Not connected"}
                  </p>
                </div>
              </div>
              {walletLinked ? (
                <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
              ) : provider !== "wallet" ? (
                <button
                  onClick={async () => {
                    setLinkError(null);
                    setLinkingWallet(true);
                    try {
                      await linkWallet();
                      setLinkSuccess("wallet");
                      setTimeout(() => setLinkSuccess(null), 2500);
                    } catch (e) {
                      setLinkError(e instanceof Error ? e.message : "Failed to connect wallet");
                    } finally {
                      setLinkingWallet(false);
                    }
                  }}
                  disabled={linkingWallet || linkingGoogle}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50 flex items-center gap-1.5"
                  style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
                  {linkingWallet ? <Loader2 size={11} className="animate-spin" /> : <Link2 size={11} />}
                  {linkingWallet ? "Connecting..." : linkSuccess === "wallet" ? "Connected!" : "Connect"}
                </button>
              ) : null}
            </div>

            {/* Google */}
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(66,133,244,0.15)" }}>
                  <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.3 9 3.4l6.7-6.7C35.6 2.5 30.1 0 24 0 14.7 0 6.8 5.4 3 13.3l7.8 6C12.7 13.3 17.9 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/><path fill="#FBBC05" d="M10.8 28.7A14.4 14.4 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7L2.5 13.3A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l8.3-6z"/><path fill="#34A853" d="M24 48c6.1 0 11.2-2 14.9-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.4 2.2-6.1 0-11.3-3.8-13.2-9.2l-7.8 6C6.8 42.6 14.7 48 24 48z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Google</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {googleLinked ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              {googleLinked ? (
                <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
              ) : (
                <button
                  onClick={async () => {
                    setLinkError(null);
                    setLinkingGoogle(true);
                    try {
                      await linkGoogle();
                    } catch (e) {
                      setLinkError(e instanceof Error ? e.message : "Failed to connect Google");
                      setLinkingGoogle(false);
                    }
                    // linkGoogle triggers a redirect; loading state remains until redirect
                  }}
                  disabled={linkingWallet || linkingGoogle}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50 flex items-center gap-1.5"
                  style={{ background: "rgba(66,133,244,0.2)", color: "#60a5fa" }}>
                  {linkingGoogle ? <Loader2 size={11} className="animate-spin" /> : <Link2 size={11} />}
                  {linkingGoogle ? "Redirecting..." : "Connect"}
                </button>
              )}
            </div>
          </div>

          {linkError && (
            <p className="text-xs mt-2 px-3 py-2 rounded-lg" style={{ color: "#f87171", background: "rgba(248,113,113,0.1)" }}>
              {linkError}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
