import { describe, expect, it } from "vitest";

import { createPostSlug, createTagSlug } from "@/lib/posts/slug";
import {
  MAX_CONTENT_LENGTH,
  MAX_COVER_BYTES,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  parseTags,
  validateCover,
  validatePostInput,
} from "@/lib/posts/validation";

const validPost = {
  title: "图书馆四楼靠窗的位置",
  summary: "一个座位，一整个秋天。",
  content: "正文内容。",
};

describe("validatePostInput", () => {
  it("accepts a valid post", () => {
    expect(validatePostInput(validPost)).toBeNull();
  });

  it("requires a title", () => {
    expect(validatePostInput({ ...validPost, title: "   " })).toContain("标题");
  });

  it("rejects an overlong title", () => {
    expect(
      validatePostInput({
        ...validPost,
        title: "长".repeat(MAX_TITLE_LENGTH + 1),
      }),
    ).toContain("标题");
  });

  it("rejects an overlong summary", () => {
    expect(
      validatePostInput({
        ...validPost,
        summary: "长".repeat(MAX_SUMMARY_LENGTH + 1),
      }),
    ).toContain("摘要");
  });

  it("requires content", () => {
    expect(validatePostInput({ ...validPost, content: "  " })).toContain(
      "正文",
    );
  });

  it("rejects overlong content", () => {
    expect(
      validatePostInput({
        ...validPost,
        content: "长".repeat(MAX_CONTENT_LENGTH + 1),
      }),
    ).toContain("正文");
  });
});

describe("validateCover", () => {
  it("accepts supported image types", () => {
    expect(validateCover({ type: "image/png", size: 1024 })).toBeNull();
  });

  it("rejects unsupported types", () => {
    expect(validateCover({ type: "image/gif", size: 1024 })).toContain("PNG");
  });

  it("rejects oversized covers", () => {
    expect(
      validateCover({ type: "image/png", size: MAX_COVER_BYTES + 1 }),
    ).toContain("2MB");
  });
});

describe("parseTags", () => {
  it("splits on English and Chinese commas", () => {
    expect(parseTags("校园, 随笔，散文")).toEqual(["校园", "随笔", "散文"]);
  });

  it("trims and deduplicates case-insensitively", () => {
    expect(parseTags(" Campus, campus , 校园 ")).toEqual(["Campus", "校园"]);
  });

  it("limits the number of tags", () => {
    expect(parseTags("a,b,c,d,e,f,g")).toHaveLength(5);
  });

  it("ignores empty segments", () => {
    expect(parseTags(" , ,")).toEqual([]);
  });
});

describe("slugs", () => {
  it("creates readable slugs for ASCII titles", () => {
    expect(createPostSlug("Hello World")).toMatch(/^hello-world-[a-f0-9]{8}$/);
  });

  it("falls back for Chinese titles", () => {
    expect(createPostSlug("校园故事")).toMatch(/^post-[a-f0-9]{8}$/);
  });

  it("creates unique post slugs", () => {
    expect(createPostSlug("Same title")).not.toBe(createPostSlug("Same title"));
  });

  it("creates non-empty tag slugs", () => {
    expect(createTagSlug("校园")).toMatch(/^校园-[a-f0-9]{8}$/);
    expect(createTagSlug("C++")).toMatch(/^c-[a-f0-9]{8}$/);
    expect(createTagSlug("!!!")).toMatch(/^tag-[a-f0-9]{8}$/);
  });
});
