"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Props {
  postId: string;
  onCommentAdded?: () => void;
}

export default function CommentForm({ postId, onCommentAdded }: Props) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = isAuthenticated && content.trim().length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Failed to post comment.");
        setSubmitting(false);
        return;
      }

      setContent("");
      router.refresh();
      onCommentAdded?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <div
        className="px-5 py-4 text-sm"
        style={{ color: "var(--muted)" }}
      >
        <span>Sign in to leave a comment.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
      <textarea
        placeholder="Share your thoughts..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm leading-relaxed resize-none focus:border-purple-500 transition-colors"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
      />
      {error && (
        <p className="text-xs px-1" style={{ color: "#f87171" }}>{error}</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all",
            canSubmit ? "hover:opacity-90 active:scale-95" : "opacity-40 cursor-not-allowed"
          )}
          style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
        >
          {submitting ? (
            <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <Send size={13} />
              Comment
            </>
          )}
        </button>
      </div>
    </form>
  );
}
