/**
 * Minimal check runner.
 *
 * Runs every `*.check.ts` in this directory in its own process and fails if any
 * of them exits non-zero. These are fast, dependency-free assertions over pure
 * logic (dates, colours, validation) — the kind of thing that is easy to break
 * silently in a later phase.
 *
 *   npm test
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const dir = new URL(".", import.meta.url).pathname;
const checks = readdirSync(dir)
  .filter((file) => file.endsWith(".check.ts"))
  .sort();

if (checks.length === 0) {
  console.log("No checks found.");
  process.exit(0);
}

let failed = 0;

for (const check of checks) {
  console.log(`\n── ${check} ${"─".repeat(Math.max(0, 50 - check.length))}`);
  const result = spawnSync(
    process.execPath,
    [join(process.cwd(), "node_modules/tsx/dist/cli.mjs"), join(dir, check)],
    { stdio: "inherit" },
  );
  if (result.status !== 0) failed++;
}

console.log(
  `\n${checks.length - failed}/${checks.length} check file(s) passed.`,
);
process.exit(failed === 0 ? 0 : 1);
