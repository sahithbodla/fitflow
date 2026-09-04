import "server-only";

/**
 * Centralised server-side logging.
 *
 * Deliberately not a real logging library — this is a single-instance MVP
 * (see the rate limiter for the same trade-off), so structured `console.*`
 * output that Render/Netlify already capture is enough. If this app ever
 * needs log aggregation across instances, that's the point to introduce one.
 *
 * Never log secrets. `redact()` strips known-sensitive keys defensively, but
 * callers are still responsible for not passing a password or token in the
 * first place — this is a safety net, not a substitute for care.
 */

type LogLevel = "info" | "warn" | "error";

const SENSITIVE_KEYS = new Set([
  "password",
  "newpassword",
  "currentpassword",
  "auth_secret",
  "authsecret",
  "mongodb_uri",
  "mongodburi",
  "token",
  "sessiontoken",
  "cookie",
  "apikey",
  "api_key",
  "secret",
]);

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase())
      ? "[redacted]"
      : redact(val, depth + 1);
  }
  return out;
}

/** Random enough for tracing one request through logs; not a security token. */
export function newRequestId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const line = {
    level,
    message,
    time: new Date().toISOString(),
    ...(context ? { context: redact(context) } : {}),
  };
  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  method(JSON.stringify(line));
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => write("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => write("warn", message, context),
  /**
   * Logs an unexpected error server-side. Pass the request/error id you show
   * (or would show) the user so a support conversation can be traced back to
   * this exact line, without ever putting the raw error in front of them.
   */
  error: (message: string, error: unknown, context?: Record<string, unknown>) => {
    const errorInfo =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { value: String(error) };
    write("error", message, { ...context, error: errorInfo });
  },
};
