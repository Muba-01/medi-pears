"use client";

import { useState } from "react";
import CreatePostModal from "@/components/forms/CreatePostModal";

export default function SidebarCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
<<<<<<< HEAD
        className="hover:text-purple-400 transition-colors text-left"
=======
        className="theme-hover-accent transition-colors text-left"
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
        style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
        Create a post →
      </button>
      <CreatePostModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
