import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getPerson } from "@/lib/people/queries";
import { EditPersonForm } from "./edit-person-form";

export const metadata: Metadata = { title: "Edit customer" };

export default async function EditPersonPage({
  params,
}: PageProps<"/people/[id]/edit">) {
  const { id } = await params;
  await requireUser(`/people/${id}/edit`);

  const person = await getPerson(id);
  if (!person) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/people/${person.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {person.name}
      </Link>

      <PageHeader title="Edit customer" />

      <EditPersonForm
        personId={person.id}
        defaults={{
          name: person.name,
          phone: person.phone,
          email: person.email,
          instagramHandle: person.instagramHandle,
          fitnessGoal: person.fitnessGoal,
          notes: person.notes,
        }}
      />
    </div>
  );
}
