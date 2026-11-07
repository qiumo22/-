import Link from "next/link";

import { PostCard } from "@/components/post-card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toPublicPosts, PUBLIC_POST_SELECT } from "@/lib/posts/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count } = await supabase
    .from("posts")
    .select(PUBLIC_POST_SELECT, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  const posts = toPublicPosts(data);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-14">
      <section className="bg-muted/30 rounded-2xl border p-8 sm:p-12">
        <p className="text-muted-foreground text-sm font-medium">
          校园写作 · 多作者写作平台
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          把校园里的故事写下来，让更多人读到。
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-pretty">
          注册成为作者，用 Markdown
          写作；文章经管理员审核后发布，读者可以在首页、标签页和作者主页发现它们。
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
            开始写作
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            登录
          </Link>
        </div>

        <form action="/search" className="mt-6 flex max-w-md gap-2">
          <Input
            name="q"
            placeholder="搜索标题、摘要或正文"
            aria-label="搜索文章"
          />
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            搜索
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">最新文章</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            共 {total} 篇已发布文章。
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
            {total === 0
              ? "还没有文章，等第一位作者发布。"
              : "这一页没有文章。"}
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 pt-2">
            {page > 1 ? (
              <Link
                href={`/?page=${page - 1}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                上一页
              </Link>
            ) : null}
            <span className="text-muted-foreground text-sm">
              第 {page} / {totalPages} 页
            </span>
            {page < totalPages ? (
              <Link
                href={`/?page=${page + 1}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                下一页
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
