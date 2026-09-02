import Link from "next/link";
import { BrandWordmark } from "@/components/branding/brand-mark";
import type { BrandSettings } from "@/lib/settings";

export function MobileTopbar({ brand }: { brand: BrandSettings }) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 pt-safe sticky top-0 z-30 border-b backdrop-blur md:hidden">
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard">
          <BrandWordmark brand={brand} size={28} className="text-sm" />
        </Link>
      </div>
    </header>
  );
}
