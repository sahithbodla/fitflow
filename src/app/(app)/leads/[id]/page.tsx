import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  AtSign,
  CalendarPlus,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import {
  FollowUpBadge,
  LeadStatusBadge,
} from "@/components/leads/lead-badges";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getLead } from "@/lib/leads/queries";
import { formatDate, zonedParts } from "@/lib/dates";
import {
  LEAD_INTEREST_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/lib/leads/constants";
import { telHref, whatsAppHref } from "@/lib/leads/phone";
import {
  AddNoteForm,
  ArchiveLeadButton,
  FollowUpControl,
  StatusSwitcher,
} from "./lead-actions";
import { ActivityTimeline } from "./activity-timeline";

export async function generateMetadata({
  params,
}: PageProps<"/leads/[id]">): Promise<Metadata> {
  const { id } = await params;
  const lead = await getLead(id);
  return { title: lead ? lead.name : "Lead" };
}

/** Formats an instant as the `yyyy-mm-dd` a date input expects. */
function toDateInputValue(iso: string | null, timeZone: string): string {
  if (!iso) return "";
  const { year, month, day } = zonedParts(new Date(iso), timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default async function LeadDetailPage({
  params,
}: PageProps<"/leads/[id]">) {
  const { id } = await params;
  await requireUser(`/leads/${id}`);

  const brand = await getBrandSettings();
  const lead = await getLead(id);
  if (!lead) notFound();

  const contactRows = [
    {
      icon: Phone,
      label: "Phone",
      value: lead.phone,
      href: `tel:${telHref(lead.phone)}`,
    },
    lead.email
      ? {
          icon: Mail,
          label: "Email",
          value: lead.email,
          href: `mailto:${lead.email}`,
        }
      : null,
    lead.instagramHandle
      ? {
          icon: AtSign,
          label: "Instagram",
          value: lead.instagramHandle,
          href: `https://instagram.com/${lead.instagramHandle}`,
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
        href="/leads"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Leads
      </Link>

      <PageHeader
        title={lead.name}
        description={`${LEAD_INTEREST_LABELS[lead.interestedIn]} · ${
          LEAD_SOURCE_LABELS[lead.source]
        } · Added ${formatDate(lead.createdAt, brand.timezone)}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/leads/${lead.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <LeadStatusBadge status={lead.status} />
        <FollowUpBadge date={lead.followUpDate} timeZone={brand.timezone} />
      </div>

      {/* Quick contact actions, thumb-reachable on mobile. */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button asChild variant="outline" className="justify-center">
          <a href={`tel:${telHref(lead.phone)}`}>
            <Phone className="size-4" />
            Call
          </a>
        </Button>
        <Button asChild variant="outline" className="justify-center">
          <a
            href={whatsAppHref(lead.phone)}
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
          <StatusSwitcher leadId={lead.id} current={lead.status} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity &amp; notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <AddNoteForm leadId={lead.id} />
              <ActivityTimeline
                activity={lead.activity}
                timeZone={brand.timezone}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <FollowUpControl
            key={lead.followUpDate ?? "none"}
            leadId={lead.id}
            followUpDate={toDateInputValue(lead.followUpDate, brand.timezone)}
          />

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

          {lead.fitnessGoal ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="text-muted-foreground size-4" />
                  Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{lead.fitnessGoal}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarPlus className="text-muted-foreground size-4" />
                Next step
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm text-pretty">
                Converting a lead into a member or coaching client arrives in the
                next phase.
              </p>
              <Button disabled variant="outline" size="sm" className="w-full">
                Convert lead
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-1">
            <ArchiveLeadButton leadId={lead.id} leadName={lead.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
