/** Small, dependency-free colour helpers used for runtime branding. */

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value: string): boolean {
  return HEX_RE.test(value);
}

export function normalizeHex(value: string, fallback: string): string {
  if (!isHexColor(value)) return fallback;
  if (value.length === 4) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return value.toLowerCase();
}

function toRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex, "#000000").slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

/** Relative luminance per WCAG 2.1. */
export function luminance(hex: string): number {
  const { r, g, b } = toRgb(hex);
  const channel = (value: number) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Picks black or white text for readable contrast on the given background. */
export function readableForeground(hex: string): string {
  return luminance(hex) > 0.45 ? "#0a0a0a" : "#ffffff";
}

/** Mixes a colour toward white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = toRgb(hex);
  const target = amount >= 0 ? 255 : 0;
  const weight = Math.abs(amount);
  const mix = (channel: number) =>
    Math.round(channel + (target - channel) * weight)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = toRgb(hex);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}
