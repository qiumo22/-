import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "无权限访问",
};

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">无权限访问</h1>
      <p className="text-muted-foreground text-sm">
        你当前的角色不能进入这个页面。管理后台只对管理员开放。
      </p>
      <Link href="/" className="text-sm underline">
        返回首页
      </Link>
    </div>
  );
}
