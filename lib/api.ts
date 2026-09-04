import { supabase } from "./supabaseClient";
import type {
  Profile,
  Video,
  VideoKind,
  MessageRow,
  NotificationRow,
  Conversation,
  Visibility
} from "./types";

/* ---------------- Profiles ---------------- */

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  fields: Partial<Pick<Profile, "username" | "display_name" | "bio" | "avatar_url">>
): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").update(fields).eq("id", userId).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function listSuggestedCreators(excludeId?: string, limit = 8): Promise<Profile[]> {
  let q = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(limit);
  if (excludeId) q = q.neq("id", excludeId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getFollowCounts(profileId: string) {
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profileId),
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", profileId)
  ]);
  if (followers.error) throw followers.error;
  if (following.error) throw following.error;
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

/* ---------------- Follows ---------------- */

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function setFollowing(followerId: string, followingId: string, follow: boolean) {
  if (follow) {
    const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) throw error;
  }
}

/* ---------------- Videos ---------------- */

export async function listVideos(kind: VideoKind, limit = 20): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*, owner:owner_id(*)")
    .eq("kind", kind)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Video[];
}

export async function listFollowingVideos(userId: string, kind: VideoKind, limit = 20): Promise<Video[]> {
  const { data: follows, error: fErr } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (fErr) throw fErr;
  const ids = (follows ?? []).map((f) => f.following_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("videos")
    .select("*, owner:owner_id(*)")
    .eq("kind", kind)
    .in("owner_id", ids)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Video[];
}

export async function listUserVideos(userId: string, kind?: VideoKind): Promise<Video[]> {
  let q = supabase.from("videos").select("*, owner:owner_id(*)").eq("owner_id", userId).order("created_at", { ascending: false });
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Video[];
}

export async function createVideo(fields: {
  owner_id: string;
  kind: VideoKind;
  title?: string;
  caption?: string;
  video_url: string;
  thumbnail_url?: string;
  visibility?: Visibility;
}): Promise<Video> {
  const { data, error } = await supabase.from("videos").insert(fields).select().single();
  if (error) throw error;
  return data as Video;
}

export async function uploadMediaFile(file: File, userId: string, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------- Likes / Saves / Comments ---------------- */

export async function isLiked(videoId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("likes")
    .select("video_id")
    .eq("video_id", videoId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function getLikeCount(videoId: string): Promise<number> {
  const { count, error } = await supabase
    .from("likes")
    .select("video_id", { count: "exact", head: true })
    .eq("video_id", videoId);
  if (error) throw error;
  return count ?? 0;
}

export async function setLiked(videoId: string, userId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from("likes").insert({ video_id: videoId, user_id: userId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("likes").delete().eq("video_id", videoId).eq("user_id", userId);
    if (error) throw error;
  }
}

export async function isSaved(videoId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("saves")
    .select("video_id")
    .eq("video_id", videoId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function setSaved(videoId: string, userId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase.from("saves").insert({ video_id: videoId, user_id: userId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("saves").delete().eq("video_id", videoId).eq("user_id", userId);
    if (error) throw error;
  }
}

export async function listSavedVideos(userId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from("saves")
    .select("created_at, video:video_id(*, owner:owner_id(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as { video: Video }[]).map((r) => r.video).filter(Boolean);
}

export async function getCommentCount(videoId: string): Promise<number> {
  const { count, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("video_id", videoId);
  if (error) throw error;
  return count ?? 0;
}

export async function listComments(videoId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:user_id(*)")
    .eq("video_id", videoId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addComment(videoId: string, userId: string, body: string) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ video_id: videoId, user_id: userId, body })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ---------------- Messaging ---------------- */

export async function listConversationsForUser(userId: string): Promise<Conversation[]> {
  const { data: memberships, error: mErr } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", userId);
  if (mErr) throw mErr;
  const ids = (memberships ?? []).map((m) => m.conversation_id);
  if (ids.length === 0) return [];

  const [{ data: conversations, error: cErr }, { data: members, error: memErr }, { data: recentMessages, error: msgErr }] =
    await Promise.all([
      supabase.from("conversations").select("*").in("id", ids),
      supabase.from("conversation_members").select("conversation_id, profile:user_id(*)").in("conversation_id", ids),
      supabase.from("messages").select("*").in("conversation_id", ids).order("created_at", { ascending: false })
    ]);
  if (cErr) throw cErr;
  if (memErr) throw memErr;
  if (msgErr) throw msgErr;

  const lastMessageByConv = new Map<string, MessageRow>();
  for (const m of (recentMessages ?? []) as MessageRow[]) {
    if (!lastMessageByConv.has(m.conversation_id)) lastMessageByConv.set(m.conversation_id, m);
  }

  const membersByConv = new Map<string, Profile[]>();
  for (const row of (members ?? []) as unknown as { conversation_id: string; profile: Profile | null }[]) {
    const list = membersByConv.get(row.conversation_id) ?? [];
    if (row.profile) list.push(row.profile);
    membersByConv.set(row.conversation_id, list);
  }

  return (conversations ?? [])
    .map((c) => ({
      ...c,
      members: (membersByConv.get(c.id) ?? []).filter((p) => p.id !== userId),
      lastMessage: lastMessageByConv.get(c.id) ?? null
    }))
    .sort((a, b) => {
      const at = a.lastMessage?.created_at ?? a.created_at;
      const bt = b.lastMessage?.created_at ?? b.created_at;
      return new Date(bt).getTime() - new Date(at).getTime();
    }) as Conversation[];
}

export async function getOrCreateDirectConversation(userIdA: string, userIdB: string): Promise<string> {
  const { data: mineRows, error: mineErr } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", userIdA);
  if (mineErr) throw mineErr;
  const myConvIds = (mineRows ?? []).map((r) => r.conversation_id);

  if (myConvIds.length > 0) {
    const { data: theirRows, error: theirErr } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userIdB)
      .in("conversation_id", myConvIds);
    if (theirErr) throw theirErr;
    const shared = theirRows?.[0]?.conversation_id;
    if (shared) {
      const { data: conv } = await supabase.from("conversations").select("id, is_group").eq("id", shared).eq("is_group", false).maybeSingle();
      if (conv) return conv.id;
    }
  }

  const { data: newConv, error: convErr } = await supabase
    .from("conversations")
    .insert({ is_group: false })
    .select()
    .single();
  if (convErr) throw convErr;

  const { error: addErr } = await supabase.from("conversation_members").insert([
    { conversation_id: newConv.id, user_id: userIdA },
    { conversation_id: newConv.id, user_id: userIdB }
  ]);
  if (addErr) throw addErr;

  return newConv.id;
}

export async function listMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<MessageRow> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select()
    .single();
  if (error) throw error;
  return data as MessageRow;
}

/* ---------------- Search ---------------- */

export async function searchProfiles(query: string, limit = 20): Promise<Profile[]> {
  const term = query.trim();
  if (!term) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function searchVideos(query: string, kind?: VideoKind, limit = 20): Promise<Video[]> {
  const term = query.trim();
  if (!term) return [];
  let q = supabase
    .from("videos")
    .select("*, owner:owner_id(*)")
    .or(`title.ilike.%${term}%,caption.ilike.%${term}%`)
    .eq("visibility", "public")
    .limit(limit);
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Video[];
}

/* ---------------- Notifications ---------------- */

export async function listNotifications(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*, actor:actor_id(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as NotificationRow[];
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (error) throw error;
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
  return count ?? 0;
}
