export type PublicAuthor = {
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export type PublicTag = {
  id: string;
  name: string;
  slug: string;
};

export type PublicPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  cover_url: string | null;
  published_at: string | null;
  author: PublicAuthor | null;
  tags: PublicTag[];
};

export const PUBLIC_POST_SELECT =
  "id,title,slug,summary,cover_url,published_at,profiles!posts_author_id_fkey(username,display_name,avatar_url),post_tags(tags(id,name,slug))";

export const TAG_POST_SELECT =
  "id,title,slug,summary,cover_url,published_at,profiles!posts_author_id_fkey(username,display_name,avatar_url),post_tags!inner(tag_id,tags(id,name,slug))";

export type RawPublicPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  cover_url: string | null;
  published_at: string | null;
  profiles: PublicAuthor | PublicAuthor[] | null;
  post_tags:
    | {
        tags: PublicTag | PublicTag[] | null;
      }[]
    | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function toPublicPost(row: RawPublicPost): PublicPost {
  const tags =
    row.post_tags
      ?.map((link) => first(link.tags))
      .filter((tag): tag is PublicTag => Boolean(tag)) ?? [];

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    cover_url: row.cover_url,
    published_at: row.published_at,
    author: first(row.profiles),
    tags,
  };
}

export function toPublicPosts(rows: unknown) {
  return ((rows ?? []) as RawPublicPost[]).map(toPublicPost);
}
