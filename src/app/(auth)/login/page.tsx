import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "登录",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">登录</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          登录后可以写作、提交审核和管理自己的文章。
        </p>
      </div>

      {error === "banned" ? (
        <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          账号已被封禁，无法登录。
        </p>
      ) : null}

      <LoginForm next={next} />

      <p className="text-muted-foreground text-sm">
        还没有账号？{" "}
        <Link href="/register" className="text-foreground underline">
          去注册
        </Link>
      </p>
    </div>
  );
}
