import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";
import { inspectEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Liveness + readiness probe.
 *
 * Reports whether configuration and the database are usable without ever
 * echoing a value: only variable *names* and error *types* are returned.
 */
export async function GET() {
  const env = inspectEnv();
  const db = env.ok
    ? await checkDatabaseHealth()
    : ({ ok: false, error: "EnvironmentNotConfigured" } as const);

  const healthy = env.ok && db.ok;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        environment: {
          ok: env.ok,
          missing: env.missing,
          problems: env.problems,
        },
        database: db.ok ? { ok: true } : { ok: false, error: db.error },
      },
    },
    {
      status: healthy ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
