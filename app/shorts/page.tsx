"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HeartIcon, CommentIcon, ShareIcon, SaveIcon, MuteIcon } from "@/components/icons";
import { useAuth } from "@/lib/AuthProvider";
import {
  listVideos,
  isLiked,
  setLiked,
  getLikeCount,
  isSaved,
  setSaved,
  getCommentCount,
  listComments,
  addComment
} from "@/lib/api";
import type { Video } from "@/lib/types";

export default function ShortsPage() {
  const { user } = useAuth();
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [liked, setLikedState] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [saved, setSavedState] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [muted, setMuted] = useState(true);
  const [commentsOpenFor, setCommentsOpenFor] = useState<string | null>(null);
  const [commentList, setCommentList] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLoading(true);
      const data = await listVideos("short", 20);
      if (!active) return;
      setShorts(data);
      const [likedStates, counts, savedStates, cCounts] = await Promise.all([
        Promise.all(data.map((s) => isLiked(s.id, user.id))),
        Promise.all(data.map((s) => getLikeCount(s.id))),
        Promise.all(data.map((s) => isSaved(s.id, user.id))),
        Promise.all(data.map((s) => getCommentCount(s.id)))
      ]);
      if (!active) return;
      const l: Record<string, boolean> = {};
      const lc: Record<string, number> = {};
      const sv: Record<string, boolean> = {};
      const cc: Record<string, number> = {};
      data.forEach((s, i) => {
        l[s.id] = likedStates[i];
        lc[s.id] = counts[i];
        sv[s.id] = savedStates[i];
        cc[s.id] = cCounts[i];
      });
      setLikedState(l);
      setLikeCounts(lc);
      setSavedState(sv);
      setCommentCounts(cc);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const current = shorts[index];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const toggleLike = async (id: string) => {
    if (!user) return;
    const next = !liked[id];
    setLikedState((l) => ({ ...l, [id]: next }));
    setLikeCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + (next ? 1 : -1) }));
    try {
      await setLiked(id, user.id, next);
    } catch {
      setLikedState((l) => ({ ...l, [id]: !next }));
      setLikeCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + (next ? -1 : 1) }));
    }
  };

  const toggleSave = async (id: string) => {
    if (!user) return;
    const next = !saved[id];
    setSavedState((s) => ({ ...s, [id]: next }));
    try {
      await setSaved(id, user.id, next);
      showToast(next ? "Saved" : "Removed from saved");
    } catch {
      setSavedState((s) => ({ ...s, [id]: !next }));
    }
  };

  const share = async (s: Video) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/shorts?v=${s.id}` : "";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Zeni", text: s.caption || "Check this out on Zeni", url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    }
  };

  const openComments = async (id: string) => {
    setCommentsOpenFor(id);
    const c = await listComments(id);
    setCommentList(c);
  };

  const submitComment = async () => {
    if (!user || !commentsOpenFor || !commentText.trim()) return;
    const body = commentText.trim();
    setCommentText("");
    const c = await addComment(commentsOpenFor, user.id, body);
    setCommentList((list) => [...list, c]);
    setCommentCounts((cc) => ({ ...cc, [commentsOpenFor]: (cc[commentsOpenFor] ?? 0) + 1 }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black grid place-items-center">
        <span className="w-8 h-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black text-white grid place-items-center px-6 text-center">
        <div>
          <p className="font-display font-semibold text-lg mb-2">No shorts yet</p>
          <p className="text-white/70 text-sm mb-5">Be the first to post a short on Zeni.</p>
          <Link href="/create" className="inline-block rounded-pill bg-indigo px-5 py-2.5 text-sm font-medium">
            Create a short
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      <div
        className="h-full w-full flex flex-col snap-y snap-mandatory overflow-y-auto rail"
        onScroll={(e) => {
          const h = e.currentTarget.clientHeight;
          const i = Math.round(e.currentTarget.scrollTop / h);
          if (i !== index) setIndex(i);
        }}
      >
        {shorts.map((s) => (
          <section key={s.id} className="relative h-full w-full shrink-0 snap-start grid place-items-center">
            {s.video_url ? (
              <video
                src={s.video_url}
                poster={s.thumbnail_url ?? undefined}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay={current?.id === s.id}
                loop
                muted={muted}
                playsInline
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-violet/60 via-ink to-indigo/50" />
            )}

            <div className="absolute top-0 inset-x-0 flex items-center justify-center gap-6 pt-[max(1rem,env(safe-area-inset-top))] text-sm font-medium">
              <span className="text-white/60">Following</span>
              <span className="border-b-2 border-white pb-1">For you</span>
            </div>

            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
              <button className="flex flex-col items-center gap-1" onClick={() => toggleLike(s.id)} aria-pressed={!!liked[s.id]}>
                <span className={`grid place-items-center w-11 h-11 rounded-full bg-white/10 backdrop-blur ${liked[s.id] ? "animate-pop text-blush" : ""}`}>
                  <HeartIcon fill={liked[s.id] ? "currentColor" : "none"} />
                </span>
                <span className="text-xs">{likeCounts[s.id] ?? 0}</span>
              </button>
              <button className="flex flex-col items-center gap-1" onClick={() => openComments(s.id)}>
                <span className="grid place-items-center w-11 h-11 rounded-full bg-white/10 backdrop-blur">
                  <CommentIcon />
                </span>
                <span className="text-xs">{commentCounts[s.id] ?? 0}</span>
              </button>
              <button className="flex flex-col items-center gap-1" onClick={() => share(s)}>
                <span className="grid place-items-center w-11 h-11 rounded-full bg-white/10 backdrop-blur">
                  <ShareIcon />
                </span>
                <span className="text-xs">Share</span>
              </button>
              <button className="flex flex-col items-center gap-1" onClick={() => toggleSave(s.id)} aria-pressed={!!saved[s.id]}>
                <span className={`grid place-items-center w-11 h-11 rounded-full bg-white/10 backdrop-blur ${saved[s.id] ? "text-blush" : ""}`}>
                  <SaveIcon fill={saved[s.id] ? "currentColor" : "none"} />
                </span>
                <span className="text-xs">{saved[s.id] ? "Saved" : "Save"}</span>
              </button>
            </div>

            <div className="absolute left-0 right-16 bottom-6 px-4">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Link href={`/profile/${s.owner?.username}`} className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo to-violet grid place-items-center font-display font-semibold overflow-hidden">
                  {s.owner?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.owner.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (s.owner?.display_name || s.owner?.username || "Z").slice(0, 1).toUpperCase()
                  )}
                </Link>
                <Link href={`/profile/${s.owner?.username}`} className="font-medium">
                  @{s.owner?.username ?? "zeni"}
                </Link>
              </div>
              {s.caption && <p className="text-[0.95rem] leading-snug mb-1.5">{s.caption}</p>}
            </div>

            <button
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute" : "Mute"}
              className="absolute top-16 right-4 grid place-items-center w-9 h-9 rounded-full bg-white/10 backdrop-blur"
            >
              <MuteIcon />
            </button>
          </section>
        ))}
      </div>

      {commentsOpenFor && (
        <div className="absolute inset-x-0 bottom-0 max-h-[65%] bg-[var(--surface)] text-[var(--fg)] rounded-t-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="font-display font-semibold">Comments</p>
            <button onClick={() => setCommentsOpenFor(null)} className="text-sm text-[var(--muted)]">
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {commentList.length === 0 && <p className="text-sm text-[var(--muted)]">No comments yet.</p>}
            {commentList.map((c: any) => (
              <div key={c.id} className="text-sm">
                <span className="font-medium">@{c.author?.username ?? "user"}</span>{" "}
                <span>{c.body}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t px-3 py-2.5">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment"
              className="flex-1 rounded-pill border px-3.5 py-2 text-sm bg-transparent"
            />
            <button onClick={submitComment} className="text-sm font-semibold text-indigo px-2">
              Post
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/90 text-ink text-sm px-4 py-2 rounded-pill shadow-deep">
          {toast}
        </div>
      )}
    </div>
  );
}
