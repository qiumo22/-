"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/guards";
import { MAX_COMMENT_LENGTH } from "@/lib/comments/constants";

function postPath(slug: string) {
  return `/posts/${slug}`;
}

export async function createCommentAction(formData: FormData) {
  const postId = String(formData.get("postId") ?? "").trim();
  const postSlug = String(formData.get("postSlug") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!postId || !postSlug) {
    redirect("/");
  }

  const { supabase, user } = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(postPath(postSlug))}`);
  }

  if (!content) {
    redirect(`${postPath(postSlug)}?commentError=empty#comments`);
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    redirect(`${postPath(postSlug)}?commentError=long#comments`);
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content,
  });

  if (error) {
    redirect(`${postPath(postSlug)}?commentError=failed#comments`);
  }

  revalidatePath(postPath(postSlug));
  redirect(`${postPath(postSlug)}#comments`);
}

export async function deleteCommentAction(formData: FormData) {
  const commentId = String(formData.get("commentId") ?? "").trim();
  const postSlug = String(formData.get("postSlug") ?? "").trim();

  if (!commentId || !postSlug) {
    redirect("/");
  }

  const { supabase, user } = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(postPath(postSlug))}`);
  }

  await supabase.from("comments").delete().eq("id", commentId);

  revalidatePath(postPath(postSlug));
  redirect(`${postPath(postSlug)}#comments`);
}
