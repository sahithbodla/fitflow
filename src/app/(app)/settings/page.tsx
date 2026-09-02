import type { Metadata } from "next";
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
    </div>
  );
}
