"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { listConversationsForUser } from "@/lib/api";
import type { Conversation } from "@/lib/types";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    listConversationsForUser(user.id).then((c) => {
      setConversations(c);
      setLoading(false);
    });
  }, [user]);

  const filtered = conversations.filter((c) => {
    const label = c.is_group ? c.name ?? "Group" : c.members[0]?.display_name || c.members[0]?.username || "";
    return label.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-4">
      <h1 className="font-display font-bold text-2xl mb-4">Messages</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search conversations"
        className="w-full rounded-pill border px-4 py-2.5 text-sm mb-5 bg-transparent"
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl2 bg-black/5 dark:bg-white/10 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--muted)]">
          {conversations.length === 0 ? (
            <>
              No messages yet. Visit a profile and tap <b>Message</b> to start a conversation.
            </>
          ) : (
            "No conversations match your search."
          )}
        </div>
      ) : (
        <ul className="divide-y">
          {filtered.map((c) => {
            const other = c.members[0];
            const label = c.is_group ? c.name ?? "Group chat" : other?.display_name || other?.username || "Unknown";
            const lastText = c.lastMessage?.body ?? "Say hi 👋";
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="w-full flex items-center gap-3 py-3 text-left">
                  <span className="relative shrink-0">
                    <span className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo to-violet grid place-items-center text-white font-display font-semibold overflow-hidden">
                      {other?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        label.slice(0, 1).toUpperCase()
                      )}
                    </span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between">
                      <span className="font-medium truncate">{label}</span>
                      {c.lastMessage && (
                        <span className="text-xs text-[var(--muted)] shrink-0 ml-2">
                          {timeAgo(c.lastMessage.created_at)}
                        </span>
                      )}
                    </span>
                    <span className="block text-sm truncate text-[var(--muted)]">{lastText}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
