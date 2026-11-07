import {
  MODERATION_DONE_MESSAGES,
  MODERATION_ERROR_MESSAGES,
} from "@/lib/moderation/labels";

export function ModerationBanner({
  done,
  error,
}: {
  done?: string;
  error?: string;
}) {
  if (done) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
        {MODERATION_DONE_MESSAGES[done] ?? "操作已完成。"}
      </p>
    );
  }

  if (error) {
    return (
      <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
        {MODERATION_ERROR_MESSAGES[error] ?? "操作失败，请稍后再试。"}
      </p>
    );
  }

  return null;
}
