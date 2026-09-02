import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { BrandWordmark } from "@/components/branding/brand-mark";
import { getBrandSettings } from "@/lib/settings";
import { PublicLeadForm } from "./lead-form";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return {
    title: "Enquire",
    description: `Send an enquiry to ${brand.businessName} about gym membership, personal training or online coaching.`,
  };
}

// Branding is read from the database on every request, so this route must not
// be baked into the build output.
export const dynamic = "force-dynamic";

export default async function PublicLeadPage() {
  const brand = await getBrandSettings();

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="pt-safe px-5 pt-6">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-5 py-8">
        <div className="mb-8 flex justify-center">
          <BrandWordmark brand={brand} size={40} className="flex-col gap-3 text-base" />
        </div>

        <PublicLeadForm brand={brand} />
      </div>
    </main>
  );
}
