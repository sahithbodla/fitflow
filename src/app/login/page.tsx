import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { BrandWordmark } from "@/components/branding/brand-mark";
import { getBrandSettings } from "@/lib/settings";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const brand = await getBrandSettings();
  const params = await searchParams;
  const nextParam = typeof params.next === "string" ? params.next : undefined;

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="px-5 pt-6 pt-safe">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to site
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <BrandWordmark brand={brand} size={44} className="mb-5 flex-col gap-3 text-lg" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm text-balance">
              Sign in to manage leads, memberships and coaching clients.
            </p>
          </div>

          <LoginForm next={nextParam} />

          <p className="text-muted-foreground mt-8 text-center text-xs leading-relaxed">
            Staff access only. Accounts are created by the business owner using
            the seed command — there is no public sign-up.
          </p>
        </div>
      </div>
    </main>
  );
}
