import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { EditPersonForm } from "../[id]/edit/edit-person-form";

export const metadata: Metadata = { title: "Add customer" };

export default async function NewPersonPage() {
  await requireUser("/people/new");

  return (
    <div className="space-y-5">
      <Link
        href="/people"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Customers
      </Link>

      <PageHeader
        title="Add customer"
        description="For walk-ins who never came through an enquiry."
      />

      <EditPersonForm
        personId={null}
        defaults={{
          name: "",
          phone: "",
          email: "",
          instagramHandle: "",
          fitnessGoal: "",
          notes: "",
        }}
      />
    </div>
  );
}
