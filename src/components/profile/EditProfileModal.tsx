"use client";

import { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { X, Loader2, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { username: currentUsername, refreshProfile } = useAuth();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current profile data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(false);
    // Pre-fill from context
    setUsername(currentUsername ?? "");
    // Fetch bio from /api/auth/me
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.bio !== undefined) setBio(d.bio ?? "");
      })
      .catch(() => {});
  }, [isOpen, currentUsername]);

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
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() || undefined, bio: bio.trim() || undefined }),
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
    } catch {
      setError("Network error. Please try again.");
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
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
