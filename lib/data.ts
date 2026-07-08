import { createClient } from "@/lib/supabase/client";
import type { Client, Post, PostWithPhotos } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "photos";

// Lazy singleton so importing this module never touches env at load time
// (avoids throwing during SSR when env vars aren't inlined yet).
let _client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!_client) _client = createClient();
  return _client;
}

function publicUrl(path: string): string {
  return sb().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await sb()
    .from("clients")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Client[];
}

export async function insertClient(name: string): Promise<Client> {
  const { data, error } = await sb()
    .from("clients")
    .insert({ name })
    .select("*")
    .single();
  if (error) throw error;
  return data as Client;
}

export async function fetchPosts(clientId: string): Promise<PostWithPhotos[]> {
  const { data: posts, error } = await sb()
    .from("posts")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw error;

  const { data: photos, error: pErr } = await sb()
    .from("photos")
    .select("id, post_id, storage_path")
    .eq("client_id", clientId);
  if (pErr) throw pErr;

  return (posts as Post[]).map((post) => ({
    ...post,
    photos: (photos ?? [])
      .filter((ph) => ph.post_id === post.id)
      .map((ph) => ({ id: ph.id, storage_path: ph.storage_path, url: publicUrl(ph.storage_path) })),
  }));
}

export type PostInput = {
  client_id: string;
  date: string;
  time: string | null;
  format: string | null;
  theme: string | null;
  caption: string | null;
  status: string;
};

export async function savePost(input: PostInput, id?: string): Promise<Post> {
  if (id) {
    const { data, error } = await sb()
      .from("posts")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Post;
  }
  const { data, error } = await sb()
    .from("posts")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as Post;
}

export async function removePost(id: string): Promise<void> {
  // Detach + delete this post's photos from storage first.
  const { data: photos } = await sb()
    .from("photos")
    .select("id, storage_path")
    .eq("post_id", id);
  if (photos && photos.length) {
    await sb().storage.from(BUCKET).remove(photos.map((p) => p.storage_path));
    await sb().from("photos").delete().eq("post_id", id);
  }
  const { error } = await sb().from("posts").delete().eq("id", id);
  if (error) throw error;
}

// Resize to max 900px JPEG (~0.82 quality) before upload.
function resizeToBlob(file: File, max = 900, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > max || h > max) {
          const s = max / Math.max(w, h);
          w = Math.round(w * s);
          h = Math.round(h * s);
        }
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        cv.getContext("2d")!.drawImage(img, 0, 0, w, h);
        cv.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export type DraftPhoto = { id: string; url: string; storage_path: string };

export async function uploadPhoto(file: File, clientId: string, postId?: string): Promise<DraftPhoto> {
  const blob = await resizeToBlob(file);
  const path = `${clientId}/${crypto.randomUUID()}.jpg`;
  const { error: upErr } = await sb().storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg" });
  if (upErr) throw upErr;

  const { data, error } = await sb()
    .from("photos")
    .insert({ client_id: clientId, post_id: postId ?? null, storage_path: path })
    .select("id, storage_path")
    .single();
  if (error) throw error;
  return { id: data.id, storage_path: data.storage_path, url: publicUrl(data.storage_path) };
}

export async function attachPhotos(postId: string, photoIds: string[]): Promise<void> {
  if (!photoIds.length) return;
  const { error } = await sb().from("photos").update({ post_id: postId }).in("id", photoIds);
  if (error) throw error;
}

export async function removePhoto(photo: DraftPhoto): Promise<void> {
  await sb().storage.from(BUCKET).remove([photo.storage_path]);
  await sb().from("photos").delete().eq("id", photo.id);
}
