import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  Receipt,
  Settings,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Not yet implemented — rendered as "coming soon" until its phase lands. */
  planned?: boolean;
};

/**
 * The four most frequent areas. These fill the mobile bottom bar alongside the
 * "More" button, so this list must stay at four entries.
 */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: ClipboardList },
  { href: "/people", label: "People", icon: Users },
  { href: "/members", label: "Members", icon: BadgeCheck },
];

/** Everything else lives behind the "More" sheet on mobile. */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/plans", label: "Membership plans", icon: CreditCard },
  { href: "/coaching", label: "Online coaching", icon: Sparkles },
  { href: "/payments", label: "Payments", icon: Receipt },
  { href: "/exercises", label: "Exercise library", icon: Dumbbell },
  { href: "/workouts", label: "Workout templates", icon: ListChecks },
  { href: "/check-ins", label: "Check-ins", icon: CalendarCheck, planned: true },
  { href: "/settings", label: "Business settings", icon: Settings },
  { href: "/account", label: "My account", icon: UserRound },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
