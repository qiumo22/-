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

let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function signIn(email, password) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Sign in failed for ${email}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
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
  const service = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  const postsResponse = await fetch(
    `${url}/rest/v1/posts?select=id,slug,author_id,status`,
    { headers: service },
  );
  const posts = await postsResponse.json();

  const chenPost = posts.find(
    (post) => post.slug === "the-window-seat-on-the-fourth-floor",
  );
  const linPending = posts.find(
    (post) => post.slug === "finals-week-survival-guide",
  );

  check("seed data is present", Boolean(chenPost && linPending));

  const anonymousPosts = await rest("posts?select=slug,status");
  check(
    "anonymous sees only published posts",
    Array.isArray(anonymousPosts.data) &&
      anonymousPosts.data.length === 2 &&
      anonymousPosts.data.every((post) => post.status === "published"),
    JSON.stringify(anonymousPosts.data),
  );

  const anonymousActions = await rest("moderation_actions?select=id");
  check(
    "anonymous cannot read the moderation log",
    Array.isArray(anonymousActions.data) && anonymousActions.data.length === 0,
    JSON.stringify(anonymousActions.data),
  );

  const anonymousSearch = await rest(
    "posts?select=slug&or=(title.ilike.*期末*)",
  );
  check(
    "anonymous search cannot find unpublished posts",
    Array.isArray(anonymousSearch.data) && anonymousSearch.data.length === 0,
    JSON.stringify(anonymousSearch.data),
  );

  const linToken = await signIn("lin@example.com", "Campus123456!");

  const crossAuthor = await rest(`posts?id=eq.${chenPost.id}`, {
    token: linToken,
    method: "PATCH",
    body: { summary: "attempted overwrite" },
  });
  check(
    "author cannot update another author's post",
    crossAuthor.ok &&
      Array.isArray(crossAuthor.data) &&
      crossAuthor.data.length === 0,
    `HTTP ${crossAuthor.status} ${JSON.stringify(crossAuthor.data)}`,
  );

  const selfPublish = await rest(`posts?id=eq.${linPending.id}`, {
    token: linToken,
    method: "PATCH",
    body: { status: "published" },
  });
  check(
    "author cannot approve their own pending post",
    !selfPublish.ok,
    `HTTP ${selfPublish.status} ${JSON.stringify(selfPublish.data)}`,
  );

  const chenToken = await signIn("chen@example.com", "Campus123456!");
  const otherPending = await rest(
    `posts?select=slug,status&id=eq.${linPending.id}`,
    { token: chenToken },
  );
  check(
    "another author cannot read a pending post",
    Array.isArray(otherPending.data) && otherPending.data.length === 0,
    JSON.stringify(otherPending.data),
  );

  const ownPending = await rest(
    `posts?select=slug,status&id=eq.${linPending.id}`,
    { token: linToken },
  );
  check(
    "author can read their own pending post",
    Array.isArray(ownPending.data) &&
      ownPending.data.length === 1 &&
      ownPending.data[0].status === "pending",
    JSON.stringify(ownPending.data),
  );

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll RLS checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
