"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">页面出错了</h1>
      <p className="text-muted-foreground text-sm">
        刚才的操作没有完成。可以重试，或者稍后再回来。
      </p>
      <Button type="button" onClick={reset}>
        重试
      </Button>
    </div>
  );
}
