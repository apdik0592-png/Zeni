"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import {
  fetchProfileByUsername,
  getFollowCounts,
  listUserVideos,
  isFollowing,
  setFollowing,
  getOrCreateDirectConversation
} from "@/lib/api";
import type { Profile, Video } from "@/lib/types";

type Tab = "shorts" | "videos";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [target, setTarget] = useState<Profile | null | undefined>(undefined);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [following, setFollowingState] = useState(false);
  const [tab, setTab] = useState<Tab>("shorts");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.username || !user) return;
    let active = true;
    (async () => {
      const p = await fetchProfileByUsername(params.username);
      if (!active) return;
      setTarget(p);
      if (p) {
        const [c, f] = await Promise.all([getFollowCounts(p.id), isFollowing(user.id, p.id)]);
        if (!active) return;
        setCounts(c);
        setFollowingState(f);
      }
    })();
    return () => {
      active = false;
    };
  }, [params?.username, user]);

  useEffect(() => {
    if (!target) return;
    let active = true;
    setLoading(true);
    listUserVideos(target.id, tab === "shorts" ? "short" : "long").then((v) => {
      if (active) {
        setVideos(v);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [target, tab]);

  if (user && target && target.id === user.id) {
    router.replace("/profile");
    return null;
  }

  const toggleFollow = async () => {
    if (!user || !target) return;
    const next = !following;
    setFollowingState(next);
    setCounts((c) => ({ ...c, followers: c.followers + (next ? 1 : -1) }));
    try {
      await setFollowing(user.id, target.id, next);
    } catch {
      setFollowingState(!next);
      setCounts((c) => ({ ...c, followers: c.followers + (next ? -1 : 1) }));
    }
  };

  const message = async () => {
    if (!user || !target) return;
    const id = await getOrCreateDirectConversation(user.id, target.id);
    router.push(`/messages/${id}`);
  };

  if (target === undefined) {
    return <div className="max-w-3xl mx-auto px-4 md:px-6 pt-10 text-sm text-[var(--muted)]">Loading…</div>;
  }

  if (target === null) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-16 text-center">
        <p className="font-display font-semibold text-lg mb-1">User not found</p>
        <p className="text-sm text-[var(--muted)]">@{params?.username} doesn't exist on Zeni.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6">
      <div className="flex items-start gap-5 mb-5">
        <span className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo to-violet grid place-items-center text-white text-2xl font-display font-semibold overflow-hidden shrink-0">
          {target.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={target.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            (target.display_name || target.username).slice(0, 1).toUpperCase()
          )}
        </span>
        <div className="flex-1">
          <h1 className="font-display font-bold text-xl">{target.display_name || target.username}</h1>
          <p className="text-sm text-[var(--muted)] mb-2">@{target.username}</p>
          <div className="flex gap-5 text-sm">
            <span>
              <b>{counts.following}</b> Following
            </span>
            <span>
              <b>{counts.followers}</b> Followers
            </span>
          </div>
        </div>
      </div>

      {target.bio && <p className="text-sm mb-4">{target.bio}</p>}

      <div className="flex gap-2 mb-6">
        <button
          onClick={toggleFollow}
          className={`flex-1 rounded-pill text-sm font-medium py-2.5 ${
            following ? "border" : "bg-indigo text-white"
          }`}
        >
          {following ? "Following" : "Follow"}
        </button>
        <button onClick={message} className="flex-1 rounded-pill border text-sm font-medium py-2.5">
          Message
        </button>
      </div>

      <div className="flex gap-6 border-b mb-4 text-sm">
        {([
          ["shorts", "Shorts"],
          ["videos", "Videos"]
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

      {loading ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[9/16] rounded-md bg-black/5 dark:bg-white/10 animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--muted)]">No {tab} yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {videos.map((v) => (
            <Link
              key={v.id}
              href={v.kind === "long" ? `/watch/${v.id}` : "/shorts"}
              className="relative aspect-[9/16] rounded-md overflow-hidden bg-gradient-to-br from-slate/30 to-indigo/30"
            >
              {v.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
