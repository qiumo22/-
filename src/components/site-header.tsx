import Image from "next/image";
import Link from "next/link";
import { Flower2 } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { getCurrentProfile } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/tags", label: "标签" },
  { href: "/search", label: "搜索" },
];

export async function SiteHeader() {
  const { profile } = await getCurrentProfile();

  return (
    <header className="border-border/60 bg-background/75 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-5 px-4">
        <Link
          href="/"
          className="group font-heading flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="bg-secondary text-primary ring-petal/25 flex size-8 items-center justify-center rounded-full ring-1 transition-transform group-hover:rotate-12">
            <Flower2 className="size-4" />
          </span>
          校园写作
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:bg-secondary hover:text-secondary-foreground rounded-full px-3 py-1.5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {profile ? (
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:bg-secondary hover:text-secondary-foreground rounded-full px-3 py-1.5 transition-colors"
            >
              我的文章
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {profile ? (
            <>
              <Link
                href="/dashboard/new"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                写文章
              </Link>

              <Link
                href="/profile"
                className="hover:bg-secondary flex items-center gap-2 rounded-full px-1.5 py-1.5 text-sm transition-colors"
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={28}
                    height={28}
                    className="ring-petal/30 size-7 rounded-full object-cover ring-2"
                  />
                ) : (
                  <span className="bg-secondary text-secondary-foreground ring-petal/30 flex size-7 items-center justify-center rounded-full text-xs font-medium ring-2">
                    {profile.display_name.slice(0, 1)}
                  </span>
                )}
                <span className="hidden sm:inline">{profile.display_name}</span>
              </Link>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                  )}
                >
                  退出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                登录
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
