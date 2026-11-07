import type { Metadata } from "next";

import { ModerationBanner } from "@/components/admin/moderation-banner";
import { RejectForm } from "@/components/admin/reject-form";
import { Markdown } from "@/components/markdown";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { approvePostAction } from "@/lib/moderation/actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "审核队列",
};

type QueuePost = {
  id: string;
  title: string;
  summary: string;
  content_md: string;
  submitted_at: string | null;
  profiles: { username: string; display_name: string } | null;
  post_tags: { tags: { name: string } | null }[];
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { done, error } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("posts")
    .select(
      "id,title,summary,content_md,submitted_at,profiles!posts_author_id_fkey(username,display_name),post_tags(tags(name))",
    )
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  const posts = (data ?? []) as unknown as QueuePost[];

  return (
    <div className="space-y-4">
      <ModerationBanner done={done} error={error} />

      {posts.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          当前没有待审核文章。
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => {
            const tags = post.post_tags
              .map((link) => link.tags?.name)
              .filter((name): name is string => Boolean(name));

            return (
              <li key={post.id} className="space-y-4 rounded-xl border p-5">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    作者：{post.profiles?.display_name ?? "未知"} · 提交于{" "}
                    {formatDate(post.submitted_at)}
                    {tags.length > 0 ? ` · ${tags.join(" / ")}` : ""}
                  </p>
                  {post.summary ? (
                    <p className="text-sm">{post.summary}</p>
                  ) : null}
                </div>

                <details className="border-t pt-3">
                  <summary className="cursor-pointer text-sm">查看全文</summary>
                  <div className="mt-3">
                    <Markdown content={post.content_md} />
                  </div>
                </details>

                <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                  <form action={approvePostAction}>
                    <input type="hidden" name="postId" value={post.id} />
                    <button
                      type="submit"
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      通过并发布
                    </button>
                  </form>

                  <RejectForm postId={post.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
