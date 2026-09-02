import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getPlan } from "@/lib/memberships/queries";
import { PlanForm } from "../../plan-form";

export const metadata: Metadata = { title: "Edit plan" };

export default async function EditPlanPage({
  params,
}: PageProps<"/plans/[id]/edit">) {
  const { id } = await params;
  await requireUser(`/plans/${id}/edit`);

  const brand = await getBrandSettings();
  const plan = await getPlan(id);
  if (!plan) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/plans"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Plans
      </Link>

      <PageHeader
        title="Edit plan"
        description={
          plan.membershipCount > 0
            ? `${plan.membershipCount} membership${plan.membershipCount === 1 ? "" : "s"} were sold on this plan. Changes here do not affect them.`
            : undefined
        }
      />

      <PlanForm
        planId={plan.id}
        currency={brand.currency}
        defaults={{
          name: plan.name,
          category: plan.category,
          description: plan.description,
          defaultDurationDays:
            plan.defaultDurationDays !== null
              ? String(plan.defaultDurationDays)
              : "",
          defaultPrice:
            plan.defaultPrice !== null ? String(plan.defaultPrice) : "",
          active: plan.active,
        }}
      />
    </div>
  );
}
