import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { removePostAction } from "@/lib/moderation/actions";
import { cn } from "@/lib/utils";

export function RemoveForm({ postId }: { postId: string }) {
  return (
    <form action={removePostAction} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <Textarea
        name="reason"
        rows={2}
        required
        placeholder="下架理由（必填）"
        className="text-sm"
      />
      <button
        type="submit"
        className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
      >
        下架
      </button>
    </form>
  );
}
