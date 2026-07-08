export type PostStatus = "Neu" | "Entwurf" | "Freigabe" | "Geplant" | "Live";

export type Client = {
  id: string;
  name: string;
  handle: string | null;
  emoji: string | null;
  branche: string | null;
  cta: string | null;
  voice: string | null;
  hard_rules: string[] | null;
  hashtags_fix: string[] | null;
  facts: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  client_id: string;
  date: string;
  time: string | null;
  format: string | null;
  theme: string | null;
  caption: string | null;
  status: PostStatus;
  created_at: string;
};

export type Photo = {
  id: string;
  post_id: string | null;
  client_id: string;
  storage_path: string;
  created_at: string;
};

// A post with its resolved photo public URLs, used by the UI.
export type PostWithPhotos = Post & {
  photos: { id: string; url: string; storage_path: string }[];
};
