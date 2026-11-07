import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostEditor } from "@/components/post-editor";
import { requireActiveUser } from "@/lib/auth/guards";
import { canEdit, type PostStatus } from "@/lib/posts/state-machine";
import type { PostTag } from "@/lib/posts/types";

export const metadata: Metadata = {
  title: "编辑文章",
};

type EditPostRow = {
  id: string;
  author_id: string;
  title: string;
  summary: string;
  content_md: string;
  cover_url: string | null;
  status: PostStatus;
  post_tags: { tags: PostTag | null }[];
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireActiveUser();

  const { data } = await supabase
    .from("posts")
    .select(
      "id, author_id, title, summary, content_md, cover_url, status, post_tags(tags(id, name, slug))",
    )
    .eq("id", id)
    .maybeSingle();

  const post = data as EditPostRow | null;

  if (!post || post.author_id !== user.id) {
    notFound();
  }

  if (!canEdit(post.status)) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">文章正在审核</h1>
        <p className="text-muted-foreground text-sm">
          待审核的文章不能修改，请等待管理员处理。
        </p>
        <Link href="/dashboard" className="text-sm underline">
          返回我的文章
        </Link>
      </div>
    );
  }

  const tags = post.post_tags
    .map((link) => link.tags?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">编辑文章</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          修改后可以继续保存草稿，或重新提交审核。
        </p>
      </div>

      <PostEditor
        postId={post.id}
        initial={{
          title: post.title,
          summary: post.summary,
          content: post.content_md,
          coverUrl: post.cover_url,
          tags,
          status: post.status,
        }}
      />
    </div>
  );
}
