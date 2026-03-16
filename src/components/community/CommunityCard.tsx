"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, FileText, ChevronRight } from "lucide-react";
import { Community } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface CommunityCardProps {
  community: Community;
}

export default function CommunityCard({ community }: CommunityCardProps) {
  const [joined, setJoined] = useState(community.isJoined ?? false);

  return (
<<<<<<< HEAD
    <div className="rounded-xl border overflow-hidden hover:border-purple-500/40 transition-all group"
=======
    <div className="rounded-xl border overflow-hidden transition-all group"
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {/* Banner */}
      <div className="h-12 flex items-center px-4 gap-3"
        style={{ background: community.banner }}>
        <span className="text-2xl">{community.icon}</span>
        <div>
<<<<<<< HEAD
          <h3 className="text-sm font-bold text-white">🍐/{community.slug}</h3>
          <p className="text-xs text-white/70">{community.name}</p>
=======
          <h3 className="text-sm font-bold" style={{ color: "var(--text-on-banner)" }}>🍐/{community.slug}</h3>
          <p className="text-xs" style={{ color: "var(--text-on-banner-muted)" }}>{community.name}</p>
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm leading-relaxed mb-3 line-clamp-2"
          style={{ color: "var(--muted)" }}>
          {community.description}
        </p>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
            <Users size={12} />
            {formatNumber(community.memberCount)} members
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
            <FileText size={12} />
            {formatNumber(community.postCount)} posts
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setJoined(!joined)}
            className="flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all"
            style={
              joined
                ? { background: "var(--surface-2)", color: "var(--muted)", border: "1px solid var(--border)" }
<<<<<<< HEAD
                : { background: "var(--accent)", color: "#fff" }
=======
                : { background: "var(--accent)", color: "var(--text-on-accent)" }
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
            }>
            {joined ? "Joined" : "Join"}
          </button>
          <Link
            href={`/p/${community.slug}`}
<<<<<<< HEAD
            className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-white/5 transition-colors"
=======
            className="w-8 h-8 flex items-center justify-center rounded-lg border theme-hover-surface transition-colors"
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
            style={{ borderColor: "var(--border)" }}>
            <ChevronRight size={14} style={{ color: "var(--muted)" }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
