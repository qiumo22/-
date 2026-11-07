"use client";

import Image from "next/image";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "@/lib/auth/actions";
import type { Profile } from "@/lib/auth/guards";
import type { AuthState } from "@/lib/auth/types";
import { MAX_AVATAR_BYTES } from "@/lib/auth/validation";

const initialState: AuthState = {};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex items-center gap-4">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-full object-cover"
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full text-xl font-medium">
            {profile.display_name.slice(0, 1)}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="avatar">头像</Label>
          <Input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="cursor-pointer"
          />
          <p className="text-muted-foreground text-xs">
            PNG / JPEG / WebP，最大 {Math.round(MAX_AVATAR_BYTES / 1024 / 1024)}
            MB。
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">用户名</Label>
        <Input
          id="username"
          name="username"
          defaultValue={profile.username}
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
        />
        <p className="text-muted-foreground text-xs">
          3–30 位字母、数字、下划线或连字符，将用于你的公开主页地址。
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">显示名</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={profile.display_name}
          autoComplete="nickname"
          required
          maxLength={30}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">简介</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio}
          maxLength={200}
          rows={4}
          placeholder="介绍一下你自己。"
        />
      </div>

      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "保存中…" : "保存资料"}
      </Button>
    </form>
  );
}
