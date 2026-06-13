import { apiFetch } from "../lib/api";

export type SocialPost = {
  id: string;
  author_profile_id: string | null;
  title: string | null;
  content: string | null;
  category: string | null;
  location_text: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  audience: "public" | "registered_citizens" | null;
  status: "draft" | "pending_approval" | "published" | "archived" | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialPostInsert = Partial<SocialPost>;

export async function getPublishedPosts() {
  return apiFetch<SocialPost[]>("/social-posts/published");
}

export async function createDraft(data: SocialPostInsert) {
  return apiFetch<SocialPost>("/social-posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function publishPost(id: string) {
  return apiFetch<SocialPost>(`/social-posts/${id}/publish`, {
    method: "POST",
  });
}

export async function getPendingPosts() {
  return apiFetch<SocialPost[]>("/social-posts/pending");
}
