import Link from "next/link";
import { Search, Sparkles } from "lucide-react";

import { Mascot } from "@/components/mascot";
import { PostCard } from "@/components/post-card";
import { SakuraPetals } from "@/components/sakura-petals";
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
      <section className="border-border/70 from-secondary/80 via-background to-accent/70 relative overflow-hidden rounded-[2rem] border bg-gradient-to-br p-8 shadow-[0_30px_80px_-40px_rgba(232,106,146,0.45)] sm:p-12">
        <SakuraPetals />

        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:items-center">
          <div>
            <span className="border-primary/20 bg-background/70 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm">
              <Sparkles className="text-star size-3.5" />
              校园写作 · 多作者写作平台
            </span>

            <h1 className="font-heading mt-5 max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
              <span className="inline-block">把校园里的故事</span>
              <span className="inline-block">写下来，</span>
              <br className="hidden sm:block" />
              <span className="text-primary inline-block">让更多人读到。</span>
            </h1>

            <p className="text-muted-foreground mt-4 max-w-xl text-pretty">
              注册成为作者，用 Markdown
              写作；文章经管理员审核后发布，读者可以在首页、标签页和作者主页发现它们。
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                开始写作
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-primary/25 bg-background/60 hover:bg-secondary",
                )}
              >
                登录
              </Link>
            </div>

            <form
              action="/search"
              className="mt-6 flex max-w-md items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                <Input
                  name="q"
                  placeholder="搜索标题、摘要或正文"
                  aria-label="搜索文章"
                  className="bg-background/80 border-border/70 h-11 rounded-full pl-10"
                />
              </div>
              <button
                type="submit"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 rounded-full px-5",
                )}
              >
                搜索
              </button>
            </form>
          </div>

          <div className="relative mx-auto w-48 sm:w-64 lg:w-full lg:max-w-sm">
            <div className="bg-petal/20 absolute inset-6 rounded-full blur-3xl" />
            <div className="bg-card/90 border-border/70 absolute -top-2 right-0 z-10 rounded-2xl rounded-bl-sm border px-3 py-2 text-xs shadow-sm sm:-top-4 sm:right-2 sm:text-sm">
              今天也来写点什么吧～
            </div>
            <Mascot className="mascot-float relative w-full drop-shadow-[0_18px_30px_rgba(201,74,118,0.25)]" />
            <p className="text-muted-foreground mt-2 text-center text-xs">
              小笺 · 校园写作看板娘
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Sparkles className="text-star size-5" />
              最新文章
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              共 {total} 篇已发布文章。
            </p>
          </div>
          <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs">
            樱花季 · 第 {page} 页
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="bg-card/60 text-muted-foreground rounded-2xl border border-dashed p-10 text-center text-sm">
            {total === 0
              ? "还没有文章，等第一位作者发布。"
              : "这一页没有文章。"}
          </div>
        ) : (
          <div className="space-y-4">
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
                  "rounded-full",
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
                  "rounded-full",
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
