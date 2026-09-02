import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/branding/brand-mark";
import { getBrandSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Enquire",
  description: "Send an enquiry and we'll get back to you.",
};

/**
 * Placeholder. The real capture form (name, phone, interest, goal) is built in
 * the Lead CRM phase — this route exists now so landing-page CTAs never 404.
 */
// Branding is read from the database on every request, so this route must not
// be baked into the build output.
export const dynamic = "force-dynamic";

export default async function PublicLeadPage() {
  const brand = await getBrandSettings();

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-8">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 self-start text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <BrandWordmark brand={brand} size={44} className="mb-6 flex-col gap-3 text-lg" />

          <span
            className="bg-brand-soft text-brand mb-5 grid size-12 place-items-center rounded-full"
            aria-hidden
          >
            <Construction className="size-6" />
          </span>

          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Enquiry form coming soon
          </h1>
          <p className="text-muted-foreground mt-3 max-w-sm text-sm text-pretty">
            We&rsquo;re putting the finishing touches on this. In the meantime,
            reach out directly and we&rsquo;ll get straight back to you.
          </p>

          <div className="mt-7 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            {brand.contactPhone ? (
              <Button
                asChild
                size="lg"
                className="bg-brand text-brand-foreground hover:bg-brand-strong w-full sm:w-auto"
              >
                <a href={`tel:${brand.contactPhone.replace(/\s+/g, "")}`}>
                  Call {brand.contactPhone}
                </a>
              </Button>
            ) : null}
            {brand.contactEmail ? (
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <a href={`mailto:${brand.contactEmail}`}>Email us</a>
              </Button>
            ) : null}
            {!brand.contactPhone && !brand.contactEmail ? (
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/">Back to home</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
