import type { Metadata } from "next";
import Link from "next/link";

import { ModerationBanner } from "@/components/admin/moderation-banner";
import { RemoveForm } from "@/components/admin/remove-form";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "已发布文章",
};

type PublishedPost = {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
  profiles: { display_name: string } | null;
  post_tags: { tags: { name: string } | null }[];
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { done, error } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("posts")
    .select(
      "id,title,slug,published_at,profiles!posts_author_id_fkey(display_name),post_tags(tags(name))",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const posts = (data ?? []) as unknown as PublishedPost[];

  return (
    <div className="space-y-4">
      <ModerationBanner done={done} error={error} />

      {posts.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          还没有已发布文章。
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => {
            const tags = post.post_tags
              .map((link) => link.tags?.name)
              .filter((name): name is string => Boolean(name));

            return (
              <li key={post.id} className="space-y-3 rounded-xl border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="hover:underline"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-muted-foreground text-xs">
                      作者：{post.profiles?.display_name ?? "未知"} · 发布于{" "}
                      {formatDate(post.published_at)}
                      {tags.length > 0 ? ` · ${tags.join(" / ")}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-sm underline"
                  >
                    查看公开页面
                  </Link>
                </div>

                <RemoveForm postId={post.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
