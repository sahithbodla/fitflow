"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  isActivePath,
  type NavItem,
} from "@/components/layout/nav-items";
import { BrandWordmark } from "@/components/branding/brand-mark";
import type { BrandSettings } from "@/lib/settings";
import type { CurrentUser } from "@/lib/auth/guard";

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  if (item.planned) {
    return (
      <div
        aria-disabled
        className="text-muted-foreground/60 flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        <Badge variant="secondary" className="text-[10px]">
          Soon
        </Badge>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "hover:bg-accent flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active && "bg-brand-soft text-brand font-medium hover:bg-brand-soft",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function SidebarNav({
  brand,
  user,
}: {
  brand: BrandSettings;
  user: CurrentUser;
}) {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar hidden w-64 shrink-0 flex-col border-r md:sticky md:top-0 md:flex md:h-dvh">
      <div className="px-4 py-5">
        <Link href="/dashboard">
          <BrandWordmark brand={brand} size={32} />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3">
        {PRIMARY_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isActivePath(pathname, item.href)}
          />
        ))}

        <p className="text-muted-foreground px-3 pt-5 pb-1 text-[11px] font-medium tracking-wide uppercase">
          Manage
        </p>

        {SECONDARY_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isActivePath(pathname, item.href)}
          />
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-muted-foreground truncate text-xs">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive w-full justify-start gap-3 px-3"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
