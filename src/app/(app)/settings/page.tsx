import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { ensureBrandSettings, getBrandSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Business settings" };

export default async function SettingsPage() {
  await requireUser("/settings");
  await ensureBrandSettings();
  const brand = await getBrandSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business settings"
        description="Your branding, contact details and defaults."
      />
      <SettingsForm brand={brand} />

      <Link
        href="/settings/audit-logs"
        className="bg-card hover:border-brand/40 hover:bg-accent/40 flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors"
      >
        <span
          className="bg-brand-soft text-brand grid size-9 shrink-0 place-items-center rounded-lg"
          aria-hidden
        >
          <ScrollText className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Audit log</span>
          <span className="text-muted-foreground block truncate text-xs">
            Who did what, and when
          </span>
        </span>
        <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </Link>
    </div>
  );
}
