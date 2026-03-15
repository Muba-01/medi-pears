"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import CreateCommunityModal from "./CreateCommunityModal";

interface Props {
  compact?: boolean;
}

export default function CreateCommunityButton({ compact }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {compact ? (
        <button
          onClick={() => setOpen(true)}
          title="Create Community"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium hover:bg-white/5 transition-all border"
          style={{ borderColor: "var(--border)", color: "#a78bfa" }}>
          <Plus size={11} />
          New
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
        >
          <Plus size={14} />
          Create Community
        </button>
      )}
      <CreateCommunityModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
