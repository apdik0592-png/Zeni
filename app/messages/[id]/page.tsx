"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { listMessages, sendMessage } from "@/lib/api";
import type { MessageRow, Profile } from "@/lib/types";

export default function ChatThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [otherMember, setOtherMember] = useState<Profile | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!params?.id || !user) return;
    let active = true;
    (async () => {
      const [msgs, membersRes] = await Promise.all([
        listMessages(params.id),
        supabase.from("conversation_members").select("profile:user_id(*)").eq("conversation_id", params.id).neq("user_id", user.id)
      ]);
      if (!active) return;
      setMessages(msgs);
      const m = (membersRes.data ?? [])[0] as unknown as { profile: Profile } | undefined;
      setOtherMember(m?.profile ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [params?.id, user]);

  useEffect(() => {
    if (!params?.id) return;
    const channel = supabase
      .channel(`messages:${params.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${params.id}` },
        (payload) => {
          setMessages((prev) => (prev.some((m) => m.id === (payload.new as MessageRow).id) ? prev : [...prev, payload.new as MessageRow]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [params?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!user || !params?.id || !text.trim() || sending) return;
    const body = text.trim();
    setText("");
    setSending(true);
    try {
      const msg = await sendMessage(params.id, user.id, body);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } finally {
      setSending(false);
    }
  };

  const label = otherMember?.display_name || otherMember?.username || "Conversation";

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-0px)]">
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b sticky top-0 bg-[var(--surface)] z-10">
        <button onClick={() => router.push("/messages")} aria-label="Back" className="text-lg leading-none">
          ←
        </button>
        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo to-violet grid place-items-center text-white text-sm font-semibold overflow-hidden">
          {otherMember?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherMember.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            label.slice(0, 1).toUpperCase()
          )}
        </span>
        <p className="font-medium">{label}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-2">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-10">Say hi to start the conversation 👋</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? "bg-indigo text-white" : "bg-[var(--surface-soft)]/60 border"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t px-3 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message…"
          className="flex-1 rounded-pill border px-4 py-2.5 text-sm bg-transparent"
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="rounded-pill bg-indigo text-white text-sm font-medium px-4 py-2.5 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
