import type { PostStatus } from "@/lib/posts/state-machine";
import { POST_STATUS_CLASSES, POST_STATUS_LABELS } from "@/lib/posts/status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        POST_STATUS_CLASSES[status],
      )}
    >
      {POST_STATUS_LABELS[status]}
    </span>
  );
}
