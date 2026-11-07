import Image from "next/image";
import Link from "next/link";

import { formatDate } from "@/lib/format";
import type { PublicPost } from "@/lib/posts/queries";

export function PostCard({ post }: { post: PublicPost }) {
  return (
    <article className="bg-card/85 border-border/70 hover:border-primary/30 group rounded-2xl border p-5 shadow-[0_18px_40px_-30px_rgba(232,106,146,0.55)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(232,106,146,0.65)]">
      <div className="flex gap-5">
        <div className="min-w-0 flex-1 space-y-2.5">
          <h2 className="font-heading text-xl leading-snug font-semibold tracking-tight">
            <Link
              href={`/posts/${post.slug}`}
              className="group-hover:text-primary transition-colors"
            >
              {post.title}
            </Link>
          </h2>

          {post.summary ? (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {post.summary}
            </p>
          ) : null}

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
            {post.author ? (
              <Link
                href={`/authors/${post.author.username}`}
                className="hover:text-primary transition-colors"
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
                    className="bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary rounded-full px-2 py-0.5 transition-colors"
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
            className="border-border/60 hidden h-24 w-40 shrink-0 rounded-xl border object-cover shadow-sm sm:block"
          />
        ) : null}
      </div>
    </article>
  );
}
