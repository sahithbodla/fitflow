import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getPerson } from "@/lib/people/queries";
import { getCoachingClientForPerson } from "@/lib/coaching/queries";
import { todayInputValue } from "@/lib/memberships/dates";
import { createCoachingClientAction } from "@/lib/actions/coaching";
import { CoachingForm } from "../coaching-form";

export const metadata: Metadata = { title: "Start coaching" };

export default async function NewCoachingClientPage({
  searchParams,
}: PageProps<"/coaching/new">) {
  await requireUser("/coaching/new");

  const params = await searchParams;
  const personId = typeof params.person === "string" ? params.person : "";

  const person = personId ? await getPerson(personId) : null;
  if (!person) notFound();

  // One engagement per customer — send them to the existing one rather than
  // creating a parallel record.
  const existing = await getCoachingClientForPerson(person.id);
  if (existing) redirect(`/coaching/${existing.id}`);

  const brand = await getBrandSettings();

  return (
    <div className="space-y-5">
      <Link
        href={`/people/${person.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {person.name}
      </Link>

      <PageHeader
        title="Start online coaching"
        description={`Set up ${person.name} as a coaching client.`}
      />

      <CoachingForm
        action={createCoachingClientAction}
        personId={person.id}
        personName={person.name}
        submitLabel="Start coaching"
        cancelHref={`/people/${person.id}`}
        showStatus={false}
        defaults={{
          status: "active",
          startDate: todayInputValue(brand.timezone),
          endDate: "",
          goal: person.fitnessGoal,
          notes: "",
        }}
      />
    </div>
  );
}
