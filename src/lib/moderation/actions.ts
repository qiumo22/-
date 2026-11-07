"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/guards";

function redirectWith(
  path: string,
  key: "done" | "error",
  value: string,
): never {
  const search = new URLSearchParams({ [key]: value });
  redirect(`${path}?${search.toString()}`);
}

function refreshModerationPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/users");
  revalidatePath("/admin/log");
  revalidatePath("/");
}

export async function approvePostAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const postId = String(formData.get("postId") ?? "").trim();

  if (!postId) {
    redirectWith("/admin", "error", "missing");
  }

  const { error } = await supabase
    .from("posts")
    .update({ status: "published" })
    .eq("id", postId);

  if (error) {
    redirectWith("/admin", "error", "approve");
  }

  const { error: logError } = await supabase.from("moderation_actions").insert({
    actor_id: user.id,
    target_type: "post",
    target_id: postId,
    action: "approve",
    reason: "",
  });

  if (logError) {
    console.error("Failed to record approve action:", logError);
  }

  refreshModerationPages();
  redirectWith("/admin", "done", "approved");
}

export async function rejectPostAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const postId = String(formData.get("postId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!postId) {
    redirectWith("/admin", "error", "missing");
  }

  if (!reason) {
    redirectWith("/admin", "error", "reason");
  }

  const { error } = await supabase
    .from("posts")
    .update({ status: "rejected", moderation_reason: reason })
    .eq("id", postId);

  if (error) {
    redirectWith("/admin", "error", "reject");
  }

  const { error: logError } = await supabase.from("moderation_actions").insert({
    actor_id: user.id,
    target_type: "post",
    target_id: postId,
    action: "reject",
    reason,
  });

  if (logError) {
    console.error("Failed to record reject action:", logError);
  }

  refreshModerationPages();
  redirectWith("/admin", "done", "rejected");
}

export async function removePostAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const postId = String(formData.get("postId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!postId) {
    redirectWith("/admin/posts", "error", "missing");
  }

  if (!reason) {
    redirectWith("/admin/posts", "error", "reason");
  }

  const { error } = await supabase
    .from("posts")
    .update({ status: "removed", moderation_reason: reason })
    .eq("id", postId);

  if (error) {
    redirectWith("/admin/posts", "error", "remove");
  }

  const { error: logError } = await supabase.from("moderation_actions").insert({
    actor_id: user.id,
    target_type: "post",
    target_id: postId,
    action: "remove",
    reason,
  });

  if (logError) {
    console.error("Failed to record remove action:", logError);
  }

  refreshModerationPages();
  redirectWith("/admin/posts", "done", "removed");
}

export async function banUserAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!userId) {
    redirectWith("/admin/users", "error", "missing");
  }

  if (!reason) {
    redirectWith("/admin/users", "error", "reason");
  }

  if (userId === user.id) {
    redirectWith("/admin/users", "error", "self");
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("id,role,status")
    .eq("id", userId)
    .maybeSingle();

  if (!target) {
    redirectWith("/admin/users", "error", "notfound");
  }

  if (target.role === "admin") {
    redirectWith("/admin/users", "error", "admin");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status: "banned" })
    .eq("id", userId);

  if (error) {
    redirectWith("/admin/users", "error", "ban");
  }

  const { error: logError } = await supabase.from("moderation_actions").insert({
    actor_id: user.id,
    target_type: "user",
    target_id: userId,
    action: "ban",
    reason,
  });

  if (logError) {
    console.error("Failed to record ban action:", logError);
  }

  refreshModerationPages();
  redirectWith("/admin/users", "done", "banned");
}

export async function unbanUserAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    redirectWith("/admin/users", "error", "missing");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", userId);

  if (error) {
    redirectWith("/admin/users", "error", "unban");
  }

  const { error: logError } = await supabase.from("moderation_actions").insert({
    actor_id: user.id,
    target_type: "user",
    target_id: userId,
    action: "unban",
    reason: "管理员解封",
  });

  if (logError) {
    console.error("Failed to record unban action:", logError);
  }

  refreshModerationPages();
  redirectWith("/admin/users", "done", "unbanned");
}
