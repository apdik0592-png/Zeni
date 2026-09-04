"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { searchProfiles, searchVideos } from "@/lib/api";
import type { Profile, Video } from "@/lib/types";

type Category = "all" | "users" | "shorts" | "videos";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("zeni-search-history") || "[]");
      if (Array.isArray(stored)) setHistory(stored);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setProfiles([]);
      setShorts([]);
      setVideos([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const [p, s, v] = await Promise.all([searchProfiles(term), searchVideos(term, "short"), searchVideos(term, "long")]);
      setProfiles(p);
      setShorts(s);
      setVideos(v);
      setLoading(false);
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  const commitHistory = (term: string) => {
    if (!term.trim()) return;
    const next = [term, ...history.filter((h) => h !== term)].slice(0, 8);
    setHistory(next);
    localStorage.setItem("zeni-search-history", JSON.stringify(next));
  };

  const hasResults = profiles.length > 0 || shorts.length > 0 || videos.length > 0;
  const showUsers = category === "all" || category === "users";
  const showShorts = category === "all" || category === "shorts";
  const showVideos = category === "all" || category === "videos";

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commitHistory(query)}
        placeholder="Search Zeni"
        autoFocus
        className="w-full rounded-pill border px-4 py-2.5 text-sm mb-5 bg-transparent"
      />

      <div className="flex gap-5 border-b mb-5 text-sm">
        {([
          ["all", "All"],
          ["users", "Users"],
          ["shorts", "Shorts"],
          ["videos", "Videos"]
        ] as [Category, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`pb-3 -mb-px border-b-2 ${
              category === key ? "border-indigo font-semibold" : "border-transparent text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!query.trim() ? (
        <>
          {history.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display font-semibold text-sm">Recent searches</h2>
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem("zeni-search-history");
                  }}
                  className="text-xs text-[var(--muted)]"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <button key={h} onClick={() => setQuery(h)} className="text-sm rounded-pill border px-3.5 py-1.5">
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-sm text-[var(--muted)]">Search for people, shorts, videos, or hashtags on Zeni.</p>
        </>
      ) : loading ? (
        <p className="text-sm text-[var(--muted)]">Searching…</p>
      ) : !hasResults ? (
        <div className="py-16 text-center text-sm text-[var(--muted)]">
          No results for &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div className="space-y-8">
          {showUsers && profiles.length > 0 && (
            <div>
              <h2 className="font-display font-semibold mb-3">Users</h2>
              <div className="space-y-3">
                {profiles.map((p) => (
                  <Link key={p.id} href={`/profile/${p.username}`} onClick={() => commitHistory(query)} className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo to-violet grid place-items-center text-white text-sm font-semibold overflow-hidden">
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (p.display_name || p.username).slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{p.display_name || p.username}</p>
                      <p className="text-xs text-[var(--muted)]">@{p.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {showShorts && shorts.length > 0 && (
            <div>
              <h2 className="font-display font-semibold mb-3">Shorts</h2>
              <div className="rail flex gap-3 overflow-x-auto -mx-1 px-1">
                {shorts.map((s) => (
                  <Link href="/shorts" key={s.id} onClick={() => commitHistory(query)} className="relative shrink-0 w-[120px] h-[190px] rounded-xl2 overflow-hidden bg-gradient-to-br from-ink via-violet/70 to-indigo/70">
                    {s.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <span className="absolute bottom-0 inset-x-0 p-2 text-white text-[0.7rem] bg-gradient-to-t from-black/70 to-transparent">
                      {s.caption || s.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {showVideos && videos.length > 0 && (
            <div>
              <h2 className="font-display font-semibold mb-3">Videos</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {videos.map((v) => (
                  <Link href={`/watch/${v.id}`} key={v.id} onClick={() => commitHistory(query)} className="block">
                    <div className="aspect-video rounded-xl2 overflow-hidden bg-gradient-to-br from-slate/40 to-indigo/40 mb-2">
                      {v.thumbnail_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{v.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
