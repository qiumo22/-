import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { banUserAction } from "@/lib/moderation/actions";
import { cn } from "@/lib/utils";

export function BanForm({ userId }: { userId: string }) {
  return (
    <form action={banUserAction} className="space-y-2 sm:w-64">
      <input type="hidden" name="userId" value={userId} />
      <Textarea
        name="reason"
        rows={2}
        required
        placeholder="封禁理由（必填）"
        className="text-sm"
      />
      <button
        type="submit"
        className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
      >
        封禁
      </button>
    </form>
  );
}
