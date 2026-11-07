export type PostStatus =
  "draft" | "pending" | "published" | "rejected" | "removed";

export const POST_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  draft: ["pending"],
  pending: ["published", "rejected"],
  published: ["removed"],
  rejected: ["pending"],
  removed: ["pending"],
};

export function canTransition(from: PostStatus, to: PostStatus) {
  return POST_TRANSITIONS[from].includes(to);
}

export function canSubmit(status: PostStatus) {
  return status === "draft" || status === "rejected" || status === "removed";
}

export function canEdit(status: PostStatus) {
  return status !== "pending";
}
