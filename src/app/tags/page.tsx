import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "标签",
};

type TagRow = {
  id: string;
  name: string;
  slug: string;
};

export default async function TagsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("id,name,slug")
    .order("name");

  const tags = (data ?? []) as TagRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">标签</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          按主题浏览校园写作。
        </p>
      </div>

      {tags.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          还没有标签。
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary rounded-full px-3 py-1.5 text-sm transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
