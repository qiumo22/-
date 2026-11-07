import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { MODERATION_ACTION_LABELS } from "@/lib/moderation/labels";

export const metadata: Metadata = {
  title: "操作记录",
};

type LogRow = {
  id: string;
  action: string;
  target_type: "post" | "user";
  target_id: string;
  reason: string;
  created_at: string;
  profiles: { username: string; display_name: string } | null;
};

const TARGET_LABELS: Record<LogRow["target_type"], string> = {
  post: "文章",
  user: "用户",
};

export default async function AdminLogPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("moderation_actions")
    .select(
      "id,action,target_type,target_id,reason,created_at,profiles!moderation_actions_actor_id_fkey(username,display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const actions = (data ?? []) as unknown as LogRow[];

  return (
    <div className="space-y-4">
      {actions.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          还没有管理操作记录。
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {actions.map((action) => (
            <li key={action.id} className="space-y-1 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {action.profiles?.display_name ?? "未知管理员"}
                </span>
                <span>
                  {MODERATION_ACTION_LABELS[action.action] ?? action.action}
                </span>
                <span className="text-muted-foreground">
                  {TARGET_LABELS[action.target_type]}{" "}
                  {action.target_id.slice(0, 8)}
                </span>
              </div>
              {action.reason ? (
                <p className="text-muted-foreground">理由：{action.reason}</p>
              ) : null}
              <p className="text-muted-foreground text-xs">
                {formatDate(action.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
