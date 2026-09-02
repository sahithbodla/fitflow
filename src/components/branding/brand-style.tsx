import { readableForeground, shade, withAlpha } from "@/lib/colors";
import type { BrandSettings } from "@/lib/settings";

/**
 * Injects the configured brand colours as CSS custom properties, overriding the
 * design-system tokens at the document root. Rendered from the root layout so
 * both public and authenticated pages pick up branding.
 */
export function BrandStyle({ brand }: { brand: BrandSettings }) {
  const { primaryColor, accentColor } = brand;

  const css = `:root, .dark {
  --brand: ${primaryColor};
  --brand-foreground: ${readableForeground(primaryColor)};
  --brand-soft: ${withAlpha(primaryColor, 0.1)};
  --brand-strong: ${shade(primaryColor, -0.18)};
  --brand-accent: ${accentColor};
  --brand-accent-foreground: ${readableForeground(accentColor)};
  --brand-accent-soft: ${withAlpha(accentColor, 0.12)};
  --primary: ${primaryColor};
  --primary-foreground: ${readableForeground(primaryColor)};
  --ring: ${primaryColor};
  --sidebar-primary: ${primaryColor};
  --sidebar-primary-foreground: ${readableForeground(primaryColor)};
  --chart-1: ${primaryColor};
  --chart-2: ${accentColor};
  --chart-3: ${shade(primaryColor, 0.35)};
  --chart-4: ${shade(accentColor, 0.35)};
  --chart-5: ${shade(primaryColor, -0.35)};
}`;

  return <style id="fitflow-brand" dangerouslySetInnerHTML={{ __html: css }} />;
}
