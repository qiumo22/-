import Image from "next/image";
import Link from "next/link";

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
    <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          校园写作
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-2.5 py-1.5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {profile ? (
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-2.5 py-1.5 transition-colors"
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
                className="hover:bg-muted flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm"
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full text-xs font-medium">
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
