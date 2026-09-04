export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export type VideoKind = "short" | "long";
export type Visibility = "public" | "friends" | "private";

export type Video = {
  id: string;
  owner_id: string;
  kind: VideoKind;
  title: string | null;
  caption: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  visibility: Visibility;
  created_at: string;
  owner?: Profile | null;
};

export type Conversation = {
  id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
  members: Profile[];
  lastMessage: MessageRow | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  media_url: string | null;
  created_at: string;
};

export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "friend_request"
  | "friend_accept"
  | "message"
  | "mention"
  | "call";

export type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  entity_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile | null;
};
