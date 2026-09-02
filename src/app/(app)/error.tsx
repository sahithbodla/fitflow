"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Error boundary for the authenticated area. Keeps the shell and navigation in
 * place so a failure on one screen does not strand the user.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error", error.digest ?? error.message);
  }, [error]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <span
          className="bg-destructive/10 text-destructive mb-4 grid size-11 place-items-center rounded-full"
          aria-hidden
        >
          <TriangleAlert className="size-5" />
        </span>
        <p className="font-medium">This screen didn&rsquo;t load</p>
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm text-pretty">
          Something went wrong fetching the data. Try again — if it keeps
          happening, check that the database is reachable.
        </p>
        {error.digest ? (
          <p className="text-muted-foreground/70 mt-3 font-mono text-xs">
            Reference: {error.digest}
          </p>
        ) : null}
        <Button onClick={reset} className="mt-6">
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
