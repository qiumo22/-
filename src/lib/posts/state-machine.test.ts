import { describe, expect, it } from "vitest";

import {
  canEdit,
  canSubmit,
  canTransition,
  POST_TRANSITIONS,
  type PostStatus,
} from "@/lib/posts/state-machine";

const statuses: PostStatus[] = [
  "draft",
  "pending",
  "published",
  "rejected",
  "removed",
];

describe("canTransition", () => {
  it("allows the four documented transitions", () => {
    expect(canTransition("draft", "pending")).toBe(true);
    expect(canTransition("pending", "published")).toBe(true);
    expect(canTransition("pending", "rejected")).toBe(true);
    expect(canTransition("published", "removed")).toBe(true);
    expect(canTransition("rejected", "pending")).toBe(true);
    expect(canTransition("removed", "pending")).toBe(true);
  });

  it("rejects every other transition", () => {
    for (const from of statuses) {
      for (const to of statuses) {
        if (from === to) continue;

        const allowed = POST_TRANSITIONS[from].includes(to);
        const documented =
          (from === "draft" && to === "pending") ||
          (from === "pending" && (to === "published" || to === "rejected")) ||
          (from === "published" && to === "removed") ||
          (from === "rejected" && to === "pending") ||
          (from === "removed" && to === "pending");

        expect(canTransition(from, to)).toBe(documented);
        expect(allowed).toBe(documented);
      }
    }
  });

  it("rejects self transitions", () => {
    for (const status of statuses) {
      expect(canTransition(status, status)).toBe(false);
    }
  });
});

describe("canSubmit", () => {
  it("allows draft, rejected and removed", () => {
    expect(canSubmit("draft")).toBe(true);
    expect(canSubmit("rejected")).toBe(true);
    expect(canSubmit("removed")).toBe(true);
  });

  it("rejects pending and published", () => {
    expect(canSubmit("pending")).toBe(false);
    expect(canSubmit("published")).toBe(false);
  });
});

describe("canEdit", () => {
  it("locks only pending posts", () => {
    expect(canEdit("pending")).toBe(false);
    expect(canEdit("draft")).toBe(true);
    expect(canEdit("published")).toBe(true);
    expect(canEdit("rejected")).toBe(true);
    expect(canEdit("removed")).toBe(true);
  });
});
