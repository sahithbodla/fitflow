"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side details stay on the server; only the digest is exposed.
    console.error("Unhandled application error", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <span
        className="bg-destructive/10 text-destructive mb-5 grid size-12 place-items-center rounded-full"
        aria-hidden
      >
        <TriangleAlert className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm text-pretty">
        The page couldn&rsquo;t be loaded. Try again — if it keeps happening,
        check the server logs.
      </p>
      {error.digest ? (
        <p className="text-muted-foreground/70 mt-3 font-mono text-xs">
          Reference: {error.digest}
        </p>
      ) : null}
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </main>
  );
}
