"use client";

import Link from "next/link";
import { SearchIcon, BellIcon, SunIcon, MoonIcon } from "./icons";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/lib/AuthProvider";

export default function TopHeader() {
  const { theme, toggle } = useTheme();
  const { profile, unreadCount } = useAuth();

  const initial = (profile?.display_name || profile?.username || "Z").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-[var(--surface)]/85 backdrop-blur px-4 py-3 md:px-6">
      <Link href="/" className="font-display font-bold text-xl tracking-tight">
        zeni
      </Link>

      <Link
        href="/search"
        className="hidden sm:flex flex-1 max-w-sm items-center gap-2 rounded-pill border px-3.5 py-2 text-sm text-[var(--muted)]"
      >
        <SearchIcon />
        <span>Search Zeni</span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/search"
          aria-label="Search"
          className="sm:hidden grid place-items-center w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <SearchIcon />
        </Link>
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="grid place-items-center w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative grid place-items-center w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <BellIcon />
          {!!unreadCount && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo" />
          )}
        </Link>
        <Link href="/profile" aria-label="Your profile">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-indigo to-violet text-white text-sm font-semibold overflow-hidden">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </span>
        </Link>
      </div>
    </header>
  );
}
