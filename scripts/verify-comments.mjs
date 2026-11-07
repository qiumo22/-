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
const content1 = `评论验证 ${stamp}`;
const content2 = `评论验证二 ${stamp}`;
let commentId1 = null;
let commentId2 = null;
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
  const lin = await signIn("lin@example.com");
  const chen = await signIn("chen@example.com");
  const admin = await signIn("admin@example.com");

  const postsResponse = await fetch(
    `${url}/rest/v1/posts?select=id,slug,status&slug=in.(why-i-started-journaling-again,finals-week-survival-guide)`,
    { headers: serviceHeaders },
  );
  const posts = await postsResponse.json();

  const published = posts.find(
    (post) => post.slug === "why-i-started-journaling-again",
  );
  const pending = posts.find(
    (post) => post.slug === "finals-week-survival-guide",
  );

  check("seed posts are present", Boolean(published && pending));

  const anonymousRead = await rest(
    `comments?select=id&post_id=eq.${published.id}`,
  );
  check(
    "anonymous can read comments on a published post",
    anonymousRead.ok && Array.isArray(anonymousRead.data),
    `HTTP ${anonymousRead.status} ${JSON.stringify(anonymousRead.data)}`,
  );

  const anonymousWrite = await rest("comments", {
    method: "POST",
    body: {
      post_id: published.id,
      author_id: "00000000-0000-0000-0000-000000000000",
      content: "anonymous",
    },
  });
  check(
    "anonymous cannot write comments",
    !anonymousWrite.ok ||
      (Array.isArray(anonymousWrite.data) && anonymousWrite.data.length === 0),
    `HTTP ${anonymousWrite.status} ${JSON.stringify(anonymousWrite.data)}`,
  );

  const linWrite = await rest("comments", {
    token: lin.token,
    method: "POST",
    body: {
      post_id: published.id,
      author_id: lin.userId,
      content: content1,
    },
  });
  commentId1 = linWrite.data?.[0]?.id ?? null;

  check(
    "logged-in user can comment on a published post",
    linWrite.ok && Boolean(commentId1),
    `HTTP ${linWrite.status} ${JSON.stringify(linWrite.data)}`,
  );

  const pendingWrite = await rest("comments", {
    token: lin.token,
    method: "POST",
    body: {
      post_id: pending.id,
      author_id: lin.userId,
      content: "pending",
    },
  });
  check(
    "users cannot comment on unpublished posts",
    !pendingWrite.ok ||
      (Array.isArray(pendingWrite.data) && pendingWrite.data.length === 0),
    `HTTP ${pendingWrite.status} ${JSON.stringify(pendingWrite.data)}`,
  );

  const otherDelete = await rest(`comments?id=eq.${commentId1}`, {
    token: chen.token,
    method: "DELETE",
  });
  check(
    "a user cannot delete another user's comment",
    otherDelete.ok &&
      Array.isArray(otherDelete.data) &&
      otherDelete.data.length === 0,
    `HTTP ${otherDelete.status} ${JSON.stringify(otherDelete.data)}`,
  );

  const adminDelete = await rest(`comments?id=eq.${commentId1}`, {
    token: admin.token,
    method: "DELETE",
  });
  check(
    "an admin can delete any comment",
    adminDelete.ok &&
      Array.isArray(adminDelete.data) &&
      adminDelete.data.length === 1,
    `HTTP ${adminDelete.status} ${JSON.stringify(adminDelete.data)}`,
  );

  if (adminDelete.ok && adminDelete.data?.length === 1) {
    commentId1 = null;
  }

  const linWriteAgain = await rest("comments", {
    token: lin.token,
    method: "POST",
    body: {
      post_id: published.id,
      author_id: lin.userId,
      content: content2,
    },
  });
  commentId2 = linWriteAgain.data?.[0]?.id ?? null;

  const ownDelete = await rest(`comments?id=eq.${commentId2}`, {
    token: lin.token,
    method: "DELETE",
  });
  check(
    "a user can delete their own comment",
    ownDelete.ok &&
      Array.isArray(ownDelete.data) &&
      ownDelete.data.length === 1,
    `HTTP ${ownDelete.status} ${JSON.stringify(ownDelete.data)}`,
  );

  if (ownDelete.ok && ownDelete.data?.length === 1) {
    commentId2 = null;
  }
}

main()
  .catch((error) => {
    failures += 1;
    console.error(error.message ?? error);
  })
  .finally(async () => {
    for (const id of [commentId1, commentId2]) {
      if (id) {
        await fetch(`${url}/rest/v1/comments?id=eq.${id}`, {
          method: "DELETE",
          headers: serviceHeaders,
        });
      }
    }

    if (failures > 0) {
      console.error(`\n${failures} check(s) failed.`);
      process.exit(1);
    }

    console.log("\nAll comment checks passed.");
  });
