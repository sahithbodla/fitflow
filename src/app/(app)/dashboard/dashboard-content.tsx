import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Sparkles,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/layout/stat-card";
import { EmptyState } from "@/components/layout/empty-state";
import { getDashboardMetrics, isFreshInstall } from "@/lib/dashboard";
import { DEFAULT_BRAND, type BrandSettings } from "@/lib/settings";

/**
 * The dashboard body. Split out from the page so it can be wrapped in Suspense
 * and stream in behind a skeleton while the metric queries run.
 */
export async function DashboardContent({ brand }: { brand: BrandSettings }) {
  const metrics = await getDashboardMetrics(brand.timezone);
  const fresh = isFreshInstall(metrics);

  const brandingConfigured =
    brand.businessName !== DEFAULT_BRAND.businessName ||
    brand.primaryColor !== DEFAULT_BRAND.primaryColor;
  const contactConfigured = Boolean(brand.contactPhone || brand.contactEmail);

  const attention = [
    {
      label: "Follow-ups due",
      value: metrics.followUpsDue,
      icon: CalendarCheck,
      tone: "warning" as const,
      hint: "Leads to contact today or overdue",
    },
    {
      label: "Expiring in 7 days",
      value: metrics.expiringSoon,
      icon: TriangleAlert,
      tone: "warning" as const,
      hint: "Memberships to renew",
    },
    {
      label: "Expired",
      value: metrics.expired,
      icon: TriangleAlert,
      tone: "danger" as const,
      hint: "Lapsed memberships",
    },
  ];

  const overview = [
    {
      label: "New leads",
      value: metrics.newLeads,
      icon: ClipboardList,
      tone: "brand" as const,
    },
    {
      label: "Gym memberships",
      value: metrics.activeGymMemberships,
      icon: Users,
      tone: "default" as const,
      hint: "Active",
    },
    {
      label: "PT clients",
      value: metrics.activePtMemberships,
      icon: Dumbbell,
      tone: "default" as const,
      hint: "Active",
    },
    {
      label: "Coaching clients",
      value: metrics.activeCoachingClients,
      icon: Sparkles,
      tone: "default" as const,
      hint: "Active",
    },
    {
      label: "Check-ins",
      value: metrics.checkInsThisWeek,
      icon: CalendarCheck,
      tone: "default" as const,
      hint: "Last 7 days",
    },
    {
      label: "Payments",
      value: metrics.paymentsThisMonth,
      icon: CreditCard,
      tone: "default" as const,
      hint: "This month",
    },
  ];

  const setupSteps = [
    {
      title: "Add your business details",
      description:
        "Name, colours and contact info drive your landing page, the public enquiry form and every screen here.",
      href: "/settings",
      cta: "Open settings",
      done: brandingConfigured && contactConfigured,
    },
    {
      title: "Set your account details",
      description: "Change the name and email you sign in with.",
      href: "/account",
      cta: "Open account",
      done: false,
    },
    {
      title: "Start capturing leads",
      description:
        "Share the public enquiry form, or add walk-ins manually. Arriving in the next phase.",
      href: null,
      cta: "Coming soon",
      done: false,
    },
  ];

  const attentionTotal = attention.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-7">
      {metrics.degraded ? (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Couldn&rsquo;t load your figures</AlertTitle>
          <AlertDescription>
            The database is unreachable, so the numbers below may be out of date.
            Check the server configuration and refresh.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Needs attention — the reason to open this screen each morning. */}
      <section aria-labelledby="attention-heading" className="space-y-3">
        <h2 id="attention-heading" className="text-sm font-medium">
          Needs attention
        </h2>

        {attentionTotal === 0 ? (
          <div className="bg-muted/40 flex items-center gap-3 rounded-xl border px-4 py-4">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              aria-hidden
            >
              <CheckCircle2 className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Nothing needs chasing</p>
              <p className="text-muted-foreground mt-0.5 text-xs text-pretty">
                Follow-ups and expiring memberships will appear here as soon as
                you have some.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {attention.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
                icon={item.icon}
                tone={item.tone}
              />
            ))}
          </div>
        )}
      </section>

      {/* Overview */}
      <section aria-labelledby="overview-heading" className="space-y-3">
        <h2 id="overview-heading" className="text-sm font-medium">
          Overview
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {overview.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              hint={item.hint}
              icon={item.icon}
              tone={item.tone}
            />
          ))}
        </div>
      </section>

      {/* Onboarding — only while the workspace is genuinely empty. */}
      {fresh ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Get set up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {setupSteps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-3 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 gap-3">
                  {step.done ? (
                    <CheckCircle2
                      className="mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-label="Done"
                    />
                  ) : (
                    <span
                      className="bg-muted text-muted-foreground mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm text-pretty">
                      {step.description}
                    </p>
                  </div>
                </div>

                {step.href ? (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="shrink-0 sm:ml-4"
                  >
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
      ) : (
        <section aria-labelledby="recent-heading" className="space-y-3">
          <h2 id="recent-heading" className="text-sm font-medium">
            Recent activity
          </h2>
          <EmptyState
            icon={ClipboardList}
            title="No activity feed yet"
            description="Lead and membership activity will be summarised here once those features land."
          />
        </section>
      )}

      {/* Quick links */}
      <section aria-labelledby="links-heading" className="space-y-3">
        <h2 id="links-heading" className="text-sm font-medium">
          Quick links
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickLink
            href="/settings"
            icon={Sparkles}
            title="Business settings"
            description="Branding, contact details and defaults"
          />
          <QuickLink
            href="/account"
            icon={UserRound}
            title="My account"
            description="Your name, email and password"
          />
          <QuickLink
            href="/"
            icon={ArrowRight}
            title="View landing page"
            description="What visitors see"
            external
          />
          <QuickLink
            href="/lead"
            icon={ClipboardList}
            title="View enquiry form"
            description="What leads fill in"
            external
          />
        </div>
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
  external,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="bg-card hover:border-brand/40 hover:bg-accent/40 flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors"
    >
      <span
        className="bg-brand-soft text-brand grid size-9 shrink-0 place-items-center rounded-lg"
        aria-hidden
      >
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-muted-foreground block truncate text-xs">
          {description}
        </span>
      </span>
    </Link>
  );
}
