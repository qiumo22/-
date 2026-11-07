"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AuthState } from "@/lib/auth/types";
import {
  normalizeEmail,
  normalizeUsername,
  validateAvatar,
  validateLogin,
  validateProfile,
  validateRegistration,
} from "@/lib/auth/validation";
import { getCurrentUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";

  return /^\/(?!\/)/.test(path) ? path : "/";
}

export async function registerAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  const validationError = validateRegistration({
    email,
    password,
    confirmPassword,
  });

  if (validationError) {
    return { error: validationError };
  }

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: displayName ? { display_name: displayName } : undefined,
  });

  if (createError) {
    const message = createError.message.toLowerCase();

    if (message.includes("already") || message.includes("exists")) {
      return { error: "该邮箱已被注册" };
    }

    return { error: "注册失败，请稍后再试" };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: "注册成功，但自动登录失败，请手动登录" };
  }

  redirect("/profile");
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const nextPath = safeNextPath(formData.get("next"));

  const validationError = validateLogin({ email, password });

  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "邮箱或密码不正确" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", data.user.id)
    .single();

  if (profile?.status === "banned") {
    await supabase.auth.signOut();
    return { error: "账号已被封禁" };
  }

  redirect(nextPath);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfileAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { error: "请先登录" };
  }

  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  const validationError = validateProfile({ username, displayName, bio });

  if (validationError) {
    return { error: validationError };
  }

  let avatarUrl: string | undefined;
  const avatar = formData.get("avatar");

  if (avatar instanceof File && avatar.size > 0) {
    const avatarError = validateAvatar(avatar);

    if (avatarError) {
      return { error: avatarError };
    }

    const extension =
      avatar.type === "image/png"
        ? "png"
        : avatar.type === "image/webp"
          ? "webp"
          : "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatar, { contentType: avatar.type });

    if (uploadError) {
      return { error: "头像上传失败，请稍后再试" };
    }

    avatarUrl = supabase.storage.from("avatars").getPublicUrl(path)
      .data.publicUrl;
  }

  const updates = {
    username,
    display_name: displayName,
    bio,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  };

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (updateError) {
    if (updateError.code === "23505") {
      return { error: "用户名已被占用" };
    }

    return { error: "保存失败，请稍后再试" };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath(`/authors/${username}`);

  return { success: "资料已保存" };
}
