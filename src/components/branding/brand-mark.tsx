import Image from "next/image";
import { cn } from "@/lib/utils";
import type { BrandSettings } from "@/lib/settings";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return "F";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function BrandMark({
  brand,
  className,
  size = 36,
}: {
  brand: Pick<BrandSettings, "businessName" | "logoUrl">;
  className?: string;
  size?: number;
}) {
  if (brand.logoUrl) {
    return (
      <Image
        src={brand.logoUrl}
        alt={`${brand.businessName} logo`}
        width={size}
        height={size}
        className={cn("rounded-lg object-contain", className)}
        unoptimized
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "bg-brand text-brand-foreground grid shrink-0 place-items-center rounded-lg font-semibold tracking-tight",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials(brand.businessName)}
    </span>
  );
}

export function BrandWordmark({
  brand,
  className,
  size = 36,
}: {
  brand: Pick<BrandSettings, "businessName" | "logoUrl">;
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark brand={brand} size={size} />
      <span className="truncate text-base font-semibold tracking-tight">
        {brand.businessName}
      </span>
    </span>
  );
}
