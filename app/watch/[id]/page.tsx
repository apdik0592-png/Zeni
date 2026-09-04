"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import {
  isLiked,
  setLiked,
  getLikeCount,
  isSaved,
  setSaved,
  isFollowing,
  setFollowing,
  listComments,
  addComment,
  listVideos
} from "@/lib/api";
import type { Video } from "@/lib/types";

export default function WatchPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null | undefined>(undefined);
  const [liked, setLikedState] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSavedState] = useState(false);
  const [following, setFollowingState] = useState(false);
  const [comments, setCommentsState] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [related, setRelated] = useState<Video[]>([]);

  useEffect(() => {
    if (!params?.id || !user) return;
    let active = true;
    (async () => {
      const { data } = await supabase.from("videos").select("*, owner:owner_id(*)").eq("id", params.id).maybeSingle();
      if (!active) return;
      setVideo((data as unknown as Video) ?? null);
      if (data) {
        const [l, c, s, f, cm, rel] = await Promise.all([
          isLiked(data.id, user.id),
          getLikeCount(data.id),
          isSaved(data.id, user.id),
          data.owner_id !== user.id ? isFollowing(user.id, data.owner_id) : Promise.resolve(false),
          listComments(data.id),
          listVideos("long", 6)
        ]);
        if (!active) return;
        setLikedState(l);
        setLikeCount(c);
        setSavedState(s);
        setFollowingState(f);
        setCommentsState(cm);
        setRelated(rel.filter((v) => v.id !== data.id));
      }
    })();
    return () => {
      active = false;
    };
  }, [params?.id, user]);

  const toggleLike = async () => {
    if (!user || !video) return;
    const next = !liked;
    setLikedState(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await setLiked(video.id, user.id, next);
    } catch {
      setLikedState(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  };

  const toggleSave = async () => {
    if (!user || !video) return;
    const next = !saved;
    setSavedState(next);
    try {
      await setSaved(video.id, user.id, next);
    } catch {
      setSavedState(!next);
    }
  };

  const toggleFollow = async () => {
    if (!user || !video) return;
    const next = !following;
    setFollowingState(next);
    try {
      await setFollowing(user.id, video.owner_id, next);
    } catch {
      setFollowingState(!next);
    }
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: video?.title ?? "Zeni", url });
        return;
      } catch {
        /* cancelled */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) await navigator.clipboard.writeText(url);
  };

  const submitComment = async () => {
    if (!user || !video || !commentText.trim()) return;
    const body = commentText.trim();
    setCommentText("");
    const c = await addComment(video.id, user.id, body);
    setCommentsState((list) => [...list, c]);
  };

  if (video === undefined) {
    return <div className="max-w-4xl mx-auto px-4 md:px-6 pt-10 text-sm text-[var(--muted)]">Loading…</div>;
  }

  if (video === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-16 text-center">
        <p className="font-display font-semibold text-lg mb-1">Video unavailable</p>
        <p className="text-sm text-[var(--muted)]">This video may have been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4 pb-10">
      <div className="aspect-video rounded-xl2 overflow-hidden bg-black mb-4">
        {video.video_url ? (
          <video src={video.video_url} poster={video.thumbnail_url ?? undefined} controls className="w-full h-full" />
        ) : (
          <div className="w-full h-full grid place-items-center text-white/60 text-sm">No video file</div>
        )}
      </div>

      <h1 className="font-display font-bold text-lg mb-2">{video.title || "Untitled"}</h1>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <Link href={`/profile/${video.owner?.username}`} className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo to-violet grid place-items-center text-white text-sm font-semibold overflow-hidden">
            {video.owner?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={video.owner.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (video.owner?.display_name || video.owner?.username || "Z").slice(0, 1).toUpperCase()
            )}
          </span>
          <span className="text-sm font-medium">{video.owner?.display_name || video.owner?.username}</span>
        </Link>
        {video.owner_id !== user?.id && (
          <button
            onClick={toggleFollow}
            className={`text-sm font-medium rounded-pill px-4 py-1.5 ${following ? "border" : "bg-indigo text-white"}`}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={toggleLike}
            className={`text-sm font-medium rounded-pill border px-3.5 py-1.5 ${liked ? "text-indigo border-indigo" : ""}`}
          >
            ♥ {likeCount}
          </button>
          <button onClick={share} className="text-sm font-medium rounded-pill border px-3.5 py-1.5">
            Share
          </button>
          <button
            onClick={toggleSave}
            className={`text-sm font-medium rounded-pill border px-3.5 py-1.5 ${saved ? "text-indigo border-indigo" : ""}`}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {video.caption && (
        <div className="rounded-xl2 bg-[var(--surface-soft)]/40 border p-3.5 text-sm mb-6">{video.caption}</div>
      )}

      <div className="mb-8">
        <h2 className="font-display font-semibold mb-3">{comments.length} Comments</h2>
        <div className="flex items-center gap-2 mb-4">
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
        <div className="space-y-3">
          {comments.map((c: any) => (
            <div key={c.id} className="text-sm">
              <span className="font-medium">@{c.author?.username ?? "user"}</span> <span>{c.body}</span>
            </div>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="font-display font-semibold mb-3">Related videos</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map((v) => (
              <Link href={`/watch/${v.id}`} key={v.id} className="block">
                <div className="aspect-video rounded-xl2 overflow-hidden bg-gradient-to-br from-slate/40 to-indigo/40 mb-2">
                  {v.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="font-medium text-sm line-clamp-2">{v.title}</p>
                <p className="text-xs text-[var(--muted)]">{v.owner?.display_name || v.owner?.username}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
