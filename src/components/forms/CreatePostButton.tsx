"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function CreatePostButton() {
  return (
    <Link
      href="/create"
<<<<<<< HEAD
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
      style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.2)",
=======
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
      style={{
        background: "var(--soft-accent-bg)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--accent-light)",
        color: "var(--text-on-accent)",
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
      }}>
      <Plus size={14} />
      Create Post
    </Link>
  );
}
