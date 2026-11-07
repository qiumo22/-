import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Comments, type CommentItem } from "@/components/comments";
import { Markdown } from "@/components/markdown";
import { getCurrentProfile } from "@/lib/auth/guards";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/format";
import {
  PUBLIC_POST_SELECT,
  toPublicPost,
  type RawPublicPost,
} from "@/lib/posts/queries";
import { createClient } from "@/lib/supabase/server";

type PostDetailRow = RawPublicPost & {
  content_md: string;
};

type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles:
    | {
        username: string;
        display_name: string;
        avatar_url: string | null;
      }
    | {
        username: string;
        display_name: string;
        avatar_url: string | null;
      }[]
    | null;
};

async function getPost(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(`${PUBLIC_POST_SELECT},content_md`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data as PostDetailRow | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "文章未找到" };
  }

  return {
    title: post.title,
    description: post.summary || undefined,
  };
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ commentError?: string }>;
}) {
  const { slug } = await params;
  const { commentError } = await searchParams;
  const row = await getPost(slug);

  if (!row) {
    notFound();
  }

  const post = toPublicPost(row);
  const { profile } = await getCurrentProfile();
  const supabase = await createClient();
  const { data: commentRows } = await supabase
    .from("comments")
    .select(
      "id,content,created_at,author_id,profiles!comments_author_id_fkey(username,display_name,avatar_url)",
    )
    .eq("post_id", post.id)
    .order("created_at", { ascending: true });

  const comments: CommentItem[] = (
    (commentRows ?? []) as unknown as CommentRow[]
  ).map((comment) => ({
    id: comment.id,
    content: comment.content,
    created_at: comment.created_at,
    author_id: comment.author_id,
    author: Array.isArray(comment.profiles)
      ? (comment.profiles[0] ?? null)
      : comment.profiles,
  }));

  const currentUserId = profile?.status === "active" ? profile.id : null;
  const isAdmin = canAccessAdmin(profile);

  return (
    <article className="mx-auto max-w-3xl space-y-7">
      {post.cover_url ? (
        <Image
          src={post.cover_url}
          alt=""
          width={1200}
          height={600}
          className="aspect-[2/1] w-full rounded-xl border object-cover"
        />
      ) : null}

      <header className="space-y-3">
        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="bg-muted text-muted-foreground hover:text-foreground rounded-full px-2.5 py-0.5 text-xs"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : null}

        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {post.title}
        </h1>

        {post.summary ? (
          <p className="text-muted-foreground text-pretty">{post.summary}</p>
        ) : null}

        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          {post.author ? (
            <Link
              href={`/authors/${post.author.username}`}
              className="text-foreground flex items-center gap-2 hover:underline"
            >
              {post.author.avatar_url ? (
                <Image
                  src={post.author.avatar_url}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 rounded-full object-cover"
                />
              ) : (
                <span className="bg-muted flex size-7 items-center justify-center rounded-full text-xs">
                  {post.author.display_name.slice(0, 1)}
                </span>
              )}
              {post.author.display_name}
            </Link>
          ) : null}
          <span>·</span>
          <time dateTime={post.published_at ?? undefined}>
            {formatDate(post.published_at)}
          </time>
        </div>
      </header>

      <Markdown content={row.content_md} />

      <Comments
        postId={post.id}
        postSlug={post.slug}
        comments={comments}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        error={commentError}
      />
    </article>
  );
}
