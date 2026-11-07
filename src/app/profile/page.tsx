import type { Metadata } from "next";
import Link from "next/link";

import { requireActiveUser } from "@/lib/auth/guards";

import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "个人资料",
};

export default async function ProfilePage() {
  const { profile } = await requireActiveUser();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">个人资料</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          这些信息会展示在作者主页和文章页上。
        </p>
      </div>

      <ProfileForm profile={profile} />

      <p className="text-muted-foreground text-sm">
        公开主页：{" "}
        <Link
          href={`/authors/${profile.username}`}
          className="text-foreground underline"
        >
          /authors/{profile.username}
        </Link>
      </p>
    </div>
  );
}
