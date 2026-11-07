import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

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

if (!url || !anonKey) {
  console.error("Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PUBLIC_POST_SELECT =
  "id,title,slug,summary,cover_url,published_at,profiles!posts_author_id_fkey(username,display_name,avatar_url),post_tags(tags(id,name,slug))";
const TAG_POST_SELECT =
  "id,title,slug,summary,cover_url,published_at,profiles!posts_author_id_fkey(username,display_name,avatar_url),post_tags!inner(tag_id,tags(id,name,slug))";

let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  const home = await supabase
    .from("posts")
    .select(PUBLIC_POST_SELECT, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(0, 9);

  check(
    "home feed returns only published posts",
    !home.error &&
      home.data.length === 2 &&
      home.count === 2 &&
      home.data.every((post) => post.profiles?.username),
    JSON.stringify(home.error ?? home.data),
  );

  const detail = await supabase
    .from("posts")
    .select(`${PUBLIC_POST_SELECT},content_md`)
    .eq("slug", "why-i-started-journaling-again")
    .eq("status", "published")
    .maybeSingle();

  check(
    "post detail loads by slug",
    !detail.error &&
      detail.data?.title === "为什么我重新开始写日记" &&
      detail.data?.content_md?.length > 0 &&
      detail.data?.profiles?.display_name === "林夏",
    JSON.stringify(detail.error ?? detail.data),
  );

  const pendingDetail = await supabase
    .from("posts")
    .select("slug")
    .eq("slug", "finals-week-survival-guide")
    .eq("status", "published")
    .maybeSingle();

  check(
    "unpublished post is not readable by slug",
    !pendingDetail.error && pendingDetail.data === null,
    JSON.stringify(pendingDetail.error ?? pendingDetail.data),
  );

  const author = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,avatar_url")
    .eq("username", "lin_xia")
    .maybeSingle();

  const authorPosts = author.data
    ? await supabase
        .from("posts")
        .select(PUBLIC_POST_SELECT)
        .eq("author_id", author.data.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
    : { data: [], error: author.error };

  check(
    "author page lists only their published posts",
    !author.error &&
      !authorPosts.error &&
      authorPosts.data.length === 1 &&
      authorPosts.data.every((post) => post.profiles?.username === "lin_xia"),
    JSON.stringify(author.error ?? authorPosts.error ?? authorPosts.data),
  );

  const tag = await supabase
    .from("tags")
    .select("id,name,slug")
    .eq("slug", "campus")
    .maybeSingle();

  const tagPosts = tag.data
    ? await supabase
        .from("posts")
        .select(TAG_POST_SELECT)
        .eq("status", "published")
        .eq("post_tags.tag_id", tag.data.id)
        .order("published_at", { ascending: false })
    : { data: [], error: tag.error };

  check(
    "tag page lists only published posts for that tag",
    !tag.error &&
      !tagPosts.error &&
      tagPosts.data.length === 2 &&
      tagPosts.data.every((post) => post.post_tags.length > 0),
    JSON.stringify(tag.error ?? tagPosts.error ?? tagPosts.data),
  );

  const search = await supabase
    .from("posts")
    .select("slug")
    .eq("status", "published")
    .or("title.ilike.%期末%,summary.ilike.%期末%,content_md.ilike.%期末%")
    .limit(50);

  check(
    "search never returns unpublished posts",
    !search.error && search.data.length === 0,
    JSON.stringify(search.error ?? search.data),
  );

  const publishedSearch = await supabase
    .from("posts")
    .select("slug")
    .eq("status", "published")
    .or("title.ilike.%日记%,summary.ilike.%日记%,content_md.ilike.%日记%")
    .limit(50);

  check(
    "search finds published posts",
    !publishedSearch.error && publishedSearch.data.length === 1,
    JSON.stringify(publishedSearch.error ?? publishedSearch.data),
  );
}

main().catch((error) => {
  failures += 1;
  console.error(error.message ?? error);
});

process.on("exit", () => {
  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll public query checks passed.");
  }
});
