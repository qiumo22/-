import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readEnv(file) {
  if (!existsSync(file)) return {};

  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const env = { ...readEnv(path.join(root, ".env.local")), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const password = "Campus123456!";
const stamp = Date.now();
const slug = `verify-post-${stamp}`;
const tagName = `验证标签${stamp}`;
const tagSlug = `verify-tag-${stamp}`;
const tempEmail = `mod-test-${stamp}@example.com`;
const tempSlug = `mod-post-${stamp}`;
let coverPath = null;
let postId = null;
let tagId = null;
let tempUserId = null;
let tempPostId = null;
let failures = 0;

const serviceHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function signIn(email) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Sign in failed for ${email}: ${await response.text()}`);
  }

  const data = await response.json();

  return { token: data.access_token, userId: data.user.id };
}

async function rest(pathname, { token = anonKey, method = "GET", body } = {}) {
  const headers = {
    apikey: anonKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  if (token !== anonKey) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${url}/rest/v1/${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    data: text ? JSON.parse(text) : null,
  };
}

async function main() {
  const author = await signIn("lin@example.com");
  const admin = await signIn("admin@example.com");

  const created = await rest("posts", {
    token: author.token,
    method: "POST",
    body: {
      author_id: author.userId,
      title: "验证草稿",
      slug,
      summary: "验证用",
      content_md: "第一版正文。",
      status: "draft",
    },
  });

  check(
    "author can create a draft",
    created.ok &&
      created.data?.[0]?.status === "draft" &&
      created.data[0].author_id === author.userId,
    `HTTP ${created.status} ${JSON.stringify(created.data)}`,
  );

  postId = created.data?.[0]?.id ?? null;

  const updated = await rest(`posts?id=eq.${postId}`, {
    token: author.token,
    method: "PATCH",
    body: { content_md: "第二版正文。" },
  });

  check(
    "author can edit their own draft",
    updated.ok && updated.data?.[0]?.content_md === "第二版正文。",
    JSON.stringify(updated.data),
  );

  const ownList = await rest(
    `posts?select=id,status&author_id=eq.${author.userId}&id=eq.${postId}`,
    { token: author.token },
  );

  check(
    "draft appears in the author's own list",
    ownList.ok && ownList.data?.length === 1,
    JSON.stringify(ownList.data),
  );

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const cover = `${author.userId}/verify-${stamp}.png`;

  const upload = await fetch(`${url}/storage/v1/object/covers/${cover}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${author.token}`,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: png,
  });

  check(
    "author can upload a cover",
    upload.ok,
    `HTTP ${upload.status} ${await upload.text()}`,
  );

  if (upload.ok) {
    coverPath = cover;
  }

  const tagCreated = await rest("tags", {
    token: author.token,
    method: "POST",
    body: { name: tagName, slug: tagSlug },
  });

  check(
    "author can create a tag",
    tagCreated.ok && tagCreated.data?.length === 1,
    `HTTP ${tagCreated.status} ${JSON.stringify(tagCreated.data)}`,
  );

  tagId = tagCreated.data?.[0]?.id ?? null;

  const linked = await rest("post_tags", {
    token: author.token,
    method: "POST",
    body: { post_id: postId, tag_id: tagId },
  });

  check(
    "author can attach a tag to their post",
    linked.ok,
    `HTTP ${linked.status} ${JSON.stringify(linked.data)}`,
  );

  const submitted = await rest(`posts?id=eq.${postId}`, {
    token: author.token,
    method: "PATCH",
    body: { status: "pending" },
  });

  check(
    "author can submit a draft for review",
    submitted.ok && submitted.data?.[0]?.status === "pending",
    `HTTP ${submitted.status} ${JSON.stringify(submitted.data)}`,
  );

  const rejected = await rest(`posts?id=eq.${postId}`, {
    token: admin.token,
    method: "PATCH",
    body: {
      status: "rejected",
      moderation_reason: "请补充更多细节",
    },
  });

  check(
    "admin can reject a pending post with a reason",
    rejected.ok &&
      rejected.data?.[0]?.status === "rejected" &&
      rejected.data?.[0]?.moderation_reason === "请补充更多细节",
    `HTTP ${rejected.status} ${JSON.stringify(rejected.data)}`,
  );

  const reasonVisible = await rest(
    `posts?select=status,moderation_reason&id=eq.${postId}`,
    { token: author.token },
  );

  check(
    "author can read the rejection reason",
    reasonVisible.ok &&
      reasonVisible.data?.[0]?.moderation_reason === "请补充更多细节",
    JSON.stringify(reasonVisible.data),
  );

  const resubmitted = await rest(`posts?id=eq.${postId}`, {
    token: author.token,
    method: "PATCH",
    body: { content_md: "补充后的正文。", status: "pending" },
  });

  check(
    "author can revise and resubmit a rejected post",
    resubmitted.ok && resubmitted.data?.[0]?.status === "pending",
    `HTTP ${resubmitted.status} ${JSON.stringify(resubmitted.data)}`,
  );

  const approved = await rest(`posts?id=eq.${postId}`, {
    token: admin.token,
    method: "PATCH",
    body: { status: "published" },
  });

  check(
    "admin can approve a pending post",
    approved.ok &&
      approved.data?.[0]?.status === "published" &&
      Boolean(approved.data?.[0]?.published_at),
    `HTTP ${approved.status} ${JSON.stringify(approved.data)}`,
  );

  const removed = await rest(`posts?id=eq.${postId}`, {
    token: admin.token,
    method: "PATCH",
    body: { status: "removed", moderation_reason: "测试下架" },
  });

  check(
    "admin can remove a published post with a reason",
    removed.ok && removed.data?.[0]?.status === "removed",
    `HTTP ${removed.status} ${JSON.stringify(removed.data)}`,
  );

  const resubmittedRemoved = await rest(`posts?id=eq.${postId}`, {
    token: author.token,
    method: "PATCH",
    body: { content_md: "再次修改。", status: "pending" },
  });

  check(
    "author can resubmit a removed post",
    resubmittedRemoved.ok && resubmittedRemoved.data?.[0]?.status === "pending",
    `HTTP ${resubmittedRemoved.status} ${JSON.stringify(resubmittedRemoved.data)}`,
  );

  const createUserResponse = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: serviceHeaders,
    body: JSON.stringify({
      email: tempEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: "封禁测试用户" },
    }),
  });
  const tempUser = await createUserResponse.json();
  tempUserId = tempUser.id ?? null;

  check(
    "temporary user for ban test was created",
    createUserResponse.ok && Boolean(tempUserId),
    JSON.stringify(tempUser),
  );

  const createTempPostResponse = await fetch(`${url}/rest/v1/posts`, {
    method: "POST",
    headers: serviceHeaders,
    body: JSON.stringify({
      author_id: tempUserId,
      title: "封禁测试文章",
      slug: tempSlug,
      summary: "",
      content_md: "测试正文。",
      status: "published",
      published_at: new Date().toISOString(),
    }),
  });
  const tempPostRows = await createTempPostResponse.json();
  tempPostId = tempPostRows[0]?.id ?? null;

  check(
    "temporary published post was created",
    createTempPostResponse.ok && Boolean(tempPostId),
    JSON.stringify(tempPostRows),
  );

  const visibleBeforeBan = await rest(`posts?select=slug&slug=eq.${tempSlug}`);
  check(
    "test post is visible before the ban",
    visibleBeforeBan.data?.length === 1,
    JSON.stringify(visibleBeforeBan.data),
  );

  const authorBanAttempt = await rest(`profiles?id=eq.${tempUserId}`, {
    token: author.token,
    method: "PATCH",
    body: { status: "banned" },
  });
  check(
    "author cannot ban another user",
    authorBanAttempt.ok &&
      Array.isArray(authorBanAttempt.data) &&
      authorBanAttempt.data.length === 0,
    `HTTP ${authorBanAttempt.status} ${JSON.stringify(authorBanAttempt.data)}`,
  );

  const ban = await rest(`profiles?id=eq.${tempUserId}`, {
    token: admin.token,
    method: "PATCH",
    body: { status: "banned" },
  });
  check(
    "admin can ban a user",
    ban.ok && ban.data?.[0]?.status === "banned",
    `HTTP ${ban.status} ${JSON.stringify(ban.data)}`,
  );

  const visibleAfterBan = await rest(`posts?select=slug&slug=eq.${tempSlug}`);
  check(
    "banned user's posts disappear from public queries",
    visibleAfterBan.data?.length === 0,
    JSON.stringify(visibleAfterBan.data),
  );

  const profileAfterBan = await rest(`profiles?select=id&id=eq.${tempUserId}`);
  check(
    "banned profiles disappear from public queries",
    profileAfterBan.data?.length === 0,
    JSON.stringify(profileAfterBan.data),
  );

  const unban = await rest(`profiles?id=eq.${tempUserId}`, {
    token: admin.token,
    method: "PATCH",
    body: { status: "active" },
  });
  check(
    "admin can unban a user",
    unban.ok && unban.data?.[0]?.status === "active",
    `HTTP ${unban.status} ${JSON.stringify(unban.data)}`,
  );

  const visibleAfterUnban = await rest(`posts?select=slug&slug=eq.${tempSlug}`);
  check(
    "unbanned user's posts become public again",
    visibleAfterUnban.data?.length === 1,
    JSON.stringify(visibleAfterUnban.data),
  );

  const auditInsert = await rest("moderation_actions", {
    token: admin.token,
    method: "POST",
    body: {
      actor_id: admin.userId,
      target_type: "post",
      target_id: tempPostId,
      action: "remove",
      reason: "测试审计",
    },
  });
  check(
    "admin can record a moderation action",
    auditInsert.ok && auditInsert.data?.length === 1,
    `HTTP ${auditInsert.status} ${JSON.stringify(auditInsert.data)}`,
  );

  const auditRead = await rest(
    `moderation_actions?select=id,action,target_id&target_id=eq.${tempPostId}`,
    { token: admin.token },
  );
  check(
    "admin can read the moderation log",
    auditRead.ok && auditRead.data?.length === 1,
    JSON.stringify(auditRead.data),
  );
}

main()
  .catch((error) => {
    failures += 1;
    console.error(error.message ?? error);
  })
  .finally(async () => {
    for (const targetId of [postId, tempPostId]) {
      if (targetId) {
        await fetch(
          `${url}/rest/v1/moderation_actions?target_id=eq.${targetId}`,
          {
            method: "DELETE",
            headers: serviceHeaders,
          },
        );
      }
    }

    if (postId) {
      await fetch(`${url}/rest/v1/posts?id=eq.${postId}`, {
        method: "DELETE",
        headers: serviceHeaders,
      });
    }

    if (tempPostId) {
      await fetch(`${url}/rest/v1/posts?id=eq.${tempPostId}`, {
        method: "DELETE",
        headers: serviceHeaders,
      });
    }

    if (tempUserId) {
      await fetch(`${url}/auth/v1/admin/users/${tempUserId}`, {
        method: "DELETE",
        headers: serviceHeaders,
      });
    }

    if (tagId) {
      await fetch(`${url}/rest/v1/tags?id=eq.${tagId}`, {
        method: "DELETE",
        headers: serviceHeaders,
      });
    }

    if (coverPath) {
      await fetch(`${url}/storage/v1/object/covers/${coverPath}`, {
        method: "DELETE",
        headers: serviceHeaders,
      });
    }

    if (failures > 0) {
      console.error(`\n${failures} check(s) failed.`);
      process.exit(1);
    }

    console.log("\nAll post checks passed.");
  });
