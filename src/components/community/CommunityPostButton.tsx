"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import CreatePostModal from "@/components/forms/CreatePostModal";

export default function CommunityPostButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
<<<<<<< HEAD
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-white/5 transition-all"
=======
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border theme-hover-surface transition-all"
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
      >
        <Plus size={14} />
        Post
      </button>
      <CreatePostModal
        isOpen={open}
        onClose={() => setOpen(false)}
        defaultCommunity={slug}
      />
    </>
  );
}
