"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import CreatePostForm from "./CreatePostForm";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCommunity?: string;
}

export default function CreatePostModal({ isOpen, onClose, defaultCommunity }: CreatePostModalProps) {
  const [mounted, setMounted] = useState(false);

  // Wait for client mount before using document
  useEffect(() => { setMounted(true); }, []);

  // ESC to close + lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {/* Inner panel — stop clicks bubbling to backdrop */}
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
            Create a Post
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: "var(--muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form body */}
        <div className="p-5">
          <CreatePostForm onSuccess={onClose} onCancel={onClose} defaultCommunity={defaultCommunity} />
        </div>
      </div>
    </div>,
    document.body
  );
}
