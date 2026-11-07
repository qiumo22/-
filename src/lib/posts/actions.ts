"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/guards";
import { canSubmit, canTransition } from "@/lib/posts/state-machine";
import { createPostSlug, createTagSlug } from "@/lib/posts/slug";
import type { PostActionState } from "@/lib/posts/types";
import {
  parseTags,
  validateCover,
  validatePostInput,
} from "@/lib/posts/validation";

async function findTagId(supabase: SupabaseClient, name: string) {
  const { data } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

async function ensureTags(supabase: SupabaseClient, names: string[]) {
  const ids: string[] = [];

  for (const name of names) {
    let id = await findTagId(supabase, name);

    if (!id) {
      const { data, error } = await supabase
        .from("tags")
        .insert({ name, slug: createTagSlug(name) })
        .select("id")
        .single();

      if (data) {
        id = data.id;
      } else if (error?.code === "23505") {
        id = await findTagId(supabase, name);
      }
    }

    if (id) {
      ids.push(id);
    }
  }

  return ids;
}

async function uploadCover(
  supabase: SupabaseClient,
  userId: string,
  file: File,
) {
  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("covers")
    .upload(path, file, { contentType: file.type });

  if (error) {
    return null;
  }

  return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
}

async function replacePostTags(
  supabase: SupabaseClient,
  postId: string,
  tagIds: string[],
) {
  await supabase.from("post_tags").delete().eq("post_id", postId);

  if (tagIds.length > 0) {
    await supabase.from("post_tags").insert(
      tagIds.map((tagId) => ({
        post_id: postId,
        tag_id: tagId,
      })),
    );
  }
}

export async function savePostAction(
  _prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { error: "请先登录" };
  }

  const postId = String(formData.get("postId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const intent = String(formData.get("intent") ?? "save");
  const tagNames = parseTags(String(formData.get("tags") ?? ""));

  const validationError = validatePostInput({ title, summary, content });

  if (validationError) {
    return { error: validationError };
  }

  let existing: {
    id: string;
    author_id: string;
    status: string;
    cover_url: string | null;
  } | null = null;

  if (postId) {
    const { data } = await supabase
      .from("posts")
      .select("id, author_id, status, cover_url")
      .eq("id", postId)
      .maybeSingle();

    if (!data || data.author_id !== user.id) {
      return { error: "文章不存在" };
    }

    if (data.status === "pending") {
      return { error: "待审核的文章不能修改" };
    }

    existing = data;
  }

  let coverUrl = existing?.cover_url ?? null;
  const cover = formData.get("cover");

  if (cover instanceof File && cover.size > 0) {
    const coverError = validateCover(cover);

    if (coverError) {
      return { error: coverError };
    }

    const uploaded = await uploadCover(supabase, user.id, cover);

    if (!uploaded) {
      return { error: "封面上传失败，请稍后再试" };
    }

    coverUrl = uploaded;
  }

  const tagIds = await ensureTags(supabase, tagNames);
  let savedPostId = postId;

  if (!existing) {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        title,
        slug: createPostSlug(title),
        summary,
        content_md: content,
        cover_url: coverUrl,
        status: "draft",
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: "保存失败，请稍后再试" };
    }

    savedPostId = data.id;
  } else {
    const { error } = await supabase
      .from("posts")
      .update({
        title,
        summary,
        content_md: content,
        cover_url: coverUrl,
      })
      .eq("id", existing.id);

    if (error) {
      return { error: "保存失败，请稍后再试" };
    }
  }

  await replacePostTags(supabase, savedPostId, tagIds);
  revalidatePath("/dashboard");

  if (intent === "submit") {
    const status = (existing?.status ?? "draft") as Parameters<
      typeof canSubmit
    >[0];

    if (!canSubmit(status)) {
      return { error: "当前状态不能提交审核" };
    }

    if (!canTransition(status, "pending")) {
      return { error: "当前状态不能提交审核" };
    }

    const { error: submitError } = await supabase
      .from("posts")
      .update({ status: "pending" })
      .eq("id", savedPostId);

    if (submitError) {
      return { error: "提交审核失败，请稍后再试" };
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  if (!existing) {
    redirect(`/dashboard/${savedPostId}/edit`);
  }

  return { success: "草稿已保存" };
}

export async function submitPostAction(formData: FormData) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const postId = String(formData.get("postId") ?? "").trim();

  if (!postId) {
    redirect("/dashboard");
  }

  const { data } = await supabase
    .from("posts")
    .select("id, status")
    .eq("id", postId)
    .maybeSingle();

  if (!data) {
    redirect("/dashboard");
  }

  const status = data.status as Parameters<typeof canSubmit>[0];

  if (!canSubmit(status)) {
    redirect("/dashboard");
  }

  await supabase.from("posts").update({ status: "pending" }).eq("id", postId);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deletePostAction(formData: FormData) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const postId = String(formData.get("postId") ?? "").trim();

  if (postId) {
    await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("author_id", user.id);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
