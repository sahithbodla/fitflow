import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Salad,
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

/** The four most frequent areas: these become the mobile bottom bar. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: ClipboardList, planned: true },
  { href: "/members", label: "Members", icon: Users, planned: true },
  { href: "/coaching", label: "Coaching", icon: Sparkles, planned: true },
];

/** Everything else lives behind the "More" sheet on mobile. */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/plans", label: "Membership plans", icon: CreditCard, planned: true },
  { href: "/payments", label: "Payments", icon: CreditCard, planned: true },
  { href: "/exercises", label: "Exercise library", icon: Dumbbell, planned: true },
  { href: "/workouts", label: "Workout templates", icon: Dumbbell, planned: true },
  { href: "/diet", label: "Diet plans", icon: Salad, planned: true },
  { href: "/check-ins", label: "Check-ins", icon: CalendarCheck, planned: true },
  { href: "/settings", label: "Business settings", icon: Settings },
  { href: "/account", label: "My account", icon: UserRound, planned: true },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
