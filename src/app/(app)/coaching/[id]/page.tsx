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
  Plus,
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
import { listClientWorkoutPlans } from "@/lib/workouts/queries";
import { listDietPlans } from "@/lib/diet/queries";
import {
  getCheckInSummary,
  listCheckIns,
} from "@/lib/checkins/queries";
import { WeightChart } from "@/components/checkins/weight-chart";
import { CheckInHistory } from "@/components/checkins/checkin-history";
import { DIET_GOAL_LABELS } from "@/lib/diet/constants";
import { WORKOUT_GOAL_LABELS } from "@/lib/workouts/constants";
import { Badge } from "@/components/ui/badge";
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

  const workoutPlans =
    tab === "workouts" ? await listClientWorkoutPlans(client.id) : [];
  const dietPlans = tab === "diet" ? await listDietPlans(client.id) : [];

  const [checkIns, checkInSummary] =
    tab === "check-ins"
      ? await Promise.all([
          listCheckIns(client.id),
          getCheckInSummary(client.id),
        ])
      : [[], null];

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
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              asChild
              className="bg-brand text-brand-foreground hover:bg-brand-strong"
            >
              <Link href={`/coaching/${client.id}/workouts/new`}>
                <Plus className="size-4" />
                New plan
              </Link>
            </Button>
          </div>

          {workoutPlans.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No workout plans yet"
              description="Assign a template — they get their own copy to customise — or build one from scratch."
              action={
                <Button
                  asChild
                  className="bg-brand text-brand-foreground hover:bg-brand-strong"
                >
                  <Link href={`/coaching/${client.id}/workouts/new`}>
                    Create a plan
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {workoutPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/coaching/${client.id}/workouts/${plan.id}`}
                  className="bg-card hover:bg-accent/40 block rounded-xl border px-4 py-3.5 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{plan.name}</p>
                    {plan.active ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Active
                      </span>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Archived
                      </Badge>
                    )}
                    {plan.goal ? (
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                        {WORKOUT_GOAL_LABELS[plan.goal]}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {plan.dayCount} {plan.dayCount === 1 ? "day" : "days"} ·{" "}
                    {plan.exerciseCount}{" "}
                    {plan.exerciseCount === 1 ? "exercise" : "exercises"} · from{" "}
                    {formatDate(plan.startDate, brand.timezone)}
                  </p>

                  {plan.sourceTemplateName ? (
                    <p className="text-muted-foreground/80 mt-0.5 text-xs">
                      From {plan.sourceTemplateName}
                      {plan.customised ? " · customised" : ""}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "diet" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              asChild
              className="bg-brand text-brand-foreground hover:bg-brand-strong"
            >
              <Link href={`/coaching/${client.id}/diet/new`}>
                <Plus className="size-4" />
                New diet plan
              </Link>
            </Button>
          </div>

          {dietPlans.length === 0 ? (
            <EmptyState
              icon={Salad}
              title="No diet plans yet"
              description="Build a plan of meals and foods, with optional targets you set yourself."
              action={
                <Button
                  asChild
                  className="bg-brand text-brand-foreground hover:bg-brand-strong"
                >
                  <Link href={`/coaching/${client.id}/diet/new`}>
                    Create a plan
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {dietPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/coaching/${client.id}/diet/${plan.id}`}
                  className="bg-card hover:bg-accent/40 block rounded-xl border px-4 py-3.5 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{plan.title}</p>
                    {plan.active ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Current
                      </span>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Past
                      </Badge>
                    )}
                    {plan.goal ? (
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                        {DIET_GOAL_LABELS[plan.goal]}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {plan.mealCount} {plan.mealCount === 1 ? "meal" : "meals"} ·{" "}
                    {plan.itemCount}{" "}
                    {plan.itemCount === 1 ? "item" : "items"} · from{" "}
                    {formatDate(plan.startDate, brand.timezone)}
                    {plan.calorieTarget !== null
                      ? ` · ${plan.calorieTarget} kcal target`
                      : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "check-ins" ? (
        <div className="space-y-5">
          <div className="flex justify-end">
            <Button
              asChild
              className="bg-brand text-brand-foreground hover:bg-brand-strong"
            >
              <Link href={`/coaching/${client.id}/check-ins/new`}>
                <Plus className="size-4" />
                Add check-in
              </Link>
            </Button>
          </div>

          {checkIns.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No check-ins yet"
              description="Record weight, adherence and questions from whatever the client sends you — there's no client portal in this MVP."
              action={
                <Button
                  asChild
                  className="bg-brand text-brand-foreground hover:bg-brand-strong"
                >
                  <Link href={`/coaching/${client.id}/check-ins/new`}>
                    Record the first one
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              {checkInSummary && checkInSummary.latestWeight !== null ? (
                <Card className="py-4">
                  <CardContent className="space-y-4 px-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Latest weight
                        </p>
                        <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                          {checkInSummary.latestWeight}
                          <span className="text-base font-normal">
                            {checkInSummary.weightUnit}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Since last
                        </p>
                        <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                          {checkInSummary.lastChange === null
                            ? "—"
                            : `${checkInSummary.lastChange > 0 ? "+" : ""}${checkInSummary.lastChange}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Since start
                        </p>
                        <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                          {checkInSummary.totalChange === null
                            ? "—"
                            : `${checkInSummary.totalChange > 0 ? "+" : ""}${checkInSummary.totalChange}`}
                        </p>
                      </div>
                    </div>

                    <WeightChart
                      series={checkInSummary.series}
                      unit={checkInSummary.weightUnit}
                      timeZone={brand.timezone}
                    />
                  </CardContent>
                </Card>
              ) : null}

              <CheckInHistory
                checkIns={checkIns}
                clientId={client.id}
                timeZone={brand.timezone}
              />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
