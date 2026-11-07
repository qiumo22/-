"use client";

import "@waline/client/waline.css";

import { useEffect, useRef } from "react";

export function Comments({ path }: { path: string }) {
  const container = useRef<HTMLDivElement>(null);
  const serverURL = process.env.NEXT_PUBLIC_WALINE_URL;

  useEffect(() => {
    if (!serverURL || !container.current) return;

    let instance: { destroy: () => void } | null = null;
    let cancelled = false;

    import("@waline/client")
      .then(({ init }) => {
        if (cancelled || !container.current) return;

        instance = init({
          el: container.current,
          serverURL,
          path,
          lang: "zh-CN",
          dark: "html.dark",
        });
      })
      .catch(() => {
        // Comments are optional; the article remains readable.
      });

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [path, serverURL]);

  if (!serverURL) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
        评论功能尚未配置。
      </p>
    );
  }

  return <div ref={container} />;
}
