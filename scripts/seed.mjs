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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "Campus123456!";

const demoUsers = [
  {
    email: "admin@example.com",
    username: "campus_admin",
    displayName: "校园写作管理员",
    bio: "负责审核与维护社区秩序。",
    role: "admin",
  },
  {
    email: "lin@example.com",
    username: "lin_xia",
    displayName: "林夏",
    bio: "中文系学生，喜欢在图书馆四楼写东西。",
    role: "author",
  },
  {
    email: "chen@example.com",
    username: "chen_mo",
    displayName: "陈默",
    bio: "计算机系，写代码也写散文。",
    role: "author",
  },
];

const tagSeed = [
  { name: "校园", slug: "campus" },
  { name: "随笔", slug: "essay" },
  { name: "散文", slug: "prose" },
  { name: "经验", slug: "experience" },
];

const posts = [
  {
    slug: "why-i-started-journaling-again",
    title: "为什么我重新开始写日记",
    summary: "停写了三年之后，我又把本子翻了出来。",
    author: "lin_xia",
    status: "published",
    publishedAt: "2026-10-28T09:00:00.000Z",
    tags: ["essay", "campus"],
    content: `高中时我写过整整两本日记。后来上大学，忙着适应新的城市，日记本就慢慢落灰了。

这个学期重新开始写，原因很简单：脑子里的事情太多，不写下来就会在半夜反复播放。写日记不是为了记录，而是为了把声音放到纸上，然后关掉。

如果你也想开始，我的建议是别买新本子。用现有的，随便写三行，就算完成。`,
  },
  {
    slug: "the-window-seat-on-the-fourth-floor",
    title: "图书馆四楼靠窗的位置",
    summary: "一个座位，一整个秋天。",
    author: "chen_mo",
    status: "published",
    publishedAt: "2026-11-02T07:30:00.000Z",
    tags: ["prose", "campus"],
    content: `四楼靠窗的位置有一张歪腿的桌子，用一张折起来的草稿纸垫着就稳了。

我在这里看完了一本很厚的小说，也写完了两篇论文。下午四点，阳光会从窗沿斜进来，把书页照得发亮。那一刻整个图书馆都很安静，只有翻页和键盘的声音。

后来那个位置被人占了。我换到三楼，但总觉得四楼的光更好。`,
  },
  {
    slug: "finals-week-survival-guide",
    title: "期末周生存指南",
    summary: "不熬夜、不内耗、把复习拆成小步。",
    author: "lin_xia",
    status: "pending",
    publishedAt: null,
    tags: ["experience", "campus"],
    content: `期末周最重要的不是学多久，而是别让自己崩掉。我的做法是三件事：

1. 每天只定三个必须完成的小目标。
2. 中午出去走十五分钟，哪怕只是绕操场一圈。
3. 晚上十一点关掉电脑，第二天早起补。

这套方法不能保证高分，但能保证你考完还愿意继续上学。`,
  },
  {
    slug: "night-run-notes",
    title: "夜跑手记",
    summary: "操场的风比白天更适合想事情。",
    author: "chen_mo",
    status: "rejected",
    publishedAt: null,
    tags: ["prose", "campus"],
    moderationReason: "内容需要补充更多个人体验后重新提交。",
    content: `最近开始每天晚上去操场跑三公里。

白天的事情太满，只有跑步的时候脑子会空下来。跑到第二圈，呼吸稳定了，白天没想明白的事会突然有答案。

这篇还想再写详细一点，先把开头留在这里。`,
  },
  {
    slug: "old-exam-week-schedule",
    title: "旧文：考试周的时间管理",
    summary: "两年前写下的复习计划，现在已经不太适用了。",
    author: "lin_xia",
    status: "removed",
    publishedAt: "2026-09-20T08:00:00.000Z",
    tags: ["experience", "campus"],
    moderationReason: "内容已过时，暂时下架。",
    content: `这是两年前写的复习计划：早上六点起床，上午刷完两门课，下午做真题，晚上复盘。

现在回头看，这套安排太理想化了，也不适合所有人。留作记录，但不再建议照着做。`,
  },
];

