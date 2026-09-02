import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort client IP for rate limiting.
 *
 * Behind Render's proxy the real address is the first entry of
 * `x-forwarded-for`. This is spoofable in principle, so it is used only for
 * coarse abuse limiting — never for authorization.
 */
export async function getRequestIp(): Promise<string> {
  const headerList = await headers();

  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headerList.get("x-real-ip")?.trim() || "unknown";
}
