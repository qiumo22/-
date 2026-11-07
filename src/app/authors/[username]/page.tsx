import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/post-card";
import { PUBLIC_POST_SELECT, toPublicPosts } from "@/lib/posts/queries";
import { createClient } from "@/lib/supabase/server";

type AuthorProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};

async function getAuthor(username: string) {
  const normalized = decodeURIComponent(username).trim().toLowerCase();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,avatar_url")
    .eq("username", normalized)
    .maybeSingle();

  return data as AuthorProfile | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const author = await getAuthor(username);

  if (!author) {
    return { title: "作者未找到" };
  }

  return {
    title: author.display_name,
    description: author.bio || undefined,
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const author = await getAuthor(username);

  if (!author) {
    notFound();
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(PUBLIC_POST_SELECT)
    .eq("author_id", author.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const posts = toPublicPosts(data);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-5">
        {author.avatar_url ? (
          <Image
            src={author.avatar_url}
            alt=""
            width={72}
            height={72}
            className="ring-petal/30 size-18 rounded-full border object-cover ring-2"
          />
        ) : (
          <div className="bg-secondary text-secondary-foreground ring-petal/30 flex size-18 items-center justify-center rounded-full text-2xl font-medium ring-2">
            {author.display_name.slice(0, 1)}
          </div>
        )}

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {author.display_name}
          </h1>
          <p className="text-muted-foreground text-sm">@{author.username}</p>
          {author.bio ? <p className="max-w-xl text-sm">{author.bio}</p> : null}
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          已发布文章（{posts.length}）
        </h2>

        {posts.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
            这位作者还没有发布文章。
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
