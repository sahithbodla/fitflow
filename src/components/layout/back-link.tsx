"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

/**
 * A "back" link that actually goes back.
 *
 * A plain `<Link href="/fixed/path">` always lands on the same place, so
 * opening a person from a filtered list (e.g. `/members?state=expired`) and
 * tapping back drops the filter and lands on the generic list instead. This
 * uses real browser history when there is any to go back to — landing
 * exactly where the visitor came from — and falls back to `href` for a
 * direct load, a refresh, or with JavaScript unavailable, where there is no
 * in-app history to return to.
 */
export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
      className={
        className ??
        "text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      }
    >
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  );
}
