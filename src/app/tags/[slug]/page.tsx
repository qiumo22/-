import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/post-card";
import { TAG_POST_SELECT, toPublicPosts } from "@/lib/posts/queries";
import { createClient } from "@/lib/supabase/server";

type TagRow = {
  id: string;
  name: string;
  slug: string;
};

async function getTag(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("id,name,slug")
    .eq("slug", slug)
    .maybeSingle();

  return data as TagRow | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);

  return tag ? { title: `#${tag.name}` } : { title: "标签未找到" };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    notFound();
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(TAG_POST_SELECT)
    .eq("status", "published")
    .eq("post_tags.tag_id", tag.id)
    .order("published_at", { ascending: false });

  const posts = toPublicPosts(data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">#{tag.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          共 {posts.length} 篇已发布文章。
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          这个标签下还没有已发布文章。
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
