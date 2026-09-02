import { z } from "zod";

/**
 * Server-side environment validation.
 *
 * Validation is lazy on purpose: `next build` runs without a database and we do
 * not want a missing runtime secret to break the build. Anything that genuinely
 * needs a variable calls `serverEnv()` and gets a clear, actionable error.
 */
const serverEnvSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
      (value) =>
        value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
      "MONGODB_URI must start with mongodb:// or mongodb+srv://",
    ),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  AUTH_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/** Human-readable report used by the health endpoint and setup tooling. */
export function inspectEnv(): {
  ok: boolean;
  missing: string[];
  problems: string[];
} {
  const result = serverEnvSchema.safeParse(process.env);
  if (result.success) return { ok: true, missing: [], problems: [] };

  const missing: string[] = [];
  const problems: string[] = [];
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (issue.code === "invalid_type" || issue.message.includes("required")) {
      missing.push(key);
    } else {
      problems.push(`${key}: ${issue.message}`);
    }
  }
  return { ok: false, missing: [...new Set(missing)], problems };
}

/**
 * Returns validated server environment. Throws a descriptive error listing every
 * missing/invalid variable. Never includes the values themselves.
 */
export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${String(issue.path[0] ?? "?")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid or missing environment configuration:\n${details}\n` +
        `Copy .env.example to .env.local and fill in the values.`,
    );
  }

  cached = result.data;
  return cached;
}

export const isProduction = process.env.NODE_ENV === "production";
