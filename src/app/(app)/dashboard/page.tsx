import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Rocket,
  Settings,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Phase 0 dashboard shell.
 *
 * Counts are hard zeros because none of the underlying collections exist yet —
 * they are wired to real queries in later phases. Nothing here is fabricated.
 */
const PLACEHOLDER_STATS = [
  { label: "New leads", icon: ClipboardList, tone: "brand" as const },
  { label: "Follow-ups due", icon: CalendarCheck, tone: "warning" as const },
  { label: "Active memberships", icon: Users, tone: "default" as const },
  { label: "Expiring in 7 days", icon: TriangleAlert, tone: "danger" as const },
  { label: "Coaching clients", icon: Sparkles, tone: "default" as const },
  { label: "Payments this month", icon: CreditCard, tone: "default" as const },
];

const SETUP_STEPS = [
  {
    title: "Set up your business details",
    description:
      "Name, colours and contact info power the landing page, public lead form and every screen in the app.",
    href: "/settings",
    cta: "Open settings",
    done: false,
  },
  {
    title: "Capture your first leads",
    description:
      "Share the public enquiry form or add walk-ins manually. Arriving in the next phase.",
    href: null,
    cta: "Coming soon",
    done: false,
  },
  {
    title: "Create membership plans",
    description:
      "Define gym and personal-training plans with default durations and prices.",
    href: null,
    cta: "Coming soon",
    done: false,
  },
];

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const brand = await getBrandSettings();

  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Hi ${firstName}`}
        description={`Here's the current state of ${brand.businessName}.`}
      />

      <section aria-labelledby="overview-heading" className="space-y-3">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {PLACEHOLDER_STATS.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={0}
              icon={stat.icon}
              tone={stat.tone}
            />
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          Every figure above is a live count. They stay at zero until you start
          adding data.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="text-brand size-4.5" />
            Get set up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SETUP_STEPS.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col gap-3 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 gap-3">
                <span
                  className="bg-muted text-muted-foreground mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-sm text-pretty">
                    {step.description}
                  </p>
                </div>
              </div>

              {step.href ? (
                <Button asChild size="sm" variant="outline" className="shrink-0 sm:ml-4">
                  <Link href={step.href}>
                    {step.cta}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled
                  className="shrink-0 sm:ml-4"
                >
                  {step.cta}
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="text-muted-foreground size-4.5" />
            Your public pages
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" size="sm">
            <Link href="/" target="_blank">
              View landing page
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/lead" target="_blank">
              View enquiry form
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
