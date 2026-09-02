"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  isActivePath,
  type NavItem,
} from "@/components/layout/nav-items";
import type { CurrentUser } from "@/lib/auth/guard";

function MoreSheetLink({
  item,
  onNavigate,
  active,
}: {
  item: NavItem;
  onNavigate: () => void;
  active: boolean;
}) {
  const Icon = item.icon;

  if (item.planned) {
    return (
      <div
        className="text-muted-foreground flex items-center gap-3 rounded-lg px-3 py-3"
        aria-disabled
      >
        <Icon className="size-5 shrink-0" />
        <span className="flex-1 text-sm">{item.label}</span>
        <Badge variant="secondary" className="text-[10px]">
          Soon
        </Badge>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "hover:bg-accent flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
        active && "bg-brand-soft text-brand font-medium",
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="flex-1 text-sm">{item.label}</span>
    </Link>
  );
}

export function BottomNav({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      aria-label="Main"
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
    >
      <div className="pb-safe grid grid-cols-5">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          if (item.planned) {
            return (
              <span
                key={item.href}
                aria-disabled
                className="text-muted-foreground/45 flex flex-col items-center gap-1 py-2.5 text-[11px]"
              >
                <Icon className="size-5" />
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
                active ? "text-brand font-medium" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground flex flex-col items-center gap-1 py-2.5 text-[11px]"
            >
              <Menu className="size-5" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>
                Signed in as {user.email}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-1 px-4 pb-4">
              {SECONDARY_NAV.map((item) => (
                <MoreSheetLink
                  key={item.href}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  onNavigate={() => setOpen(false)}
                />
              ))}

              <Separator className="my-3" />

              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="text-destructive hover:text-destructive w-full justify-start gap-3 px-3 py-3"
                >
                  <LogOut className="size-5" />
                  Sign out
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
