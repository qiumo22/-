import type { Metadata } from "next";

import { BanForm } from "@/components/admin/ban-form";
import { ModerationBanner } from "@/components/admin/moderation-banner";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { unbanUserAction } from "@/lib/moderation/actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "用户管理",
};

type UserRow = {
  id: string;
  username: string;
  display_name: string;
  role: "reader" | "author" | "admin";
  status: "active" | "banned";
  created_at: string;
};

const ROLE_LABELS: Record<UserRow["role"], string> = {
  reader: "读者",
  author: "作者",
  admin: "管理员",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { done, error } = await searchParams;
  const { supabase, user } = await requireAdmin();

  const { data } = await supabase
    .from("profiles")
    .select("id,username,display_name,role,status,created_at")
    .order("created_at", { ascending: true });

  const users = (data ?? []) as UserRow[];

  return (
    <div className="space-y-4">
      <ModerationBanner done={done} error={error} />

      <ul className="space-y-3">
        {users.map((profile) => (
          <li
            key={profile.id}
            className="bg-card/80 border-border/70 flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-5 shadow-sm"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">
                  {profile.display_name}
                  {profile.id === user.id ? "（你）" : ""}
                </h2>
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                  {ROLE_LABELS[profile.role]}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    profile.status === "active"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {profile.status === "active" ? "正常" : "已封禁"}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                @{profile.username} · 注册于 {formatDate(profile.created_at)}
              </p>
            </div>

            {profile.status === "banned" ? (
              <form action={unbanUserAction}>
                <input type="hidden" name="userId" value={profile.id} />
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  解封
                </button>
              </form>
            ) : profile.role !== "admin" && profile.id !== user.id ? (
              <BanForm userId={profile.id} />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
