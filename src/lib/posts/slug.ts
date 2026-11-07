function randomSuffix() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 8);
}

export function createPostSlug(title: string) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return base ? `${base}-${randomSuffix()}` : `post-${randomSuffix()}`;
}

export function createTagSlug(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9一-鿿-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

  return base ? `${base}-${randomSuffix()}` : `tag-${randomSuffix()}`;
}
