import { rateLimit, pruneRateLimiter } from "../../src/lib/rate-limit";
import { normalizePhone, isPlausiblePhone } from "../../src/lib/leads/phone";

let pass = 0;
let fail = 0;
const check = (name: string, actual: unknown, expected: unknown) => {
  const ok = String(actual) === String(expected);
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `\n        expected ${expected}\n        actual   ${actual}`}`,
  );
  if (ok) pass++;
  else fail++;
};

// --- rate limiter --------------------------------------------------------
const key = `test-${Math.random()}`;
for (let i = 1; i <= 5; i++) {
  check(`request ${i} of 5 allowed`, rateLimit(key, 5, 60_000).allowed, true);
}
check("6th request blocked", rateLimit(key, 5, 60_000).allowed, false);
check("7th request still blocked", rateLimit(key, 5, 60_000).allowed, false);
check(
  "blocked response reports retry-after",
  rateLimit(key, 5, 60_000).retryAfterSeconds > 0,
  true,
);

async function main() {
// A separate key has its own budget.
const otherKey = `test-${Math.random()}`;
check("independent key allowed", rateLimit(otherKey, 5, 60_000).allowed, true);

// An expired window resets.
const shortKey = `test-${Math.random()}`;
rateLimit(shortKey, 1, 1);
await new Promise((resolve) => setTimeout(resolve, 15));
check("window resets after expiry", rateLimit(shortKey, 1, 1).allowed, true);

pruneRateLimiter();

// --- phone normalisation -------------------------------------------------
check("plain 10-digit", normalizePhone("9876543210"), "9876543210");
check("with country code", normalizePhone("+91 98765 43210"), "9876543210");
check("with trunk zero", normalizePhone("098765 43210"), "9876543210");
check("with punctuation", normalizePhone("(987) 654-3210"), "9876543210");
check("short number kept whole", normalizePhone("12345"), "12345");
check(
  "same person matches across formats",
  normalizePhone("+91 98765 43210") === normalizePhone("098765-43210"),
  true,
);
check("different people do not match", normalizePhone("9876543210") === normalizePhone("9876543211"), false);

check("plausible: 10 digits", isPlausiblePhone("9876543210"), true);
check("plausible: with country code", isPlausiblePhone("+91 98765 43210"), true);
check("implausible: too short", isPlausiblePhone("12345"), false);
check("implausible: letters only", isPlausiblePhone("not a phone"), false);
check("implausible: too long", isPlausiblePhone("1234567890123456789"), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
}

void main();
