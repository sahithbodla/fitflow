import {
  CUSTOM_DURATION,
  durationForRange,
  expiryFromDuration,
} from "../../src/lib/memberships/dates";

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

// --- ordinary cases: inclusive of both ends -------------------------------
check("1 month from 3 Sep ends 2 Oct", expiryFromDuration("2026-09-03", 1), "2026-10-02");
check("3 months from 1 Jan ends 31 Mar", expiryFromDuration("2026-01-01", 3), "2026-03-31");
check("6 months from 15 Jun ends 14 Dec", expiryFromDuration("2026-06-15", 6), "2026-12-14");
check("12 months from 1 Jan ends 31 Dec", expiryFromDuration("2026-01-01", 12), "2026-12-31");

// --- year rollover --------------------------------------------------------
check("3 months from 1 Nov ends 31 Jan next year", expiryFromDuration("2026-11-01", 3), "2027-01-31");
check("12 months from 5 Sep ends 4 Sep next year", expiryFromDuration("2026-09-05", 12), "2027-09-04");
check("6 months from 1 Oct crosses into next year", expiryFromDuration("2026-10-01", 6), "2027-03-31");

// --- month-end clamping ---------------------------------------------------
// 31 Jan + 1 month has no 31 Feb: it ends on the last day of February, and the
// day is not subtracted or the member would be short-changed.
check("1 month from 31 Jan ends 28 Feb (non-leap)", expiryFromDuration("2026-01-31", 1), "2026-02-28");
check("1 month from 31 Jan ends 29 Feb (leap year)", expiryFromDuration("2028-01-31", 1), "2028-02-29");
check("1 month from 30 Jan clamps to 28 Feb", expiryFromDuration("2026-01-30", 1), "2026-02-28");
check("1 month from 31 Mar ends 30 Apr", expiryFromDuration("2026-03-31", 1), "2026-04-30");
check("1 month from 31 Aug ends 30 Sep", expiryFromDuration("2026-08-31", 1), "2026-09-30");
// 30 Nov + 3 months would be 30 Feb, which does not exist: it clamps to the
// last day of February and keeps it, rather than subtracting into 27 Feb.
check("3 months from 30 Nov clamps to 28 Feb", expiryFromDuration("2026-11-30", 3), "2027-02-28");

// --- leap day itself ------------------------------------------------------
check("12 months from 29 Feb ends 28 Feb next year", expiryFromDuration("2028-02-29", 12), "2029-02-28");

// --- reverse mapping ------------------------------------------------------
check("3 Sep–2 Oct maps back to 1 month", durationForRange("2026-09-03", "2026-10-02"), "1");
check("1 Jan–31 Mar maps back to 3 months", durationForRange("2026-01-01", "2026-03-31"), "3");
check("1 Jan–31 Dec maps back to 12 months", durationForRange("2026-01-01", "2026-12-31"), "12");
check("31 Jan–28 Feb maps back to 1 month", durationForRange("2026-01-31", "2026-02-28"), "1");
check("an arbitrary range is custom", durationForRange("2026-09-03", "2026-09-20"), CUSTOM_DURATION);
check("a 2-month range is custom", durationForRange("2026-01-01", "2026-02-28"), CUSTOM_DURATION);

// --- malformed input degrades safely --------------------------------------
check("garbage start date is returned unchanged", expiryFromDuration("nonsense", 3), "nonsense");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
