export const MAX_TITLE_LENGTH = 200;
export const MAX_SUMMARY_LENGTH = 500;
export const MAX_CONTENT_LENGTH = 100000;
export const MAX_COVER_BYTES = 2 * 1024 * 1024;
export const MAX_TAGS = 5;
export const ALLOWED_COVER_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function validatePostInput(input: {
  title: string;
  summary: string;
  content: string;
}): string | null {
  const title = input.title.trim();

  if (!title) {
    return "请填写标题";
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return `标题不能超过 ${MAX_TITLE_LENGTH} 个字符`;
  }

  if (input.summary.length > MAX_SUMMARY_LENGTH) {
    return `摘要不能超过 ${MAX_SUMMARY_LENGTH} 个字符`;
  }

  if (!input.content.trim()) {
    return "请填写正文";
  }

  if (input.content.length > MAX_CONTENT_LENGTH) {
    return `正文不能超过 ${MAX_CONTENT_LENGTH} 个字符`;
  }

  return null;
}

export function validateCover(file: {
  type: string;
  size: number;
}): string | null {
  if (!ALLOWED_COVER_TYPES.includes(file.type)) {
    return "封面仅支持 PNG、JPEG 或 WebP";
  }

  if (file.size > MAX_COVER_BYTES) {
    return "封面不能超过 2MB";
  }

  return null;
}

export function parseTags(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const part of value.split(/[,，]/)) {
    const tag = part.trim();

    if (!tag) continue;

    const key = tag.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    tags.push(tag);

    if (tags.length === MAX_TAGS) break;
  }

  return tags;
}
