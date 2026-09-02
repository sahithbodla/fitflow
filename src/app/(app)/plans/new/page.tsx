import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { PlanForm } from "../plan-form";

export const metadata: Metadata = { title: "New plan" };

export default async function NewPlanPage() {
  await requireUser("/plans/new");
  const brand = await getBrandSettings();

  return (
    <div className="space-y-5">
      <Link
        href="/plans"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Plans
      </Link>

      <PageHeader title="New plan" />

      <PlanForm
        planId={null}
        currency={brand.currency}
        defaults={{
          name: "",
          category: "gym",
          description: "",
          defaultDurationDays: "",
          defaultPrice: "",
          active: true,
        }}
      />
    </div>
  );
}
