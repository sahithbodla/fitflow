/**
 * Fills the database with realistic demo data so every screen can be walked
 * through end to end.
 *
 *   npm run seed:demo                  # add demo data alongside anything already there
 *   npm run seed:demo -- --reset       # wipe ALL business data first, then seed
 *   npm run seed:demo -- --wipe-only   # wipe ALL business data — do not reseed
 *
 * `--reset` and `--wipe-only` both clear leads, customers, memberships,
 * payments, coaching, workouts, diet plans and check-ins. Neither touches
 * your login or business settings. `--wipe-only` stops right after clearing —
 * use it to hand a demo database back to a client empty, e.g. once real
 * onboarding starts.
 *
 * Every date is relative to today, so the dashboard's "due", "expiring soon"
 * and "expired" buckets are populated whenever you run it.
 */
import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const WIPE_ONLY = process.argv.includes("--wipe-only");
const RESET = process.argv.includes("--reset") || WIPE_ONLY;

/**
 * Passes seed documents through to Mongoose unchanged.
 *
 * `create()` is typed against each schema's enum literals, and these plain
 * object literals widen to `string`. The documents are schema-valid — they are
 * validated on save — so this only relaxes the compile-time shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asDocs = <T>(docs: T[]): any[] => docs as any[];

/** Midnight in the business timezone, `days` from today, as a UTC instant. */
function makeDayHelper(timeZone: string) {
  return (days: number): Date => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const get = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? 0);

    const naive = Date.UTC(get("year"), get("month") - 1, get("day") + days);
    // Resolve the zone offset at that instant so DST is handled.
    const probe = new Date(naive);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const p: Record<string, string> = {};
    for (const part of formatter.formatToParts(probe)) {
      if (part.type !== "literal") p[part.type] = part.value;
    }
    const asUtc = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour) % 24,
      Number(p.minute),
      Number(p.second),
    );
    return new Date(naive - (asUtc - probe.getTime()));
  };
}

