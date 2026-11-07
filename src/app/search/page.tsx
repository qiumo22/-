import type { Metadata } from "next";

import { PostCard } from "@/components/post-card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PUBLIC_POST_SELECT,
  toPublicPosts,
  type PublicPost,
} from "@/lib/posts/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "搜索",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const raw = (q ?? "").trim().slice(0, 80);
  const safe = raw.replace(/[%_,()\\]/g, " ").trim();

  let posts: PublicPost[] = [];

  if (safe) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("posts")
      .select(PUBLIC_POST_SELECT)
      .eq("status", "published")
      .or(
        `title.ilike.%${safe}%,summary.ilike.%${safe}%,content_md.ilike.%${safe}%`,
      )
      .order("published_at", { ascending: false })
      .limit(50);

    posts = toPublicPosts(data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">搜索</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          在已发布文章的标题、摘要和正文中查找关键词。
        </p>
      </div>

      <form action="/search" className="flex max-w-xl gap-2">
        <Input
          name="q"
          defaultValue={raw}
          placeholder="输入关键词"
          aria-label="搜索文章"
        />
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          搜索
        </button>
      </form>

      {!raw ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          输入关键词开始搜索。
        </div>
      ) : posts.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          没有找到与“{raw}”相关的已发布文章。
        </div>
      ) : (
        <section className="space-y-3">
          <p className="text-muted-foreground text-sm">
            “{raw}” 的搜索结果：{posts.length} 篇
          </p>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      )}
    </div>
  );
}
