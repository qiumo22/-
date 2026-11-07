import type { Metadata } from "next";

import { PostEditor } from "@/components/post-editor";
import { requireActiveUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "写文章",
};

export default async function NewPostPage() {
  await requireActiveUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">写文章</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          用 Markdown 写作。保存草稿后可以继续修改，提交审核后由管理员处理。
        </p>
      </div>

      <PostEditor />
    </div>
  );
}
