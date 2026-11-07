import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function readEnv(file: string) {
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
  ) as Record<string, string>;
}

const env = readEnv(path.join(process.cwd(), ".env.local"));

const stamp = Date.now();
const email = `e2e+${stamp}@example.com`;
const password = "Campus123456!";
const title = `E2E 测试文章 ${stamp}`;

function adminClient(): SupabaseClient | null {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

async function findUserByEmail(admin: SupabaseClient, target: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    const match = data.users.find((user) => user.email === target);

    if (match) return match;
    if (data.users.length < 100) return null;
  }

  return null;
}

test.afterAll(async () => {
  const admin = adminClient();

  if (!admin) return;

  const user = await findUserByEmail(admin, email);

  if (!user) return;

  const { data: posts } = await admin
    .from("posts")
    .select("id")
    .eq("author_id", user.id);

  const postIds = (posts ?? []).map((post) => post.id);

  if (postIds.length > 0) {
    await admin.from("moderation_actions").delete().in("target_id", postIds);
  }

  await admin.auth.admin.deleteUser(user.id);
});

test("register → write → review → read", async ({ page }) => {
  await page.goto("/register");

  await page.getByLabel("显示名（可选）").fill("E2E 作者");
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码", { exact: true }).fill(password);
  await page.getByLabel("确认密码").fill(password);
  await page.getByRole("button", { name: "注册" }).click();

  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "个人资料" })).toBeVisible();

  await page.getByRole("link", { name: "写文章" }).first().click();
  await expect(page).toHaveURL(/\/dashboard\/new$/);

  await page.getByLabel("标题").fill(title);
  await page.getByLabel("摘要").fill("端到端测试摘要");
  await page.getByLabel("正文（Markdown）").fill("这是 E2E **测试** 正文。");
  await page.getByLabel("标签").fill("校园");
  await page.getByRole("button", { name: "提交审核" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(title).first()).toBeVisible();
  await expect(page.getByText("待审核").first()).toBeVisible();

  await page.getByRole("button", { name: "退出" }).click();
  await expect(page.getByRole("link", { name: "登录" })).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByText("校园写作管理员").first()).toBeVisible();

  await page.goto("/admin");
  const queueCard = page.locator("li").filter({ hasText: title });
  await expect(queueCard).toBeVisible();
  await queueCard.getByRole("button", { name: "通过并发布" }).click();

  await expect(page.getByText("文章已通过审核。")).toBeVisible();

  await page.goto("/");
  const postLink = page.getByRole("link", { name: title });
  await expect(postLink).toBeVisible();
  await postLink.click();

  await expect(page).toHaveURL(/\/posts\//);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  const prose = page.locator(".prose");
  await expect(prose).toContainText("这是 E2E");
  await expect(prose.locator("strong")).toContainText("测试");

  await expect(page.getByRole("heading", { name: "评论" })).toBeVisible();

  if (env.NEXT_PUBLIC_WALINE_URL) {
    await expect(page.locator(".wl-comment")).toBeAttached({
      timeout: 15_000,
    });
  } else {
    await expect(page.getByText("评论功能尚未配置。")).toBeVisible();
  }
});
