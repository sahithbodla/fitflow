import Link from "next/link";
import type { Metadata } from "next";
import { CreditCard, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { listPlans } from "@/lib/memberships/queries";
import { formatCurrency } from "@/lib/dates";
import {
  MEMBERSHIP_CATEGORIES,
  MEMBERSHIP_CATEGORY_LABELS,
} from "@/lib/memberships/constants";
import { TogglePlanButton } from "./toggle-plan";

export const metadata: Metadata = { title: "Membership plans" };

export default async function PlansPage() {
  await requireUser("/plans");
  const brand = await getBrandSettings();
  const plans = await listPlans();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Membership plans"
        description="What you sell. Used to prefill new memberships."
        actions={
          <Button
            asChild
            className="bg-brand text-brand-foreground hover:bg-brand-strong"
          >
            <Link href="/plans/new">
              <Plus className="size-4" />
              New plan
            </Link>
          </Button>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No plans yet"
          description="Create the memberships and packages you sell, like '3 Month Gym' or '12 PT Sessions'."
          action={
            <Button
              asChild
              className="bg-brand text-brand-foreground hover:bg-brand-strong"
            >
              <Link href="/plans/new">
                <Plus className="size-4" />
                Create your first plan
              </Link>
            </Button>
          }
        />
      ) : (
        MEMBERSHIP_CATEGORIES.map((category) => {
          const categoryPlans = plans.filter(
            (plan) => plan.category === category,
          );
          if (categoryPlans.length === 0) return null;

          return (
            <section key={category} className="space-y-3">
              <h2 className="text-sm font-medium">
                {MEMBERSHIP_CATEGORY_LABELS[category]}
              </h2>

              <div className="space-y-2.5">
                {categoryPlans.map((plan) => (
                  <Card key={plan.id} className="py-4">
                    <CardHeader className="px-4 pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                            {plan.name}
                            {!plan.active ? (
                              <Badge variant="secondary" className="text-[10px]">
                                Inactive
                              </Badge>
                            ) : null}
                          </CardTitle>
                          {plan.description ? (
                            <p className="text-muted-foreground mt-1 text-sm text-pretty">
                              {plan.description}
                            </p>
                          ) : null}
                        </div>

                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                        >
                          <Link href={`/plans/${plan.id}/edit`}>
                            <Pencil className="size-4" />
                            <span className="sr-only">Edit {plan.name}</span>
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3">
                      <span className="text-muted-foreground text-sm">
                        {plan.defaultDurationDays
                          ? `${plan.defaultDurationDays} days`
                          : "No default duration"}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {plan.defaultPrice !== null
                          ? formatCurrency(plan.defaultPrice, brand.currency)
                          : "No default price"}
                      </span>
                      <span className="text-muted-foreground/80 text-xs">
                        {plan.membershipCount} sold
                      </span>

                      <TogglePlanButton
                        planId={plan.id}
                        planName={plan.name}
                        active={plan.active}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
