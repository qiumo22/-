"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { Markdown } from "@/components/markdown";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { savePostAction } from "@/lib/posts/actions";
import { canSubmit, type PostStatus } from "@/lib/posts/state-machine";
import type { PostActionState } from "@/lib/posts/types";
import {
  MAX_COVER_BYTES,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
} from "@/lib/posts/validation";

const initialState: PostActionState = {};

type PostEditorProps = {
  postId?: string;
  initial?: {
    title: string;
    summary: string;
    content: string;
    coverUrl: string | null;
    tags: string[];
    status: PostStatus;
  };
};

export function PostEditor({ postId, initial }: PostEditorProps) {
  const [state, formAction, pending] = useActionState(
    savePostAction,
    initialState,
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  return (
    <form
      action={formAction}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <input type="hidden" name="postId" value={postId ?? ""} />

      <div className="space-y-5">
        {initial ? (
          <div className="flex items-center gap-2">
            <StatusBadge status={initial.status} />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            placeholder="给文章起一个标题"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">摘要</Label>
          <Textarea
            id="summary"
            name="summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            maxLength={MAX_SUMMARY_LENGTH}
            rows={2}
            placeholder="一两句话介绍这篇文章"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">正文（Markdown）</Label>
          <Textarea
            id="content"
            name="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={18}
            className="font-mono text-sm leading-6"
            placeholder={"# 小标题\n\n正文内容……"}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover">封面（可选）</Label>
          {initial?.coverUrl ? (
            <Image
              src={initial.coverUrl}
              alt=""
              width={480}
              height={270}
              className="mb-2 aspect-video w-full max-w-xs rounded-lg border object-cover"
            />
          ) : null}
          <Input
            id="cover"
            name="cover"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="cursor-pointer"
          />
          <p className="text-muted-foreground text-xs">
            PNG / JPEG / WebP，最大 {Math.round(MAX_COVER_BYTES / 1024 / 1024)}
            MB。
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">标签</Label>
          <Input
            id="tags"
            name="tags"
            defaultValue={initial?.tags.join(", ") ?? ""}
            placeholder="校园, 随笔（用逗号分隔，最多 5 个）"
          />
        </div>

        {state.error ? (
          <p className="text-destructive text-sm">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-600">{state.success}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" name="intent" value="save" disabled={pending}>
            {pending ? "保存中…" : initial ? "保存修改" : "保存草稿"}
          </Button>
          {!initial || canSubmit(initial.status) ? (
            <Button
              type="submit"
              name="intent"
              value="submit"
              variant="outline"
              disabled={pending}
            >
              提交审核
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2 lg:sticky lg:top-20 lg:self-start">
        <Label>预览</Label>
        <div className="bg-card/70 border-border/70 min-h-[28rem] rounded-2xl border p-5 shadow-sm">
          {content.trim() ? (
            <Markdown content={content} />
          ) : (
            <p className="text-muted-foreground text-sm">
              开始输入后，这里会显示渲染结果。
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
