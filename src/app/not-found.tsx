import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-12 text-center">
      <p className="text-muted-foreground text-sm">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">页面不存在</h1>
      <p className="text-muted-foreground text-sm">
        这个链接可能已经失效，或者内容尚未发布。
      </p>
      <Link href="/" className="text-sm underline">
        返回首页
      </Link>
    </div>
  );
}
