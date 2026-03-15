"use client";

import { useState, useEffect } from "react";
import { Zap, TrendingUp, LogIn } from "lucide-react";

interface RewardActivity {
  id: string;
  type: "post" | "upvote" | "comment" | "daily_login";
  amount: number;
  description: string;
  timestamp: Date;
  txHash?: string;
}

interface RewardsActivityProps {
  walletAddress?: string | null;
  limit?: number;
}

export default function RewardsActivity({ walletAddress, limit = 5 }: RewardsActivityProps) {
  const [activities, setActivities] = useState<RewardActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    const fetchActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch from MongoDB activity logs
        const response = await fetch(
          `/api/rewards/activity?walletAddress=${encodeURIComponent(walletAddress)}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch reward activities");
        }

        const data = await response.json();
        setActivities(data.activities || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load activities";
        setError(errorMessage);
        console.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Refresh activities every 10 seconds
    const interval = setInterval(fetchActivities, 10000);

    return () => clearInterval(interval);
  }, [walletAddress, limit]);

  if (!walletAddress) {
    return (
      <div className="rounded-lg border p-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <p style={{ color: "var(--muted)" }}>Sign in to view your reward activity</p>
      </div>
    );
  }

  if (loading && activities.length === 0) {
    return (
      <div className="rounded-lg border p-6 animate-pulse" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border p-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <p style={{ color: "#ef4444" }}>Error: {error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border p-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <p style={{ color: "var(--muted)" }}>No reward activity yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Zap size={18} style={{ color: "#a78bfa" }} />
          Recent Rewards
        </h3>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {activities.slice(0, limit).map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: RewardActivity }) {
  const getIcon = (type: RewardActivity["type"]) => {
    switch (type) {
      case "post":
        return <Zap size={16} style={{ color: "#fb923c" }} />;
      case "upvote":
        return <TrendingUp size={16} style={{ color: "#34d399" }} />;
      case "comment":
        return <Zap size={16} style={{ color: "#60a5fa" }} />;
      case "daily_login":
        return <LogIn size={16} style={{ color: "#a78bfa" }} />;
    }
  };

  const getLabel = (type: RewardActivity["type"]) => {
    switch (type) {
      case "post":
        return "Created Post";
      case "upvote":
        return "Content Upvoted";
      case "comment":
        return "Created Comment";
      case "daily_login":
        return "Daily Login";
    }
  };

  const timeAgo = getTimeAgo(activity.timestamp);

  return (
    <a
      href={activity.txHash ? `https://etherscan.io/tx/${activity.txHash}` : undefined}
      target={activity.txHash ? "_blank" : undefined}
      rel={activity.txHash ? "noopener noreferrer" : undefined}
      className={`p-4 flex items-center justify-between hover:${activity.txHash ? "opacity-80" : ""} transition-opacity`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getIcon(activity.type)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            {getLabel(activity.type)}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {timeAgo}
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 text-right ml-4">
        <p className="font-semibold text-sm" style={{ color: "#a78bfa" }}>
          +{activity.amount}
        </p>
      </div>
    </a>
  );
}

function getTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return `${Math.floor(seconds / 86400)}d ago`;
}
