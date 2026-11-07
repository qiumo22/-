import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createCommentAction,
  deleteCommentAction,
} from "@/lib/comments/actions";
import { MAX_COMMENT_LENGTH } from "@/lib/comments/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CommentItem = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

const COMMENT_ERRORS: Record<string, string> = {
  empty: "评论不能为空。",
  long: `评论不能超过 ${MAX_COMMENT_LENGTH} 字。`,
  failed: "评论发表失败，请稍后再试。",
};

export function Comments({
  postId,
  postSlug,
  comments,
  currentUserId,
  isAdmin,
  error,
}: {
  postId: string;
  postSlug: string;
  comments: CommentItem[];
  currentUserId: string | null;
  isAdmin: boolean;
  error?: string;
}) {
  const loginHref = `/login?next=${encodeURIComponent(`/posts/${postSlug}`)}`;

  return (
    <section id="comments" className="space-y-5 border-t pt-8">
      <h2 className="text-lg font-semibold tracking-tight">
        评论（{comments.length}）
      </h2>

      {error ? (
        <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          {COMMENT_ERRORS[error] ?? "评论操作失败，请稍后再试。"}
        </p>
      ) : null}

      {currentUserId ? (
        <form action={createCommentAction} className="space-y-3">
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="postSlug" value={postSlug} />
          <Textarea
            id="comment-content"
            name="content"
            aria-label="评论"
            rows={3}
            maxLength={MAX_COMMENT_LENGTH}
            required
            placeholder="写下你的评论…"
          />
          <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
            发表评论
          </button>
        </form>
      ) : (
        <p className="text-muted-foreground text-sm">
          登录后可以发表评论。{" "}
          <Link href={loginHref} className="text-foreground underline">
            去登录
          </Link>
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          还没有评论，来写第一条。
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const canDelete = isAdmin || comment.author_id === currentUserId;

            return (
              <li
                key={comment.id}
                className="bg-card/70 border-border/70 space-y-2 rounded-2xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {comment.author?.avatar_url ? (
                    <Image
                      src={comment.author.avatar_url}
                      alt=""
                      width={24}
                      height={24}
                      className="size-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-full text-xs">
                      {comment.author?.display_name.slice(0, 1) ?? "?"}
                    </span>
                  )}

                  {comment.author ? (
                    <Link
                      href={`/authors/${comment.author.username}`}
                      className="font-medium hover:underline"
                    >
                      {comment.author.display_name}
                    </Link>
                  ) : (
                    <span className="font-medium">未知用户</span>
                  )}

                  <span className="text-muted-foreground text-xs">
                    {formatDate(comment.created_at)}
                  </span>
                </div>

                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                {canDelete ? (
                  <form action={deleteCommentAction}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="postSlug" value={postSlug} />
                    <button
                      type="submit"
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      删除
                    </button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
