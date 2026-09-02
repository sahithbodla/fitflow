import { startOfToday, startOfDayFromToday, daysUntil, formatDate, startOfMonth, zonedParts } from "../../src/lib/dates";

let pass = 0, fail = 0;
const check = (name: string, actual: unknown, expected: unknown) => {
  const ok = String(actual) === String(expected);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `\n        expected ${expected}\n        actual   ${actual}`}`);
  if (ok) pass++;
  else fail++;
};

// A fixed instant: 2026-09-02T19:30:00Z
// = 2026-09-03 01:00 in Asia/Kolkata (+5:30)  -> next calendar day
// = 2026-09-02 12:30 in America/Los_Angeles (-7) -> same day
const now = new Date("2026-09-02T19:30:00Z");

check("IST calendar day rolls to the 3rd", JSON.stringify(zonedParts(now, "Asia/Kolkata")), JSON.stringify({year:2026,month:9,day:3}));
check("LA calendar day is still the 2nd", JSON.stringify(zonedParts(now, "America/Los_Angeles")), JSON.stringify({year:2026,month:9,day:2}));

// Midnight IST on the 3rd is 18:30Z on the 2nd.
check("IST start of today", startOfToday("Asia/Kolkata", now).toISOString(), "2026-09-02T18:30:00.000Z");
// Midnight LA on the 2nd is 07:00Z on the 2nd (PDT, -7).
check("LA start of today", startOfToday("America/Los_Angeles", now).toISOString(), "2026-09-02T07:00:00.000Z");

check("IST +7 days", startOfDayFromToday("Asia/Kolkata", 7, now).toISOString(), "2026-09-09T18:30:00.000Z");
check("IST -7 days", startOfDayFromToday("Asia/Kolkata", -7, now).toISOString(), "2026-08-26T18:30:00.000Z");
check("IST start of month", startOfMonth("Asia/Kolkata", now).toISOString(), "2026-08-31T18:30:00.000Z");

// A DST boundary: US clocks spring forward 2026-03-08.
const dstNow = new Date("2026-03-09T12:00:00Z");
check("LA start of day after DST shift", startOfToday("America/Los_Angeles", dstNow).toISOString(), "2026-03-09T07:00:00.000Z");
const preDst = new Date("2026-03-07T12:00:00Z");
check("LA start of day before DST shift", startOfToday("America/Los_Angeles", preDst).toISOString(), "2026-03-07T08:00:00.000Z");

// daysUntil is calendar-day based, not 24h based.
check("daysUntil same IST day", daysUntil(new Date("2026-09-02T20:00:00Z"), "Asia/Kolkata", now), 0);
check("daysUntil next IST day", daysUntil(new Date("2026-09-03T20:00:00Z"), "Asia/Kolkata", now), 1);
check("daysUntil past IST day", daysUntil(new Date("2026-09-01T20:00:00Z"), "Asia/Kolkata", now), -1);

check("formatDate IST", formatDate(now, "Asia/Kolkata"), "3 Sep 2026");
check("formatDate LA", formatDate(now, "America/Los_Angeles"), "2 Sep 2026");
check("formatDate null", formatDate(null, "Asia/Kolkata"), "—");
check("invalid zone falls back", startOfToday("Not/AZone", now).toISOString(), startOfToday("Asia/Kolkata", now).toISOString());

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
