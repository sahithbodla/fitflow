import { effectiveStatus, isCurrentlyActive } from "../../src/lib/memberships/status";
import type { MembershipStatus } from "../../src/lib/memberships/constants";

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

const TZ = "Asia/Kolkata";

/** IST midnight for a calendar date, as the app stores it. */
const ist = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d) - 5.5 * 3600 * 1000);

const membership = (
  start: Date,
  expiry: Date,
  status: MembershipStatus = "active",
) => ({ status, startDate: start, expiryDate: expiry });

// "Now" is 3 Sep 2026, 09:00 IST.
const now = new Date("2026-09-03T03:30:00Z");

// --- boundaries ----------------------------------------------------------
check(
  "expiring today is still usable, not expired",
  effectiveStatus(membership(ist(2026, 8, 1), ist(2026, 9, 3)), TZ, now),
  "expiring_soon",
);
check(
  "expired yesterday",
  effectiveStatus(membership(ist(2026, 8, 1), ist(2026, 9, 2)), TZ, now),
  "expired",
);
check(
  "starts today is active",
  effectiveStatus(membership(ist(2026, 9, 3), ist(2026, 12, 3)), TZ, now),
  "active",
);
check(
  "starts tomorrow is upcoming",
  effectiveStatus(membership(ist(2026, 9, 4), ist(2026, 12, 4)), TZ, now),
  "upcoming",
);
check(
  "expiring in exactly 7 days is flagged",
  effectiveStatus(membership(ist(2026, 8, 1), ist(2026, 9, 10)), TZ, now),
  "expiring_soon",
);
check(
  "expiring in 8 days is not yet flagged",
  effectiveStatus(membership(ist(2026, 8, 1), ist(2026, 9, 11)), TZ, now),
  "active",
);
check(
  "single-day membership on its day",
  effectiveStatus(membership(ist(2026, 9, 3), ist(2026, 9, 3)), TZ, now),
  "expiring_soon",
);

// --- cancellation wins over dates ----------------------------------------
check(
  "cancelled stays cancelled while dates are current",
  effectiveStatus(
    membership(ist(2026, 8, 1), ist(2026, 12, 1), "cancelled"),
    TZ,
    now,
  ),
  "cancelled",
);
check(
  "cancelled stays cancelled after expiry",
  effectiveStatus(
    membership(ist(2026, 1, 1), ist(2026, 2, 1), "cancelled"),
    TZ,
    now,
  ),
  "cancelled",
);

// --- timezone sensitivity -------------------------------------------------
// 22:00 UTC on 2 Sep is already 3 Sep in IST but still 2 Sep in New York.
const lateEvening = new Date("2026-09-02T22:00:00Z");
check(
  "expiring 2 Sep is expired in IST at 03:30 on the 3rd",
  effectiveStatus(membership(ist(2026, 8, 1), ist(2026, 9, 2)), TZ, lateEvening),
  "expired",
);
check(
  "same instant, New York still sees it as usable",
  effectiveStatus(
    {
      status: "active",
      startDate: new Date("2026-08-01T04:00:00Z"),
      expiryDate: new Date("2026-09-02T04:00:00Z"),
    },
    "America/New_York",
    lateEvening,
  ),
  "expiring_soon",
);

// --- helper ---------------------------------------------------------------
check("active counts as usable", isCurrentlyActive("active"), true);
check("expiring counts as usable", isCurrentlyActive("expiring_soon"), true);
check("upcoming is not usable yet", isCurrentlyActive("upcoming"), false);
check("expired is not usable", isCurrentlyActive("expired"), false);
check("cancelled is not usable", isCurrentlyActive("cancelled"), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
