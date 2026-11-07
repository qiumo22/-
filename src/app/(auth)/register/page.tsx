import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "注册",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">注册</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          创建一个账号，开始写下你的校园故事。
        </p>
      </div>

      <RegisterForm />

      <p className="text-muted-foreground text-sm">
        已有账号？{" "}
        <Link href="/login" className="text-foreground underline">
          去登录
        </Link>
      </p>
    </div>
  );
}