async function findUserByEmail(email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (match) return match;
    if (data.users.length < 100) return null;
  }

  return null;
}

async function ensureUser(user) {
  let authUser = await findUserByEmail(user.email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: user.displayName },
    });

    if (error) throw error;
    authUser = data.user;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username: user.username,
      display_name: user.displayName,
      bio: user.bio,
      role: user.role,
      status: "active",
    })
    .eq("id", authUser.id);

  if (profileError) throw profileError;

  return authUser;
}

async function ensureComment(postId, authorId, content) {
  const { data, error } = await supabase
    .from("comments")
    .select("id")
    .eq("post_id", postId)
    .eq("author_id", authorId)
    .eq("content", content)
    .limit(1);

  if (error) throw error;
  if (data.length > 0) return;

  const { error: insertError } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: authorId, content });

  if (insertError) throw insertError;
}

async function ensureModerationAction(actorId, postId, action, reason) {
  const { data, error } = await supabase
    .from("moderation_actions")
    .select("id")
    .eq("target_type", "post")
    .eq("target_id", postId)
    .eq("action", action)
    .limit(1);

  if (error) throw error;
  if (data.length > 0) return;

  const { error: insertError } = await supabase
    .from("moderation_actions")
    .insert({
      actor_id: actorId,
      target_type: "post",
      target_id: postId,
      action,
      reason,
    });

  if (insertError) throw insertError;
}

async function main() {
  const userIds = {};
  const postIds = {};

  for (const user of demoUsers) {
    const authUser = await ensureUser(user);
    userIds[user.username] = authUser.id;
    console.log(`user  ${user.username} (${user.email})`);
  }

  const { data: tagRows, error: tagError } = await supabase
    .from("tags")
    .upsert(tagSeed, { onConflict: "slug" })
    .select("id, slug");

  if (tagError) throw tagError;

  const tagIds = Object.fromEntries(tagRows.map((tag) => [tag.slug, tag.id]));

  for (const post of posts) {
    const { data: postRow, error: postError } = await supabase
      .from("posts")
      .upsert(
        {
          author_id: userIds[post.author],
          title: post.title,
          slug: post.slug,
          summary: post.summary,
          content_md: post.content,
          status: post.status,
          published_at: post.publishedAt,
          submitted_at:
            post.status === "pending" ? "2026-11-05T12:00:00.000Z" : null,
          moderation_reason: post.moderationReason ?? null,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (postError) throw postError;

    postIds[post.slug] = postRow.id;

    const { error: deleteError } = await supabase
      .from("post_tags")
      .delete()
      .eq("post_id", postRow.id);

    if (deleteError) throw deleteError;

    const rows = post.tags
      .map((slug) => tagIds[slug])
      .filter(Boolean)
      .map((tagId) => ({ post_id: postRow.id, tag_id: tagId }));

    if (rows.length > 0) {
      const { error: linkError } = await supabase
        .from("post_tags")
        .insert(rows);

      if (linkError) throw linkError;
    }

    console.log(`post  ${post.slug}`);
  }

  const adminId = userIds.campus_admin;

  for (const post of posts) {
    if (post.status === "published") {
      await ensureModerationAction(adminId, postIds[post.slug], "approve", "");
    } else if (post.status === "rejected") {
      await ensureModerationAction(
        adminId,
        postIds[post.slug],
        "reject",
        post.moderationReason,
      );
    } else if (post.status === "removed") {
      await ensureModerationAction(
        adminId,
        postIds[post.slug],
        "remove",
        post.moderationReason,
      );
    }
  }

  await ensureComment(
    postIds["why-i-started-journaling-again"],
    userIds.chen_mo,
    "看完也想把本子翻出来了。",
  );
  await ensureComment(
    postIds["the-window-seat-on-the-fourth-floor"],
    userIds.lin_xia,
    "四楼的光真的很好。",
  );

  console.log("\nSeed complete. Demo accounts:");
  for (const user of demoUsers) {
    console.log(`  ${user.email} / ${DEMO_PASSWORD} (${user.role})`);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
