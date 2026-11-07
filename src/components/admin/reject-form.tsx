import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { rejectPostAction } from "@/lib/moderation/actions";
import { cn } from "@/lib/utils";

export function RejectForm({ postId }: { postId: string }) {
  return (
    <form action={rejectPostAction} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <Textarea
        name="reason"
        rows={2}
        required
        placeholder="驳回理由（必填）"
        className="text-sm"
      />
      <button
        type="submit"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        驳回
      </button>
    </form>
  );
}