async function main() {
  const { serverEnv } = await import("../src/lib/env");
  const { MONGODB_URI } = serverEnv();

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log("Connected to MongoDB.");

  const { BusinessSettings } = await import("../src/models/BusinessSettings");
  const { Lead } = await import("../src/models/Lead");
  const { Person } = await import("../src/models/Person");
  const { Conversion } = await import("../src/models/Conversion");
  const { MembershipPlan } = await import("../src/models/MembershipPlan");
  const { Membership } = await import("../src/models/Membership");
  const { PaymentRecord } = await import("../src/models/PaymentRecord");
  const { CoachingClient } = await import("../src/models/CoachingClient");
  const { Exercise } = await import("../src/models/Exercise");
  const { WorkoutTemplate } = await import("../src/models/WorkoutTemplate");
  const { ClientWorkoutPlan } = await import("../src/models/ClientWorkoutPlan");
  const { DietPlan } = await import("../src/models/DietPlan");
  const { WeeklyCheckIn } = await import("../src/models/WeeklyCheckIn");

  const settings = await BusinessSettings.findOne({ singleton: "business" }).lean();
  const timeZone = settings?.timezone || "Asia/Kolkata";
  const day = makeDayHelper(timeZone);
  const coach = "Owner";

  if (RESET) {
    console.log("\nResetting all business data (login and settings kept)…");
    const cleared: [string, number][] = [
      ["Check-ins", (await WeeklyCheckIn.deleteMany({})).deletedCount],
      ["Diet plans", (await DietPlan.deleteMany({})).deletedCount],
      ["Client workouts", (await ClientWorkoutPlan.deleteMany({})).deletedCount],
      ["Workout templates", (await WorkoutTemplate.deleteMany({})).deletedCount],
      ["Exercises", (await Exercise.deleteMany({})).deletedCount],
      ["Coaching clients", (await CoachingClient.deleteMany({})).deletedCount],
      ["Payments", (await PaymentRecord.deleteMany({})).deletedCount],
      ["Memberships", (await Membership.deleteMany({})).deletedCount],
      ["Plans", (await MembershipPlan.deleteMany({})).deletedCount],
      ["Conversions", (await Conversion.deleteMany({})).deletedCount],
      ["Customers", (await Person.deleteMany({})).deletedCount],
      ["Leads", (await Lead.deleteMany({})).deletedCount],
    ];
    for (const [label, count] of cleared) {
      if (count) console.log(`  cleared ${label}: ${count}`);
    }
  }

  if (WIPE_ONLY) {
    console.log("\nDone. Business data cleared; login and settings kept. Nothing reseeded.");
    await mongoose.disconnect();
    return;
  }

  // ---------------------------------------------------------------- plans --
  const plans = await MembershipPlan.create(asDocs([
    { name: "1 Month Gym", category: "gym", description: "Rolling monthly floor access.", defaultDurationDays: 30, defaultPrice: 1500, active: true },
    { name: "3 Month Gym", category: "gym", description: "Best value for beginners.", defaultDurationDays: 90, defaultPrice: 4000, active: true },
    { name: "6 Month Gym", category: "gym", description: "", defaultDurationDays: 180, defaultPrice: 7500, active: true },
    { name: "12 Month Gym", category: "gym", description: "Annual membership.", defaultDurationDays: 365, defaultPrice: 13000, active: true },
    { name: "12 PT Sessions", category: "personal_training", description: "Twelve one-to-one sessions.", defaultDurationDays: 90, defaultPrice: 18000, active: true },
    { name: "24 PT Sessions", category: "personal_training", description: "", defaultDurationDays: 180, defaultPrice: 33000, active: true },
    { name: "Summer Special 2025", category: "gym", description: "Retired promo — kept for history.", defaultDurationDays: 60, defaultPrice: 2000, active: false },
  ]));
  const [gym1m, gym3m, gym6m, gym12m, pt12] = plans;
  console.log(`\nMembership plans: ${plans.length}`);

  // ------------------------------------------------------------- exercises --
  const exercises = await Exercise.create(asDocs([
    { name: "Barbell Back Squat", category: "legs", instructions: "Brace hard, sit back and down, drive through mid-foot.", externalVideoUrl: "https://www.youtube.com/watch?v=SW_C1A-rejs", active: true },
    { name: "Barbell Bench Press", category: "chest", instructions: "Shoulder blades retracted, bar to mid-chest.", externalVideoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg", active: true },
    { name: "Conventional Deadlift", category: "back", instructions: "Neutral spine, bar close to the shins.", externalVideoUrl: "https://www.youtube.com/watch?v=op9kVnSso6Q", active: true },
    { name: "Overhead Press", category: "shoulders", instructions: "Squeeze glutes, press the head through at lockout.", externalVideoUrl: "", active: true },
    { name: "Lat Pulldown", category: "back", instructions: "Drive elbows down, avoid leaning back.", externalVideoUrl: "", active: true },
    { name: "Romanian Deadlift", category: "legs", instructions: "Hinge at the hips, soft knees.", externalVideoUrl: "", active: true },
    { name: "Dumbbell Row", category: "back", instructions: "", externalVideoUrl: "", active: true },
    { name: "Walking Lunge", category: "legs", instructions: "", externalVideoUrl: "", active: true },
    { name: "Plank", category: "core", instructions: "Ribs down, glutes tight. Hold for time.", externalVideoUrl: "", active: true },
    { name: "Hanging Leg Raise", category: "core", instructions: "", externalVideoUrl: "", active: true },
    { name: "Hip Thrust", category: "glutes", instructions: "", externalVideoUrl: "", active: true },
    { name: "Treadmill Incline Walk", category: "cardio", instructions: "12% incline, 5.0 km/h, 20 minutes.", externalVideoUrl: "", active: true },
    { name: "Cable Fly", category: "chest", instructions: "", externalVideoUrl: "", active: true },
    { name: "Bicep Curl", category: "arms", instructions: "", externalVideoUrl: "", active: true },
    { name: "Smith Machine Squat", category: "legs", instructions: "Retired — machine removed.", externalVideoUrl: "", active: false },
  ]));
  const byName = new Map(exercises.map((e) => [e.name, e]));
  const ex = (name: string) => byName.get(name)!;
  console.log(`Exercises: ${exercises.length}`);

  // ------------------------------------------------------------- templates --
  const entry = (name: string, sets: string, reps: string, rest: string, order: number, notes = "") => {
    const e = ex(name);
    return { exercise: e._id, exerciseName: e.name, videoUrl: e.externalVideoUrl ?? "", sets, reps, rest, notes, order };
  };

  const templates = await WorkoutTemplate.create(asDocs([
    {
      name: "Beginner Full Body", description: "Three days a week for new members.", goal: "general_fitness", active: true,
      days: [
        { name: "Day 1 — Full Body A", notes: "Warm up 8 minutes on the bike.", order: 0, exercises: [entry("Barbell Back Squat","3","8","90s",0,"Start light, focus on depth."), entry("Barbell Bench Press","3","8","90s",1), entry("Lat Pulldown","3","10","60s",2), entry("Plank","3","30s","45s",3)] },
        { name: "Day 2 — Full Body B", notes: "", order: 1, exercises: [entry("Romanian Deadlift","3","10","90s",0), entry("Overhead Press","3","8","90s",1), entry("Dumbbell Row","3","10","60s",2), entry("Hanging Leg Raise","3","8","45s",3)] },
        { name: "Day 3 — Full Body C", notes: "", order: 2, exercises: [entry("Walking Lunge","3","12","60s",0), entry("Cable Fly","3","12","45s",1), entry("Treadmill Incline Walk","1","20 min","—",2)] },
      ],
    },
    {
      name: "Push Pull Legs", description: "Six days for intermediate lifters.", goal: "muscle_gain", active: true,
      days: [
        { name: "Push", notes: "", order: 0, exercises: [entry("Barbell Bench Press","4","6","120s",0), entry("Overhead Press","3","8","90s",1), entry("Cable Fly","3","12","60s",2)] },
        { name: "Pull", notes: "", order: 1, exercises: [entry("Conventional Deadlift","4","5","150s",0,"Reset between reps."), entry("Lat Pulldown","4","10","60s",1), entry("Bicep Curl","3","12","45s",2)] },
        { name: "Legs", notes: "", order: 2, exercises: [entry("Barbell Back Squat","4","6","120s",0), entry("Romanian Deadlift","3","10","90s",1), entry("Hip Thrust","3","12","60s",2)] },
      ],
    },
    {
      name: "Fat Loss Circuit", description: "Higher pace, shorter rest.", goal: "fat_loss", active: true,
      days: [{ name: "Circuit A", notes: "Three rounds, 60s between rounds.", order: 0, exercises: [entry("Walking Lunge","3","15","30s",0), entry("Dumbbell Row","3","15","30s",1), entry("Plank","3","45s","30s",2), entry("Treadmill Incline Walk","1","15 min","—",3)] }],
    },
  ]));
  console.log(`Workout templates: ${templates.length}`);

  // ----------------------------------------------------------------- leads --
  const act = (type: string, message: string, actor: string, daysAgo: number) => ({ type, message, actor, createdAt: day(-daysAgo) });

  const leads = await Lead.create(asDocs([
    { name: "Ananya Krishnan", phone: "+91 98765 43210", phoneNormalized: "9876543210", email: "ananya.k@example.com", instagramHandle: "ananya.lifts", fitnessGoal: "Lose 8kg before my wedding in March.", interestedIn: "online_coaching", source: "public_form", status: "new", followUpDate: null, activity: [act("created","Enquiry submitted through the website — interested in Online coaching.","Public form",1)] },
    { name: "Rohan Verma", phone: "9811122233", phoneNormalized: "9811122233", email: "", instagramHandle: "", fitnessGoal: "Build some muscle, first time in a gym.", interestedIn: "gym", source: "public_form", status: "new", followUpDate: null, activity: [act("created","Enquiry submitted through the website — interested in Gym membership.","Public form",0)] },
    { name: "Meera Pillai", phone: "9822233344", phoneNormalized: "9822233344", email: "meera.p@example.com", instagramHandle: "", fitnessGoal: "Get back into training after a break.", interestedIn: "personal_training", source: "manual", status: "contacted", followUpDate: day(-3), activity: [act("created","Walked in and asked about PT.","Owner",6), act("status_change","Status changed from New to Contacted.","Owner",5), act("note","Called — wants evening slots. Sending prices.","Owner",5), act("follow_up_set","Follow-up set.","Owner",5)] },
    { name: "Karthik Nair", phone: "9833344455", phoneNormalized: "9833344455", email: "", instagramHandle: "karthik.fit", fitnessGoal: "", interestedIn: "gym", source: "other", status: "follow_up", followUpDate: day(0), activity: [act("created","Referred by Arjun.","Owner",4), act("status_change","Status changed from New to Follow-up.","Owner",2), act("note","Asked to call back today after 6pm.","Owner",2)] },
    { name: "Divya Menon", phone: "9844455566", phoneNormalized: "9844455566", email: "divya.m@example.com", instagramHandle: "", fitnessGoal: "Marathon training support.", interestedIn: "online_coaching", source: "public_form", status: "interested", followUpDate: day(2), activity: [act("created","Enquiry submitted through the website.","Public form",7), act("status_change","Status changed from New to Interested.","Owner",6), act("note","Wants a call this week to discuss the plan.","Owner",3)] },
    { name: "Sanjay Gupta", phone: "9855566677", phoneNormalized: "9855566677", email: "", instagramHandle: "", fitnessGoal: "", interestedIn: "gym", source: "manual", status: "lost", followUpDate: null, activity: [act("created","Walk-in.","Owner",30), act("status_change","Status changed from New to Lost.","Owner",20), act("note","Joined the gym near his office instead.","Owner",20)] },
    { name: "Priya Sharma", phone: "9866677788", phoneNormalized: "9866677788", email: "priya.s@example.com", instagramHandle: "", fitnessGoal: "Strength and general fitness.", interestedIn: "gym", source: "public_form", status: "converted", convertedAt: day(-45), followUpDate: null, activity: [act("created","Enquiry submitted through the website.","Public form",50), act("status_change","Status changed from New to Interested.","Owner",48), act("converted","Converted to Gym member.","Owner",45)] },
    { name: "Arjun Mehta", phone: "9877788899", phoneNormalized: "9877788899", email: "arjun.m@example.com", instagramHandle: "arjunlifts", fitnessGoal: "Get strong — squat 140kg.", interestedIn: "personal_training", source: "manual", status: "converted", convertedAt: day(-60), followUpDate: null, activity: [act("created","Walk-in, wanted PT straight away.","Owner",62), act("converted","Converted to Personal training client.","Owner",60)] },
    { name: "Fatima Sheikh", phone: "9888899900", phoneNormalized: "9888899900", email: "fatima.s@example.com", instagramHandle: "", fitnessGoal: "Lose fat, improve energy.", interestedIn: "online_coaching", source: "public_form", status: "converted", convertedAt: day(-70), followUpDate: null, activity: [act("created","Enquiry submitted through the website.","Public form",75), act("converted","Converted to Online coaching client.","Owner",70)] },
    { name: "Vikram Shah", phone: "9899900011", phoneNormalized: "9899900011", email: "", instagramHandle: "", fitnessGoal: "", interestedIn: "gym", source: "manual", status: "converted", convertedAt: day(-200), followUpDate: null, activity: [act("created","Walk-in.","Owner",205), act("converted","Converted to Gym member.","Owner",200)] },
  ]));
  const leadBy = new Map(leads.map((l) => [l.name, l]));
  console.log(`Leads: ${leads.length}`);

  // --------------------------------------------------------------- people --
  const mkPerson = (name: string, phone: string, email: string, goal: string, notes: string, fromLead: boolean, ig = "") => ({
    name, phone, phoneNormalized: phone.replace(/\D/g, "").slice(-10), email, instagramHandle: ig,
    fitnessGoal: goal, notes,
    sourceLeadId: fromLead ? leadBy.get(name)?._id ?? null : null,
    origin: (fromLead ? "lead_conversion" : "direct") as
      | "lead_conversion"
      | "direct",
  });

  const people = await Person.create(asDocs([
    mkPerson("Priya Sharma", "9866677788", "priya.s@example.com", "Strength and general fitness.", "Prefers mornings.", true),
    mkPerson("Arjun Mehta", "9877788899", "arjun.m@example.com", "Get strong — squat 140kg.", "Old knee niggle — avoid deep lunges.", true, "arjunlifts"),
    mkPerson("Fatima Sheikh", "9888899900", "fatima.s@example.com", "Lose fat, improve energy.", "", true),
    mkPerson("Vikram Shah", "9899900011", "", "", "Pays in cash, always on time.", true),
    mkPerson("Neha Rao", "9900011122", "neha.rao@example.com", "Run a half marathon.", "Joined with a friend.", false, "neharao"),
    mkPerson("Imran Qureshi", "9911122233", "", "General fitness.", "", false),
    mkPerson("Lakshmi Iyer", "9922233344", "lakshmi.i@example.com", "Post-natal return to training.", "Cleared by her doctor.", false),
    mkPerson("Deepak Joshi", "9933344455", "", "", "", false),
  ]));
  const personBy = new Map(people.map((p) => [p.name, p]));
  const who = (name: string) => personBy.get(name)!;
  console.log(`Customers: ${people.length}`);

  // ---------------------------------------------------------- conversions --
  await Conversion.create(asDocs([
    { lead: leadBy.get("Priya Sharma")!._id, person: who("Priya Sharma")._id, type: "gym_member", convertedAt: day(-45), actor: coach, linkedExistingPerson: false },
    { lead: leadBy.get("Arjun Mehta")!._id, person: who("Arjun Mehta")._id, type: "pt_client", convertedAt: day(-60), actor: coach, linkedExistingPerson: false },
    { lead: leadBy.get("Arjun Mehta")!._id, person: who("Arjun Mehta")._id, type: "gym_member", convertedAt: day(-58), actor: coach, linkedExistingPerson: true, notes: "Added gym access on top of PT." },
    { lead: leadBy.get("Fatima Sheikh")!._id, person: who("Fatima Sheikh")._id, type: "online_coaching", convertedAt: day(-70), actor: coach, linkedExistingPerson: false },
    { lead: leadBy.get("Vikram Shah")!._id, person: who("Vikram Shah")._id, type: "gym_member", convertedAt: day(-200), actor: coach, linkedExistingPerson: false },
  ]));
  console.log("Conversions: 5");

  // --------------------------------------------------------- memberships --
  const mem = (personName: string, planName: string, plan: unknown, category: string, purchase: number, start: number, expiry: number, price: number, status = "active", extra: Record<string, unknown> = {}) => ({
    person: who(personName)._id, plan, planName, category,
    purchaseDate: day(purchase), startDate: day(start), expiryDate: day(expiry),
    price, status, createdBy: coach, ...extra,
  });

  // Vikram's renewal chain: the original period, then the current one.
  const [vikramFirst] = await Membership.create(
    asDocs([
      mem("Vikram Shah", "12 Month Gym", gym12m._id, "gym", -200, -200, -200 + 365, 13000, "active"),
    ]),
  );

  const memberships = await Membership.create(asDocs([
    // Active, comfortably in date.
    mem("Priya Sharma", "6 Month Gym", gym6m._id, "gym", -45, -45, 135, 7500),
    mem("Arjun Mehta", "12 PT Sessions", pt12._id, "personal_training", -60, -60, 30, 18000),
    mem("Neha Rao", "3 Month Gym", gym3m._id, "gym", -30, -30, 60, 4000),
    // Expiring soon — inside the 7-day window the dashboard flags.
    mem("Arjun Mehta", "3 Month Gym", gym3m._id, "gym", -85, -85, 4, 4000, "active", { notes: "Ask about renewing to 6 months." }),
    mem("Imran Qureshi", "1 Month Gym", gym1m._id, "gym", -27, -27, 2, 1500),
    // Expired — past its date but never formally ended.
    mem("Lakshmi Iyer", "3 Month Gym", gym3m._id, "gym", -120, -120, -30, 4000),
    mem("Deepak Joshi", "1 Month Gym", gym1m._id, "gym", -70, -70, -40, 1500),
    // Starts later.
    mem("Fatima Sheikh", "6 Month Gym", gym6m._id, "gym", -2, 14, 14 + 180, 7500, "active", { notes: "Starts when she's back from travelling." }),
    // Ended early, the two different ways.
    mem("Deepak Joshi", "12 PT Sessions", pt12._id, "personal_training", -50, -50, 40, 18000, "cancelled", { cancelledAt: day(-20), cancelledReason: "Moved cities.", endedBy: coach }),
    mem("Imran Qureshi", "24 PT Sessions", null, "personal_training", -40, -40, 140, 33000, "terminated", { cancelledAt: day(-10), cancelledReason: "Repeated no-shows and rude to staff.", endedBy: coach }),
    // The renewal of Vikram's original period.
    { ...mem("Vikram Shah", "12 Month Gym", gym12m._id, "gym", -6, -200 + 365 + 1, -200 + 365 + 365, 13000), renewedFrom: vikramFirst._id, notes: "Renewed for a second year." },
  ]));
  const allMemberships = [vikramFirst, ...memberships];
  console.log(`Memberships: ${allMemberships.length}`);

  const findMem = (personName: string, planName: string) =>
    allMemberships.find(
      (m) => String(m.person) === String(who(personName)._id) && m.planName === planName,
    )!;

  /** Vikram's second year — the row that renews the original period. */
  const vikramRenewal = allMemberships.find((m) => Boolean(m.renewedFrom))!;

  // ------------------------------------------------------------- payments --
  await PaymentRecord.create(asDocs([
    { person: who("Priya Sharma")._id, membership: findMem("Priya Sharma", "6 Month Gym")._id, amount: 7500, currency: "INR", paymentDate: day(-45), method: "upi", status: "paid", notes: "Paid in full.", recordedBy: coach },
    { person: who("Arjun Mehta")._id, membership: findMem("Arjun Mehta", "12 PT Sessions")._id, amount: 10000, currency: "INR", paymentDate: day(-60), method: "bank_transfer", status: "paid", notes: "First instalment.", recordedBy: coach },
    { person: who("Arjun Mehta")._id, membership: findMem("Arjun Mehta", "12 PT Sessions")._id, amount: 8000, currency: "INR", paymentDate: day(-30), method: "upi", status: "paid", notes: "Balance.", recordedBy: coach },
    { person: who("Arjun Mehta")._id, membership: findMem("Arjun Mehta", "3 Month Gym")._id, amount: 4000, currency: "INR", paymentDate: day(-85), method: "cash", status: "paid", notes: "", recordedBy: coach },
    { person: who("Neha Rao")._id, membership: findMem("Neha Rao", "3 Month Gym")._id, amount: 2000, currency: "INR", paymentDate: day(-30), method: "card", status: "paid", notes: "Half now, half later.", recordedBy: coach },
    { person: who("Neha Rao")._id, membership: findMem("Neha Rao", "3 Month Gym")._id, amount: 2000, currency: "INR", paymentDate: day(-2), method: "upi", status: "pending", notes: "Says she'll transfer this week.", recordedBy: coach },
    { person: who("Imran Qureshi")._id, membership: findMem("Imran Qureshi", "1 Month Gym")._id, amount: 1500, currency: "INR", paymentDate: day(-27), method: "cash", status: "paid", notes: "", recordedBy: coach },
    { person: who("Lakshmi Iyer")._id, membership: findMem("Lakshmi Iyer", "3 Month Gym")._id, amount: 4000, currency: "INR", paymentDate: day(-120), method: "upi", status: "paid", notes: "", recordedBy: coach },
    { person: who("Deepak Joshi")._id, membership: findMem("Deepak Joshi", "12 PT Sessions")._id, amount: 18000, currency: "INR", paymentDate: day(-50), method: "bank_transfer", status: "paid", notes: "", recordedBy: coach },
    { person: who("Deepak Joshi")._id, membership: null, amount: 9000, currency: "INR", paymentDate: day(-18), method: "bank_transfer", status: "refunded", notes: "Refunded unused PT sessions after he moved.", recordedBy: coach },
    { person: who("Vikram Shah")._id, membership: vikramFirst._id, amount: 13000, currency: "INR", paymentDate: day(-200), method: "cash", status: "paid", notes: "", recordedBy: coach },
    { person: who("Vikram Shah")._id, membership: vikramRenewal._id, amount: 13000, currency: "INR", paymentDate: day(-6), method: "cash", status: "paid", notes: "Second year, paid up front.", recordedBy: coach },
    { person: who("Fatima Sheikh")._id, membership: null, amount: 5000, currency: "INR", paymentDate: day(-1), method: "upi", status: "paid", notes: "Deposit for the block starting in two weeks.", recordedBy: coach },
    { person: who("Imran Qureshi")._id, membership: null, amount: 16500, currency: "INR", paymentDate: day(-40), method: "card", status: "paid", notes: "Half of the PT package.", recordedBy: coach },
  ]));
  console.log("Payments: 14");

  // -------------------------------------------------------------- coaching --
  const coaching = await CoachingClient.create(asDocs([
    { person: who("Fatima Sheikh")._id, status: "active", startDate: day(-70), goal: "Lose fat and build a routine she can keep.", notes: "Works shifts — plan around irregular hours.", sourceLeadId: leadBy.get("Fatima Sheikh")!._id },
    { person: who("Neha Rao")._id, status: "active", startDate: day(-40), goal: "Run a half marathon in under 2 hours.", notes: "Runs three times a week already." },
    { person: who("Lakshmi Iyer")._id, status: "paused", startDate: day(-150), endDate: null, goal: "Post-natal return to training.", notes: "Paused while travelling. Restarting next month." },
    { person: who("Arjun Mehta")._id, status: "ended", startDate: day(-180), endDate: day(-30), goal: "Squat 140kg.", notes: "Moved to in-person PT instead." },
  ]));
  const fatima = coaching[0];
  const neha = coaching[1];
  console.log(`Coaching clients: ${coaching.length}`);

  // ------------------------------------------------------- workout plans --
  const beginner = templates[0];
  await ClientWorkoutPlan.create(asDocs([
    {
      coachingClient: fatima._id, name: "Fatima — September block", description: "Three days a week for new members.", goal: "fat_loss",
      sourceTemplate: beginner._id, sourceTemplateName: beginner.name, customised: true, startDate: day(-30), active: true,
      days: [
        { name: "Day 1 — Full Body A", notes: "Warm up 8 minutes on the bike.", order: 0, exercises: [entry("Barbell Back Squat","3","10","90s",0,"Lighter than the template — building confidence."), entry("Barbell Bench Press","3","8","90s",1), entry("Lat Pulldown","3","10","60s",2)] },
        { name: "Day 2 — Full Body B", notes: "", order: 1, exercises: [entry("Romanian Deadlift","3","10","90s",0), entry("Dumbbell Row","3","10","60s",1), entry("Plank","3","30s","45s",2)] },
      ],
    },
    {
      coachingClient: neha._id, name: "Neha — half marathon support", description: "Two lifting days alongside her running.", goal: "endurance",
      sourceTemplate: null, sourceTemplateName: "", customised: false, startDate: day(-40), active: true,
      days: [
        { name: "Strength A", notes: "Never the day before a long run.", order: 0, exercises: [entry("Barbell Back Squat","3","8","90s",0), entry("Hip Thrust","3","12","60s",1), entry("Plank","3","45s","45s",2)] },
        { name: "Strength B", notes: "", order: 1, exercises: [entry("Romanian Deadlift","3","10","90s",0), entry("Walking Lunge","3","12","60s",1)] },
      ],
    },
    {
      coachingClient: fatima._id, name: "Fatima — August block", description: "Superseded by the September block.", goal: "general_fitness",
      sourceTemplate: beginner._id, sourceTemplateName: beginner.name, customised: false, startDate: day(-70), active: false,
      days: [{ name: "Day 1 — Full Body A", notes: "", order: 0, exercises: [entry("Barbell Back Squat","3","8","90s",0), entry("Lat Pulldown","3","10","60s",1)] }],
    },
  ]));
  console.log("Client workout plans: 3");

  // ----------------------------------------------------------- diet plans --
  await DietPlan.create(asDocs([
    {
      coachingClient: fatima._id, title: "September cutting plan", goal: "fat_loss", notes: "3L water daily. Coffee before training is fine.",
      calorieTarget: 1800, proteinTarget: 130, carbTarget: 160, fatTarget: 55, startDate: day(-30), active: true,
      meals: [
        { name: "Breakfast", time: "8:00 am", notes: "Within an hour of waking.", order: 0, items: [{ food: "Oats", quantity: "60g", notes: "With water or skim milk", order: 0 }, { food: "Whey protein", quantity: "1 scoop", notes: "", order: 1 }, { food: "Banana", quantity: "1 medium", notes: "", order: 2 }] },
        { name: "Lunch", time: "1:00 pm", notes: "", order: 1, items: [{ food: "Grilled chicken", quantity: "150g", notes: "Paneer on non-meat days", order: 0 }, { food: "Brown rice", quantity: "1 cup cooked", notes: "", order: 1 }, { food: "Mixed salad", quantity: "Large bowl", notes: "Olive oil, no creamy dressing", order: 2 }] },
        { name: "Pre-workout", time: "5:30 pm", notes: "", order: 2, items: [{ food: "Black coffee", quantity: "1 cup", notes: "", order: 0 }, { food: "Apple", quantity: "1", notes: "", order: 1 }] },
        { name: "Dinner", time: "8:30 pm", notes: "", order: 3, items: [{ food: "Dal", quantity: "1 bowl", notes: "", order: 0 }, { food: "Roti", quantity: "2", notes: "", order: 1 }, { food: "Curd", quantity: "150g", notes: "", order: 2 }] },
      ],
    },
    {
      coachingClient: fatima._id, title: "August starter plan", goal: "maintenance", notes: "Superseded — kept for reference.",
      calorieTarget: 2000, proteinTarget: 110, carbTarget: null, fatTarget: null, startDate: day(-70), active: false,
      meals: [{ name: "Breakfast", time: "", notes: "", order: 0, items: [{ food: "Eggs", quantity: "3", notes: "", order: 0 }, { food: "Toast", quantity: "2 slices", notes: "", order: 1 }] }],
    },
    {
      coachingClient: neha._id, title: "Endurance fuelling", goal: "performance", notes: "Carb load the night before long runs.",
      calorieTarget: 2400, proteinTarget: 100, carbTarget: 320, fatTarget: 70, startDate: day(-40), active: true,
      meals: [
        { name: "Breakfast", time: "6:30 am", notes: "Before easy runs.", order: 0, items: [{ food: "Peanut butter toast", quantity: "2 slices", notes: "", order: 0 }] },
        { name: "Post-run", time: "9:00 am", notes: "Within 30 minutes.", order: 1, items: [{ food: "Chocolate milk", quantity: "300ml", notes: "", order: 0 }, { food: "Boiled eggs", quantity: "2", notes: "", order: 1 }] },
      ],
    },
  ]));
  console.log("Diet plans: 3");

  // ------------------------------------------------------------ check-ins --
  // A realistic run with one week missing a weight entirely.
  const fatimaWeights: (number | null)[] = [78.4, 77.9, 77.2, null, 76.8, 76.1, 75.4, 75.6];
  const dietAdherence = ["good", "good", "excellent", "ok", "good", "excellent", "excellent", "ok"];
  const workoutAdherence = ["excellent", "good", "good", "poor", "good", "excellent", "good", "good"];
  const questions = ["", "Can I swap rice for quinoa?", "", "Travelling this week — no scale.", "", "Is it okay to train fasted?", "", "Weight went up slightly, should I worry?"];
  const notes = ["Strong start.", "", "Great week.", "Kept the habit going while away.", "", "Back on track.", "", "Normal fluctuation — told her not to worry."];

  await WeeklyCheckIn.create(
    asDocs(
      fatimaWeights.map((weight, index) => ({
      coachingClient: fatima._id,
      checkInDate: day(-7 * (fatimaWeights.length - 1 - index)),
      weight, weightUnit: "kg",
      dietAdherence: dietAdherence[index],
      workoutAdherence: workoutAdherence[index],
      questions: questions[index],
      coachNotes: notes[index],
        recordedBy: coach,
      })),
    ),
  );

  await WeeklyCheckIn.create(asDocs([
    { coachingClient: neha._id, checkInDate: day(-21), weight: 61.2, weightUnit: "kg", dietAdherence: "good", workoutAdherence: "excellent", questions: "", coachNotes: "", recordedBy: coach },
    { coachingClient: neha._id, checkInDate: day(-14), weight: 61.0, weightUnit: "kg", dietAdherence: "excellent", workoutAdherence: "good", questions: "Long run pace felt hard.", coachNotes: "Suggested slowing easy runs.", recordedBy: coach },
    { coachingClient: neha._id, checkInDate: day(-7), weight: 60.8, weightUnit: "kg", dietAdherence: "good", workoutAdherence: "good", questions: "", coachNotes: "", recordedBy: coach },
    { coachingClient: neha._id, checkInDate: day(-1), weight: 60.9, weightUnit: "kg", dietAdherence: "ok", workoutAdherence: "excellent", questions: "Race is in 6 weeks — taper plan?", coachNotes: "Draft taper next week.", recordedBy: coach },
  ]));
  console.log("Weekly check-ins: 12");

  console.log("\nDone. Sign in and walk through:");
  console.log("  Dashboard — 2 new leads, follow-ups due, memberships expiring and expired");
  console.log("  Leads     — every status, one due today and one overdue");
  console.log("  Customers — 8, four converted from leads");
  console.log("  Members   — active, expiring, expired, cancelled, terminated, upcoming, plus a renewal chain (Vikram Shah)");
  console.log("  Payments  — paid, pending and refunded, linked and unlinked");
  console.log("  Coaching  — active, paused and ended; Fatima has workouts, diet and 8 check-ins");

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
