"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HeartIcon, CommentIcon, ShareIcon, SaveIcon } from "@/components/icons";
import { useAuth } from "@/lib/AuthProvider";
import {
  listVideos,
  bulkVideoStats,
  setLiked,
  setSaved,
  addRepost,
  removeRepost,
  listComments,
  addComment
} from "@/lib/api";
import type { Video } from "@/lib/types";

export default function ShortsPage() {
  const { user } = useAuth();
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [liked, setLikedState] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [saved, setSavedState] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [manuallyPaused, setManuallyPaused] = useState<Record<string, boolean>>({});
  const [commentsOpenFor, setCommentsOpenFor] = useState<string | null>(null);
  const [commentList, setCommentList] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<Video | null>(null);
  const [heartBurst, setHeartBurst] = useState<{ id: string; key: number } | null>(null);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTapRef = useRef<Record<string, number>>({});
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLoading(true);
      const data = await listVideos("short", 20);
      if (!active) return;
      setShorts(data);
      const { likeCounts: lc, commentCounts: cc, likedSet, savedSet } = await bulkVideoStats(
        data.map((s) => s.id),
        user.id
      );
      if (!active) return;
      const l: Record<string, boolean> = {};
      const sv: Record<string, boolean> = {};
      data.forEach((s) => {
        l[s.id] = likedSet.has(s.id);
        sv[s.id] = savedSet.has(s.id);
      });
      setLikedState(l);
      setSavedState(sv);
      setLikeCounts(lc);
      setCommentCounts(cc);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // Only one <video> plays at a time: whichever section is most visible.
  useEffect(() => {
    if (!containerRef.current || shorts.length === 0) return;
    const sections = Array.from(containerRef.current.querySelectorAll<HTMLElement>("[data-short-id]"));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-short-id");
          if (!id) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveId(id);
            setManuallyPaused((mp) => (mp[id] ? { ...mp, [id]: false } : mp));
          } else {
            const el = videoRefs.current[id];
            el?.pause();
          }
        }
      },
      { threshold: [0, 0.6, 1] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [shorts]);

  // Drive play/pause from activeId + manual pause state.
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, el]) => {
      if (!el) return;
      if (id === activeId && !manuallyPaused[id]) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [activeId, manuallyPaused]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const doLike = useCallback(
    async (id: string, forceLikeOnly = false) => {
      if (!user) return;
      const alreadyLiked = liked[id];
      const next = forceLikeOnly ? true : !alreadyLiked;
      if (next === alreadyLiked) return;
      setLikedState((l) => ({ ...l, [id]: next }));
      setLikeCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + (next ? 1 : -1) }));
      try {
        await setLiked(id, user.id, next);
        if (next) {
          await addRepost(id, user.id);
          showToast("Liked & reposted");
        } else {
          await removeRepost(id, user.id);
        }
      } catch {
        setLikedState((l) => ({ ...l, [id]: alreadyLiked }));
        setLikeCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + (next ? -1 : 1) }));
      }
    },
    [user, liked]
  );

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

  const copyLink = async (s: Video) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/shorts?v=${s.id}` : "";
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    }
    setShareFor(null);
  };

  const shareToApps = async (s: Video) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/shorts?v=${s.id}` : "";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Zeni", text: s.caption || "Check this out on Zeni", url });
      } catch {
        /* cancelled */
      }
    } else {
      showToast("Sharing isn't supported on this browser");
    }
    setShareFor(null);
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

  // Single tap toggles play/pause; double tap (within 300ms) likes the video.
  const handleTap = (id: string) => {
    const now = Date.now();
    const last = lastTapRef.current[id] ?? 0;
    const delta = now - last;
    lastTapRef.current[id] = now;

    if (delta < 300) {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      setHeartBurst({ id, key: now });
      setTimeout(() => setHeartBurst((h) => (h?.key === now ? null : h)), 700);
      doLike(id, true);
    } else {
      tapTimerRef.current = setTimeout(() => {
        setManuallyPaused((mp) => ({ ...mp, [id]: !mp[id] }));
        tapTimerRef.current = null;
      }, 300);
    }
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
      <div ref={containerRef} className="h-full w-full flex flex-col snap-y snap-mandatory overflow-y-auto rail">
        {shorts.map((s) => (
          <section
            key={s.id}
            data-short-id={s.id}
            className="relative h-full w-full shrink-0 snap-start grid place-items-center"
            onClick={() => handleTap(s.id)}
          >
            {s.video_url ? (
              <video
                ref={(el) => {
                  videoRefs.current[s.id] = el;
                }}
                src={s.video_url}
                poster={s.thumbnail_url ?? undefined}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-violet/60 via-ink to-indigo/50" />
            )}

            {manuallyPaused[s.id] && activeId === s.id && (
              <span className="absolute grid place-items-center w-16 h-16 rounded-full bg-black/40 pointer-events-none">
                <span className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-white ml-1" />
              </span>
            )}

            {heartBurst?.id === s.id && (
              <span
                key={heartBurst.key}
                className="absolute pointer-events-none text-white animate-pop"
                style={{ fontSize: "5rem" }}
              >
                <HeartIcon width={80} height={80} fill="currentColor" />
              </span>
            )}

            <div className="absolute top-0 inset-x-0 flex items-center justify-center gap-6 pt-[max(1rem,env(safe-area-inset-top))] text-sm font-medium">
              <span className="text-white/60">Following</span>
              <span className="border-b-2 border-white pb-1">For you</span>
            </div>

            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5" onClick={(e) => e.stopPropagation()}>
              <button className="flex flex-col items-center gap-1" onClick={() => doLike(s.id)} aria-pressed={!!liked[s.id]}>
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
              <button className="flex flex-col items-center gap-1" onClick={() => setShareFor(s)}>
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
              <div className="flex items-center gap-2.5 mb-2.5" onClick={(e) => e.stopPropagation()}>
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

      {shareFor && (
        <div className="absolute inset-0 z-40 bg-black/50 grid place-items-end sm:place-items-center" onClick={() => setShareFor(null)}>
          <div
            className="w-full sm:max-w-sm bg-[var(--surface)] text-[var(--fg)] rounded-t-2xl sm:rounded-xl2 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display font-semibold text-lg mb-4">Share</p>
            <button
              onClick={() => copyLink(shareFor)}
              className="w-full flex items-center gap-3 rounded-xl2 border px-4 py-3 text-sm font-medium mb-2.5"
            >
              🔗 Copy link
            </button>
            <button
              onClick={() => shareToApps(shareFor)}
              className="w-full flex items-center gap-3 rounded-xl2 border px-4 py-3 text-sm font-medium mb-2.5"
            >
              📤 Share to apps…
            </button>
            <button onClick={() => setShareFor(null)} className="w-full text-sm text-[var(--muted)] py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/90 text-ink text-sm px-4 py-2 rounded-pill shadow-deep z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
