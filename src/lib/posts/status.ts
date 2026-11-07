import type { PostStatus } from "@/lib/posts/state-machine";

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "草稿",
  pending: "待审核",
  published: "已发布",
  rejected: "已驳回",
  removed: "已下架",
};

export const POST_STATUS_CLASSES: Record<PostStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  published:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  rejected: "bg-destructive/10 text-destructive",
  removed:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
};
