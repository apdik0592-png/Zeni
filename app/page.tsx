"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayIcon } from "@/components/icons";
import { useAuth } from "@/lib/AuthProvider";
import {
  listVideos,
  listFollowingVideos,
  listSuggestedCreators,
  bulkFollowingSet,
  setFollowing
} from "@/lib/api";
import type { Video, Profile } from "@/lib/types";

type Tab = "forYou" | "following" | "trending";

export default function HomePage() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("forYou");
  const [loading, setLoading] = useState(true);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [longVideos, setLongVideos] = useState<Video[]>([]);
  const [creators, setCreators] = useState<Profile[]>([]);
  const [followState, setFollowState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    (async () => {
      try {
        const [s, l, c] = await Promise.all([
          tab === "following" ? listFollowingVideos(user.id, "short") : listVideos("short", 12),
          tab === "following" ? listFollowingVideos(user.id, "long") : listVideos("long", 8),
          listSuggestedCreators(user.id, 10)
        ]);
        if (!active) return;
        setShorts(tab === "trending" ? [...s].sort(() => Math.random() - 0.5) : s);
        setLongVideos(l);
        setCreators(c);

        const followingSet = await bulkFollowingSet(user.id, c.map((creator) => creator.id));
        if (!active) return;
        const map: Record<string, boolean> = {};
        c.forEach((creator) => (map[creator.id] = followingSet.has(creator.id)));
        setFollowState(map);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, tab]);

  const toggleFollow = async (creatorId: string) => {
    if (!user) return;
    const next = !followState[creatorId];
    setFollowState((f) => ({ ...f, [creatorId]: next }));
    try {
      await setFollowing(user.id, creatorId, next);
    } catch {
      setFollowState((f) => ({ ...f, [creatorId]: !next }));
    }
  };

  const initials = (name: string) => name.slice(0, 1).toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4">
      {/* Creator rail */}
      <section aria-label="Creators" className="rail flex gap-4 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {creators.map((c) => (
          <Link
            key={c.id}
            href={`/profile/${c.username}`}
            className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]"
          >
            <span className="grid place-items-center w-16 h-16 rounded-full p-[2.5px] bg-black/10 dark:bg-white/15">
              <span className="w-full h-full rounded-full bg-[var(--surface)] grid place-items-center font-display font-semibold overflow-hidden">
                {c.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials(c.display_name || c.username)
                )}
              </span>
            </span>
            <span className="text-[0.7rem] truncate w-full text-center">{c.display_name || c.username}</span>
          </Link>
        ))}
        {!loading && creators.length === 0 && (
          <p className="text-sm text-[var(--muted)] py-4">No creators to show yet.</p>
        )}
      </section>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-5 text-sm">
        {([
          ["forYou", "For you"],
          ["following", "Following"],
          ["trending", "Trending"]
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 -mb-px border-b-2 ${
              tab === key ? "border-indigo font-semibold" : "border-transparent text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Shorts preview rail */}
      <section aria-label="Shorts" className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-lg">Shorts for you</h2>
          <Link href="/shorts" className="text-sm text-indigo font-medium">
            See all
          </Link>
        </div>
        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 w-[140px] h-[220px] rounded-xl2 bg-black/5 dark:bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : shorts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            {tab === "following" ? "Follow creators to see their shorts here." : "No shorts yet — be the first to post one."}
          </p>
        ) : (
          <div className="rail flex gap-3 overflow-x-auto -mx-1 px-1">
            {shorts.map((s) => (
              <Link
                href="/shorts"
                key={s.id}
                className="relative shrink-0 w-[140px] h-[220px] rounded-xl2 overflow-hidden bg-gradient-to-br from-ink via-violet/70 to-indigo/70"
              >
                {s.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <span className="absolute top-2 right-2 grid place-items-center w-6 h-6 rounded-full bg-black/40 text-white">
                  <PlayIcon width={12} height={12} />
                </span>
                <span className="absolute bottom-0 inset-x-0 p-2.5 text-white text-xs bg-gradient-to-t from-black/70 to-transparent">
                  <span className="block font-medium truncate">{s.caption || s.title || "Untitled"}</span>
                  <span className="text-[0.65rem] opacity-80">@{s.owner?.username ?? "zeni"}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Long videos */}
      <section aria-label="Videos for you" className="mb-8">
        <h2 className="font-display font-semibold text-lg mb-3">Long videos</h2>
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="aspect-video rounded-xl2 bg-black/5 dark:bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : longVideos.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            {tab === "following" ? "Follow creators to see their videos here." : "No long videos yet."}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {longVideos.map((v) => (
              <Link href={`/watch/${v.id}`} key={v.id} className="group block">
                <div className="relative aspect-video rounded-xl2 overflow-hidden bg-gradient-to-br from-slate/40 to-indigo/40 mb-2.5">
                  {v.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  {v.duration_seconds ? (
                    <span className="absolute bottom-2 right-2 text-[0.65rem] px-1.5 py-0.5 rounded bg-black/70 text-white">
                      {Math.floor(v.duration_seconds / 60)}:{String(v.duration_seconds % 60).padStart(2, "0")}
                    </span>
                  ) : null}
                  <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="grid place-items-center w-11 h-11 rounded-full bg-white/90 text-ink">
                      <PlayIcon />
                    </span>
                  </span>
                </div>
                <h3 className="font-medium text-[0.95rem] leading-snug line-clamp-2">{v.title || "Untitled"}</h3>
                <p className="text-[0.8rem] text-[var(--muted)] mt-0.5">{v.owner?.display_name || v.owner?.username}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Popular creators */}
      <section aria-label="Popular creators" className="mb-10">
        <h2 className="font-display font-semibold text-lg mb-3">Popular creators</h2>
        {creators.length === 0 && !loading ? (
          <p className="text-sm text-[var(--muted)]">No other creators on Zeni yet — invite your friends.</p>
        ) : (
          <div className="rail flex gap-3 overflow-x-auto -mx-1 px-1">
            {creators.map((c) => (
              <div
                key={c.id}
                className="shrink-0 w-[168px] rounded-xl2 border p-4 flex flex-col items-center gap-2 bg-[var(--surface-soft)]/40"
              >
                <span className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo to-violet grid place-items-center text-white font-display font-semibold overflow-hidden">
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials(c.display_name || c.username)
                  )}
                </span>
                <div className="text-center">
                  <p className="font-medium text-sm">{c.display_name || c.username}</p>
                  <p className="text-[0.75rem] text-[var(--muted)]">@{c.username}</p>
                </div>
                <button
                  onClick={() => toggleFollow(c.id)}
                  className={`w-full mt-1 text-sm font-medium rounded-pill py-1.5 ${
                    followState[c.id] ? "border" : "bg-indigo text-white"
                  }`}
                >
                  {followState[c.id] ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
