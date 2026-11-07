import type { PostStatus } from "@/lib/posts/state-machine";

export type Post = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  summary: string;
  content_md: string;
  cover_url: string | null;
  status: PostStatus;
  published_at: string | null;
  submitted_at: string | null;
  moderation_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type PostTag = {
  id: string;
  name: string;
  slug: string;
};

export type PostWithTags = Post & {
  tags: PostTag[];
};

export type PostActionState = {
  error?: string;
  success?: string;
};
