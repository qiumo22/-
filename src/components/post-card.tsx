import Image from "next/image";
import Link from "next/link";

import { formatDate } from "@/lib/format";
import type { PublicPost } from "@/lib/posts/queries";

export function PostCard({ post }: { post: PublicPost }) {
  return (
    <article className="rounded-xl border p-5">
      <div className="flex gap-5">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">
            <Link href={`/posts/${post.slug}`} className="hover:underline">
              {post.title}
            </Link>
          </h2>

          {post.summary ? (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {post.summary}
            </p>
          ) : null}

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {post.author ? (
              <Link
                href={`/authors/${post.author.username}`}
                className="hover:text-foreground"
              >
                {post.author.display_name}
              </Link>
            ) : (
              <span>未知作者</span>
            )}
            <span>·</span>
            <time dateTime={post.published_at ?? undefined}>
              {formatDate(post.published_at)}
            </time>
            {post.tags.length > 0 ? (
              <>
                <span>·</span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="hover:text-foreground"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </>
            ) : null}
          </div>
        </div>

        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt=""
            width={160}
            height={96}
            className="hidden h-24 w-40 shrink-0 rounded-lg border object-cover sm:block"
          />
        ) : null}
      </div>
    </article>
  );
}
