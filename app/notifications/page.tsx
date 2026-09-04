"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { listNotifications, markAllNotificationsRead } from "@/lib/api";
import type { NotificationRow } from "@/lib/types";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function describe(n: NotificationRow) {
  const who = n.actor?.display_name || n.actor?.username || "Someone";
  switch (n.type) {
    case "like":
      return `${who} liked your video`;
    case "comment":
      return `${who} commented on your video`;
    case "follow":
      return `${who} started following you`;
    case "friend_request":
      return `${who} sent you a friend request`;
    case "friend_accept":
      return `${who} accepted your friend request`;
    case "message":
      return `${who} sent you a message`;
    case "mention":
      return `${who} mentioned you`;
    case "call":
      return `Missed call from ${who}`;
    default:
      return `New notification from ${who}`;
  }
}

export default function NotificationsPage() {
  const { user, refreshUnreadCount } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listNotifications(user.id).then(async (data) => {
      setItems(data);
      setLoading(false);
      if (data.some((n) => !n.read)) {
        await markAllNotificationsRead(user.id);
        refreshUnreadCount();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-4">
      <h1 className="font-display font-bold text-2xl mb-4">Notifications</h1>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded-xl2 bg-black/5 dark:bg-white/10 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--muted)]">
          No notifications yet. Likes, comments, and follows will show up here.
          <div className="mt-3">
            <Link href="/" className="text-indigo font-medium">
              Explore Zeni
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((n) => (
            <li key={n.id} className="flex items-center gap-3 py-3">
              {!n.read && <span className="w-2 h-2 rounded-full bg-indigo shrink-0" />}
              <span className={`flex-1 text-sm ${n.read ? "text-[var(--muted)]" : "font-medium"}`}>{describe(n)}</span>
              <span className="text-xs text-[var(--muted)] shrink-0">{timeAgo(n.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
