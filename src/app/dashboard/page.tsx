import type { Metadata } from "next";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireActiveUser } from "@/lib/auth/guards";
import { deletePostAction, submitPostAction } from "@/lib/posts/actions";
import { canEdit, canSubmit, type PostStatus } from "@/lib/posts/state-machine";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "我的文章",
};

type DashboardPost = {
  id: string;
  title: string;
  status: PostStatus;
  updated_at: string;
  moderation_reason: string | null;
  post_tags: { tags: { name: string } | null }[];
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
});

export default async function DashboardPage() {
  const { supabase, user } = await requireActiveUser();

  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, status, updated_at, moderation_reason, post_tags(tags(name))",
    )
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false });

  const posts = (data ?? []) as unknown as DashboardPost[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">我的文章</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            草稿、待审与已发布文章都在这里。
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          写文章
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-muted-foreground space-y-3 rounded-xl border border-dashed p-10 text-center text-sm">
          <p>还没有文章。</p>
          <Link href="/dashboard/new" className="text-foreground underline">
            写第一篇文章
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => {
            const tags = post.post_tags
              .map((link) => link.tags?.name)
              .filter((name): name is string => Boolean(name));

            return (
              <li
                key={post.id}
                className="bg-card/80 border-border/70 rounded-2xl border p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-medium">{post.title}</h2>
                      <StatusBadge status={post.status} />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      更新于 {dateFormatter.format(new Date(post.updated_at))}
                      {tags.length > 0 ? ` · ${tags.join(" / ")}` : ""}
                    </p>
                    {post.moderation_reason &&
                    (post.status === "rejected" ||
                      post.status === "removed") ? (
                      <p className="text-destructive mt-2 text-sm">
                        审核说明：{post.moderation_reason}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canEdit(post.status) ? (
                      <Link
                        href={`/dashboard/${post.id}/edit`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                      >
                        编辑
                      </Link>
                    ) : null}

                    {canSubmit(post.status) ? (
                      <form action={submitPostAction}>
                        <input type="hidden" name="postId" value={post.id} />
                        <button
                          type="submit"
                          className={cn(buttonVariants({ size: "sm" }))}
                        >
                          提交审核
                        </button>
                      </form>
                    ) : null}

                    {post.status !== "pending" ? (
                      <form action={deletePostAction}>
                        <input type="hidden" name="postId" value={post.id} />
                        <button
                          type="submit"
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                          )}
                        >
                          删除
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
