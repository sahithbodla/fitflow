import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarCheck,
  ClipboardList,
  Dumbbell,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Salad,
  Target,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { CoachingStatusBadge } from "@/components/people/person-badges";
import {
  CoachingTabs,
  parseCoachingTab,
} from "@/components/coaching/coaching-tabs";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getCoachingClient } from "@/lib/coaching/queries";
import { formatDate } from "@/lib/dates";
import { LEAD_SOURCE_LABELS } from "@/lib/leads/constants";
import { telHref, whatsAppHref } from "@/lib/leads/phone";
import { CoachingStatusSwitcher } from "./coaching-status";

export async function generateMetadata({
  params,
}: PageProps<"/coaching/[id]">): Promise<Metadata> {
  const { id } = await params;
  const client = await getCoachingClient(id);
  return { title: client ? client.personName : "Coaching client" };
}

export default async function CoachingClientPage({
  params,
  searchParams,
}: PageProps<"/coaching/[id]">) {
  const { id } = await params;
  await requireUser(`/coaching/${id}`);

  const brand = await getBrandSettings();
  const client = await getCoachingClient(id);
  if (!client) notFound();

  const query = await searchParams;
  const tab = parseCoachingTab(query.tab);

  return (
    <div className="space-y-5">
      <Link
        href="/coaching"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Online coaching
      </Link>

      <PageHeader
        title={client.personName}
        description={`Coaching since ${formatDate(client.startDate, brand.timezone)}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/coaching/${client.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <CoachingStatusBadge status={client.status} />
        {client.endDate ? (
          <span className="text-muted-foreground text-sm">
            Ended {formatDate(client.endDate, brand.timezone)}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button asChild variant="outline" className="justify-center">
          <a href={`tel:${telHref(client.personPhone)}`}>
            <Phone className="size-4" />
            Call
          </a>
        </Button>
        <Button asChild variant="outline" className="justify-center">
          <a
            href={whatsAppHref(client.personPhone)}
            target="_blank"
            rel="noreferrer noopener"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        </Button>
      </div>

      <CoachingTabs clientId={client.id} current={tab} />

      {tab === "overview" ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <CoachingStatusSwitcher
                  clientId={client.id}
                  current={client.status}
                />
              </CardContent>
            </Card>

            {client.goal ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="text-muted-foreground size-4" />
                    Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{client.goal}</p>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">Coach notes</CardTitle>
                  <Button asChild size="sm" variant="ghost" className="shrink-0">
                    <Link href={`/coaching/${client.id}/edit`}>
                      {client.notes ? "Edit" : "Add"}
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {client.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nothing noted yet. Injuries, preferences, anything worth
                    remembering.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="text-muted-foreground size-4" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href={`tel:${telHref(client.personPhone)}`}
                  className="hover:text-brand flex items-start gap-2.5 text-sm transition-colors"
                >
                  <Phone
                    className="text-muted-foreground mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  <span>{client.personPhone}</span>
                </a>

                {client.personEmail ? (
                  <a
                    href={`mailto:${client.personEmail}`}
                    className="hover:text-brand flex items-start gap-2.5 text-sm transition-colors"
                  >
                    <Mail
                      className="text-muted-foreground mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    <span className="break-words">{client.personEmail}</span>
                  </a>
                ) : null}

                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/people/${client.personId}`}>
                    Open customer profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {client.sourceLead ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="text-muted-foreground size-4" />
                    Original enquiry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    {LEAD_SOURCE_LABELS[client.sourceLead.source]}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(client.sourceLead.createdAt, brand.timezone)}
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/leads/${client.sourceLead.id}`}>
                      View lead history
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "workouts" ? (
        <EmptyState
          icon={Dumbbell}
          title="Workouts arrive in the next phase"
          description="Assigning workout templates and building custom plans for this client."
        />
      ) : null}

      {tab === "diet" ? (
        <EmptyState
          icon={Salad}
          title="Diet plans arrive in a later phase"
          description="Structured meal plans with optional calorie and macro targets."
        />
      ) : null}

      {tab === "check-ins" ? (
        <EmptyState
          icon={CalendarCheck}
          title="Check-ins arrive in a later phase"
          description="Weekly weight, adherence and questions, recorded by you."
        />
      ) : null}
    </div>
  );
}
