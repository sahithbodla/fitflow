import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { NewLeadForm } from "./new-lead-form";

export const metadata: Metadata = { title: "Add lead" };

export default async function NewLeadPage() {
  await requireUser("/leads/new");

  return (
    <div className="space-y-5">
      <Link
        href="/leads"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Leads
      </Link>

      <PageHeader
        title="Add lead"
        description="For walk-ins, phone enquiries and messages."
      />

      <NewLeadForm />
    </div>
  );
}
