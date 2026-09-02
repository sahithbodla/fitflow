import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  AtSign,
  ClipboardList,
  CreditCard,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import {
  CoachingStatusBadge,
  PersonTypeChip,
} from "@/components/people/person-badges";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getPerson } from "@/lib/people/queries";
import { formatDate } from "@/lib/dates";
import { CONVERSION_TYPE_LABELS } from "@/lib/people/constants";
import { LEAD_SOURCE_LABELS } from "@/lib/leads/constants";
import { telHref, whatsAppHref } from "@/lib/leads/phone";

export async function generateMetadata({
  params,
}: PageProps<"/people/[id]">): Promise<Metadata> {
  const { id } = await params;
  const person = await getPerson(id);
  return { title: person ? person.name : "Customer" };
}

export default async function PersonDetailPage({
  params,
}: PageProps<"/people/[id]">) {
  const { id } = await params;
  await requireUser(`/people/${id}`);

  const brand = await getBrandSettings();
  const person = await getPerson(id);
  if (!person) notFound();

  const types = [...new Set(person.conversions.map((row) => row.type))];

  const contactRows = [
    {
      icon: Phone,
      label: "Phone",
      value: person.phone,
      href: `tel:${telHref(person.phone)}`,
    },
    person.email
      ? {
          icon: Mail,
          label: "Email",
          value: person.email,
          href: `mailto:${person.email}`,
        }
      : null,
    person.instagramHandle
      ? {
          icon: AtSign,
          label: "Instagram",
          value: person.instagramHandle,
          href: `https://instagram.com/${person.instagramHandle}`,
        }
      : null,
  ].filter(Boolean) as {
    icon: typeof Phone;
    label: string;
    value: string;
    href: string;
  }[];

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
        title={person.name}
        description={`Customer since ${formatDate(person.createdAt, brand.timezone)}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/people/${person.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
        }
      />

      {types.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <PersonTypeChip key={type} type={type} />
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button asChild variant="outline" className="justify-center">
          <a href={`tel:${telHref(person.phone)}`}>
            <Phone className="size-4" />
            Call
          </a>
        </Button>
        <Button asChild variant="outline" className="justify-center">
          <a
            href={whatsAppHref(person.phone)}
            target="_blank"
            rel="noreferrer noopener"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          {/* Memberships — populated in the membership phase. */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="text-muted-foreground size-4" />
                Memberships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={CreditCard}
                title="No memberships yet"
                description="Gym and personal-training memberships, renewals and payments arrive in the next phase."
                className="border-0 px-0 py-4"
              />
            </CardContent>
          </Card>

          {/* Coaching */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="text-muted-foreground size-4" />
                Online coaching
              </CardTitle>
            </CardHeader>
            <CardContent>
              {person.coaching ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CoachingStatusBadge status={person.coaching.status} />
                    <span className="text-muted-foreground text-sm">
                      Started{" "}
                      {formatDate(person.coaching.startDate, brand.timezone)}
                    </span>
                  </div>
                  {person.coaching.goal ? (
                    <p className="text-sm whitespace-pre-wrap">
                      {person.coaching.goal}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground text-xs text-pretty">
                    Workouts, diet plans and weekly check-ins arrive in a later
                    phase.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground py-2 text-sm">
                  Not an online coaching client.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Conversion history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">History</CardTitle>
            </CardHeader>
            <CardContent>
              {person.conversions.length === 0 ? (
                <p className="text-muted-foreground py-2 text-sm">
                  Added directly, not from a lead.
                </p>
              ) : (
                <ol className="space-y-4">
                  {person.conversions.map((row) => (
                    <li key={row.id} className="flex gap-3">
                      <span
                        className="bg-muted text-muted-foreground mt-0.5 grid size-7 shrink-0 place-items-center rounded-full"
                        aria-hidden
                      >
                        <Sparkles className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm">
                          Converted to{" "}
                          <span className="font-medium">
                            {CONVERSION_TYPE_LABELS[row.type]}
                          </span>
                          {row.linkedExistingPerson
                            ? " and linked to this existing customer"
                            : ""}
                        </p>
                        <p className="text-muted-foreground/80 mt-0.5 text-xs">
                          {row.actor} ·{" "}
                          {formatDate(row.convertedAt, brand.timezone)}
                        </p>
                        <Link
                          href={`/leads/${row.leadId}`}
                          className="text-brand mt-1 inline-block text-xs hover:underline"
                        >
                          View original lead
                        </Link>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contactRows.map((row) => {
                const Icon = row.icon;
                return (
                  <a
                    key={row.label}
                    href={row.href}
                    target={row.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      row.href.startsWith("http")
                        ? "noreferrer noopener"
                        : undefined
                    }
                    className="hover:text-brand flex items-start gap-2.5 text-sm transition-colors"
                  >
                    <Icon
                      className="text-muted-foreground mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="text-muted-foreground block text-xs">
                        {row.label}
                      </span>
                      <span className="block break-words">{row.value}</span>
                    </span>
                  </a>
                );
              })}
            </CardContent>
          </Card>

          {person.fitnessGoal ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="text-muted-foreground size-4" />
                  Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {person.fitnessGoal}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {person.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{person.notes}</p>
              </CardContent>
            </Card>
          ) : null}

          {person.sourceLead ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="text-muted-foreground size-4" />
                  Original enquiry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  {LEAD_SOURCE_LABELS[person.sourceLead.source]}
                </p>
                <p className="text-muted-foreground text-xs">
                  Enquired{" "}
                  {formatDate(person.sourceLead.createdAt, brand.timezone)}
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/leads/${person.sourceLead.id}`}>
                    View lead history
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
