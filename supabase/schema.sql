-- Zeni schema. Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: everything uses "if not exists" / "or replace".

-- ============================================================
-- CORE TABLES
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  kind text check (kind in ('short','long')) not null,
  title text,
  caption text,
  video_url text,
  thumbnail_url text,
  duration_seconds int,
  visibility text check (visibility in ('public','friends','private')) default 'public',
  created_at timestamptz default now()
);

create table if not exists likes (
  video_id uuid references videos(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (video_id, user_id)
);

create table if not exists saves (
  video_id uuid references videos(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (video_id, user_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean default false,
  name text,
  created_at timestamptz default now()
);

create table if not exists conversation_members (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text,
  media_url text,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,       -- recipient
  actor_id uuid references profiles(id) on delete set null,     -- who triggered it
  type text check (type in ('like','comment','follow','friend_request','friend_accept','message','mention','call')) not null,
  entity_id uuid,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- AUTO-CREATE A PROFILE WHEN SOMEONE SIGNS UP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  if base_username is null or base_username = '' then
    base_username := 'zeni';
  end if;
  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (new.id, candidate, initcap(base_username))
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- AUTO-CREATE NOTIFICATIONS
-- ============================================================

create or replace function public.notify_on_follow()
returns trigger as $$
begin
  insert into public.notifications (user_id, actor_id, type, entity_id)
  values (new.following_id, new.follower_id, 'follow', new.follower_id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_follow_created on follows;
create trigger on_follow_created
  after insert on follows
  for each row execute procedure public.notify_on_follow();

create or replace function public.notify_on_like()
returns trigger as $$
declare
  video_owner uuid;
begin
  select owner_id into video_owner from public.videos where id = new.video_id;
  if video_owner is not null and video_owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (video_owner, new.user_id, 'like', new.video_id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_like_created on likes;
create trigger on_like_created
  after insert on likes
  for each row execute procedure public.notify_on_like();

create or replace function public.notify_on_comment()
returns trigger as $$
declare
  video_owner uuid;
begin
  select owner_id into video_owner from public.videos where id = new.video_id;
  if video_owner is not null and video_owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (video_owner, new.user_id, 'comment', new.video_id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_comment_created on comments;
create trigger on_comment_created
  after insert on comments
  for each row execute procedure public.notify_on_comment();

create or replace function public.notify_on_message()
returns trigger as $$
declare
  recipient uuid;
begin
  for recipient in
    select user_id from public.conversation_members
    where conversation_id = new.conversation_id and user_id <> new.sender_id
  loop
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (recipient, new.sender_id, 'message', new.conversation_id);
  end loop;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_message_created on messages;
create trigger on_message_created
  after insert on messages
  for each row execute procedure public.notify_on_message();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table videos enable row level security;
alter table likes enable row level security;
alter table saves enable row level security;
alter table comments enable row level security;
alter table follows enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

drop policy if exists "Profiles are viewable by everyone" on profiles;
create policy "Profiles are viewable by everyone" on profiles for select using (true);
drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

drop policy if exists "Public videos are viewable by everyone" on videos;
create policy "Public videos are viewable by everyone" on videos for select using (visibility = 'public' or auth.uid() = owner_id);
drop policy if exists "Owners manage their own videos" on videos;
create policy "Owners manage their own videos" on videos for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "Likes are viewable by everyone" on likes;
create policy "Likes are viewable by everyone" on likes for select using (true);
drop policy if exists "Users manage their own likes" on likes;
create policy "Users manage their own likes" on likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their own saves" on saves;
create policy "Users manage their own saves" on saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Comments are viewable by everyone" on comments;
create policy "Comments are viewable by everyone" on comments for select using (true);
drop policy if exists "Users manage their own comments" on comments;
create policy "Users manage their own comments" on comments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Follows are viewable by everyone" on follows;
create policy "Follows are viewable by everyone" on follows for select using (true);
drop policy if exists "Users manage their own follows" on follows;
create policy "Users manage their own follows" on follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

drop policy if exists "Members can read their conversations" on conversations;
create policy "Members can read their conversations" on conversations for select
  using (exists (
    select 1 from conversation_members cm
    where cm.conversation_id = conversations.id and cm.user_id = auth.uid()
  ));
drop policy if exists "Users can create conversations" on conversations;
create policy "Users can create conversations" on conversations for insert with check (auth.uid() is not null);

drop policy if exists "Members can read membership" on conversation_members;
create policy "Members can read membership" on conversation_members for select
  using (exists (
    select 1 from conversation_members cm2
    where cm2.conversation_id = conversation_members.conversation_id and cm2.user_id = auth.uid()
  ));
drop policy if exists "Users can add members to their own conversations" on conversation_members;
create policy "Users can add members to their own conversations" on conversation_members for insert
  with check (auth.uid() is not null);

drop policy if exists "Members can read their conversations" on messages;
drop policy if exists "Members can read messages" on messages;
create policy "Members can read messages" on messages for select
  using (exists (
    select 1 from conversation_members cm
    where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
  ));
drop policy if exists "Members can send messages" on messages;
create policy "Members can send messages" on messages for insert
  with check (auth.uid() = sender_id and exists (
    select 1 from conversation_members cm
    where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
  ));

drop policy if exists "Users read their own notifications" on notifications;
create policy "Users read their own notifications" on notifications for select using (auth.uid() = user_id);
drop policy if exists "Users update their own notifications" on notifications;
create policy "Users update their own notifications" on notifications for update using (auth.uid() = user_id);
drop policy if exists "System can insert notifications" on notifications;
create policy "System can insert notifications" on notifications for insert with check (true);

-- ============================================================
-- REALTIME (for live chat)
-- ============================================================

alter publication supabase_realtime add table messages;

-- ============================================================
-- STORAGE BUCKET for videos, thumbnails, avatars
-- ============================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Media is publicly readable" on storage.objects;
create policy "Media is publicly readable" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "Authenticated users can upload media" on storage.objects;
create policy "Authenticated users can upload media" on storage.objects
  for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "Users can update their own media" on storage.objects;
create policy "Users can update their own media" on storage.objects
  for update using (bucket_id = 'media' and owner = auth.uid());

drop policy if exists "Users can delete their own media" on storage.objects;
create policy "Users can delete their own media" on storage.objects
  for delete using (bucket_id = 'media' and owner = auth.uid());
