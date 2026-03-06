"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import EditProfileModal from "./EditProfileModal";

export default function EditProfileButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium border hover:bg-white/5 transition-all"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
        <Pencil size={13} />
        Edit Profile
      </button>
      <EditProfileModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
