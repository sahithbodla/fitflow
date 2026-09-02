import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const brand = await getBrandSettings();

  const firstName = user.name.split(" ")[0] ?? user.name;
  const hourInBusinessZone = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: brand.timezone,
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );

  return (
    <div className="space-y-7">
      <PageHeader
        title={`${greeting(hourInBusinessZone)}, ${firstName}`}
        description={`Here's where ${brand.businessName} stands today.`}
      />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent brand={brand} />
      </Suspense>
    </div>
  );
}
