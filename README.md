# Zeni

A Next.js 14 (App Router) + Tailwind PWA — Zeni, a premium Gen-Z social platform
combining short/long video, messaging, calling, and offline support.

## Latest update

- **Sound on by default** — the mute button is gone; shorts now autoplay with
  sound like every other short-video app.
- **Fixed the "two videos playing at once" bug** — Shorts now uses an
  IntersectionObserver so only the short actually on screen ever plays; every
  other one is paused, even mid-scroll.
- **Real upload progress (1–100%)** — the publish step now shows a live
  progress bar driven by the actual upload, not a spinner.
- **Settings page with Light / Dark / System mode**, linked from Profile
  (⚙️ icon next to your name).
- **Offline playback** — the service worker now caches videos/thumbnails/
  avatars the first time they're viewed, so previously-opened shorts and
  videos keep playing with no connection.
- **Shorts gestures**: single tap pauses/resumes the video; double tap likes
  it with a heart animation (TikTok-style).
- **Repost**: liking a video now also reposts it to your profile in the same
  action.
- **Share sheet**: the Share button now opens a small sheet with an explicit
  "Copy link" option and a "Share to apps…" option (native share sheet).
- **Auto-thumbnail**: if you don't pick a thumbnail while publishing, Zeni
  grabs a frame from the video itself (1s in, or the 1-minute mark for longer
  videos, or near the end for very short clips).
- **Lighter startup**: the Shorts feed used to run ~80 database queries just
  to open (checking like/save/comment state one video at a time). It now
  batches all of that into 4 queries total, and profile+notification loading
  runs in parallel — the app opens noticeably faster.

## Database change for this update

A new `reposts` table was added (for the repost-on-like feature). If you're
running your own Supabase project from scratch, `supabase/schema.sql` already
includes it. If you applied the schema earlier, run this once in the SQL
Editor:

```sql
create table if not exists reposts (
  video_id uuid references videos(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (video_id, user_id)
);

alter table reposts enable row level security;

create policy "Reposts are viewable by everyone" on reposts for select using (true);
create policy "Users manage their own reposts" on reposts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Still stubbed (needs more backend work later)

Real WebRTC voice/video calling is not wired yet — everything else in the
product spec (auth, profiles, follow, likes, comments, saves, reposts,
messaging, notifications, search, upload, offline playback) is live against
Supabase.

---

## 1. Connect Supabase

1. Create a project at supabase.com (or use an existing one).
2. In the SQL editor, run the entire contents of `supabase/schema.sql`.
3. In Project Settings → API, copy your **Project URL** and **anon public key**.
4. Copy `.env.example` to `.env.local` and fill in both values for local dev.

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 2. Run locally (optional)

```bash
npm install
npm run dev
```

## 3. Deploy (Netlify or Vercel)

Push to GitHub, import the repo on Netlify or Vercel, add the two
`NEXT_PUBLIC_SUPABASE_*` environment variables from step 1, and deploy.
Update Supabase → Authentication → URL Configuration (Site URL + Redirect
URLs) to match your deployed domain.
