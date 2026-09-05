"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import {
  getFollowCounts,
  listUserVideos,
  listSavedVideos,
  updateProfile,
  uploadMediaFile
} from "@/lib/api";
import type { Video } from "@/lib/types";

type Tab = "shorts" | "videos" | "saved";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [tab, setTab] = useState<Tab>("shorts");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", display_name: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({ username: profile.username, display_name: profile.display_name ?? "", bio: profile.bio ?? "" });
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    getFollowCounts(user.id).then(setCounts);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    (async () => {
      const data =
        tab === "saved"
          ? await listSavedVideos(user.id)
          : await listUserVideos(user.id, tab === "shorts" ? "short" : "long");
      if (active) {
        setVideos(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, tab]);

  const saveEdit = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      await updateProfile(user.id, {
        username: form.username.trim(),
        display_name: form.display_name.trim() || null,
        bio: form.bio.trim() || null
      });
      await refreshProfile();
      setEditing(false);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const url = await uploadMediaFile(file, user.id, "avatars");
      await updateProfile(user.id, { avatar_url: url });
      await refreshProfile();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const shareProfile = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/profile/${profile?.username}` : "";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Zeni", url });
        return;
      } catch {
        /* cancelled */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-10 text-sm text-[var(--muted)]">Loading your profile…</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6">
      <div className="flex items-start gap-5 mb-5">
        <div className="relative shrink-0">
          <span className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo to-violet grid place-items-center text-white text-2xl font-display font-semibold overflow-hidden">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (profile.display_name || profile.username).slice(0, 1).toUpperCase()
            )}
          </span>
          <label className="absolute -bottom-1 -right-1 grid place-items-center w-7 h-7 rounded-full bg-indigo text-white text-xs cursor-pointer">
            {avatarUploading ? "…" : "+"}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-display font-bold text-xl">{profile.display_name || profile.username}</h1>
            <Link href="/settings" aria-label="Settings" className="text-lg leading-none shrink-0">
              ⚙️
            </Link>
          </div>
          <p className="text-sm text-[var(--muted)] mb-2">@{profile.username}</p>
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

      {profile.bio && <p className="text-sm mb-4">{profile.bio}</p>}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setEditing(true)}
          className="flex-1 rounded-pill bg-indigo text-white text-sm font-medium py-2.5"
        >
          Edit profile
        </button>
        <button onClick={shareProfile} className="flex-1 rounded-pill border text-sm font-medium py-2.5">
          Share profile
        </button>
      </div>

      <div className="flex gap-6 border-b mb-4 text-sm">
        {([
          ["shorts", "Shorts"],
          ["videos", "Videos"],
          ["saved", "Saved"]
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
        <div className="py-12 text-center text-sm text-[var(--muted)]">
          {tab === "saved" ? "Nothing saved yet." : `No ${tab} yet.`}{" "}
          {tab !== "saved" && (
            <Link href="/create" className="text-indigo font-medium">
              Create one
            </Link>
          )}
        </div>
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

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/40 px-0 sm:px-4">
          <div className="w-full sm:max-w-sm bg-[var(--surface)] rounded-t-2xl sm:rounded-xl2 p-5">
            <h2 className="font-display font-semibold text-lg mb-4">Edit profile</h2>

            <label className="block text-sm font-medium mb-1.5">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="w-full rounded-xl2 border px-3.5 py-2.5 mb-3 text-sm bg-transparent"
            />

            <label className="block text-sm font-medium mb-1.5">Display name</label>
            <input
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              className="w-full rounded-xl2 border px-3.5 py-2.5 mb-3 text-sm bg-transparent"
            />

            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="w-full rounded-xl2 border px-3.5 py-2.5 mb-3 text-sm bg-transparent"
            />

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 rounded-pill border text-sm font-medium py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 rounded-pill bg-indigo text-white text-sm font-medium py-2.5 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
