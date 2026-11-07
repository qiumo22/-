import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";

const adminNav = [
  { href: "/admin", label: "审核队列" },
  { href: "/admin/posts", label: "已发布" },
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/log", label: "操作记录" },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">管理后台</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            审核待发布文章、处理违规内容和用户。
          </p>
        </div>
        <nav className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  );
}
