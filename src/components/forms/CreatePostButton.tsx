"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function CreatePostButton() {
  return (
    <Link
      href="/create"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
      style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}>
      <Plus size={14} />
      Create Post
    </Link>
  );
}
