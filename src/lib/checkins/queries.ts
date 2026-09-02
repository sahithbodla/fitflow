import "server-only";
import { connectToDatabase } from "@/lib/db";
import { WeeklyCheckIn, type WeeklyCheckInDoc } from "@/models/WeeklyCheckIn";
import type { AdherenceLevel, WeightUnit } from "@/lib/checkins/constants";

export type CheckInView = {
  id: string;
  coachingClientId: string;
  checkInDate: string;
  weight: number | null;
  weightUnit: WeightUnit;
  dietAdherence: AdherenceLevel | "";
  workoutAdherence: AdherenceLevel | "";
  questions: string;
  coachNotes: string;
  recordedBy: string;
  /** Change against the previous check-in that recorded a weight. */
  weightChange: number | null;
};

function toView(doc: WeeklyCheckInDoc): Omit<CheckInView, "weightChange"> {
  return {
    id: String(doc._id),
    coachingClientId: String(doc.coachingClient),
    checkInDate: doc.checkInDate.toISOString(),
    weight: doc.weight ?? null,
    weightUnit: (doc.weightUnit ?? "kg") as WeightUnit,
    dietAdherence: (doc.dietAdherence ?? "") as AdherenceLevel | "",
    workoutAdherence: (doc.workoutAdherence ?? "") as AdherenceLevel | "",
    questions: doc.questions ?? "",
    coachNotes: doc.coachNotes ?? "",
    recordedBy: doc.recordedBy ?? "",
  };
}

/**
 * Check-ins newest first, each annotated with the weight change against the
 * previous check-in that actually recorded one.
 *
 * Check-ins with no weight are skipped when computing the change rather than
 * treated as zero, so a partial check-in never fabricates a swing.
 */
export async function listCheckIns(
  coachingClientId: string,
): Promise<CheckInView[]> {
  await connectToDatabase();

  const docs = await WeeklyCheckIn.find({
    coachingClient: coachingClientId,
    archivedAt: null,
  })
    .sort({ checkInDate: 1 })
    .lean<WeeklyCheckInDoc[]>();

  const ascending: CheckInView[] = [];
  let previousWeight: number | null = null;

  for (const doc of docs) {
    const view = toView(doc);
    const weightChange =
      view.weight !== null && previousWeight !== null
        ? Number((view.weight - previousWeight).toFixed(2))
        : null;
    if (view.weight !== null) previousWeight = view.weight;
    ascending.push({ ...view, weightChange });
  }

  return ascending.reverse();
}

export async function getCheckIn(id: string): Promise<CheckInView | null> {
  await connectToDatabase();
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const doc = await WeeklyCheckIn.findOne({
    _id: id,
    archivedAt: null,
  }).lean<WeeklyCheckInDoc>();
  if (!doc) return null;

  return { ...toView(doc), weightChange: null };
}

export type WeightSeriesPoint = {
  date: string;
  weight: number;
};

export type CheckInSummary = {
  total: number;
  latestWeight: number | null;
  weightUnit: WeightUnit;
  /** Change from the first recorded weight to the latest. */
  totalChange: number | null;
  /** Change from the previous recorded weight to the latest. */
  lastChange: number | null;
  series: WeightSeriesPoint[];
  lastCheckInDate: string | null;
};

export async function getCheckInSummary(
  coachingClientId: string,
): Promise<CheckInSummary> {
  await connectToDatabase();

  const docs = await WeeklyCheckIn.find({
    coachingClient: coachingClientId,
    archivedAt: null,
  })
    .sort({ checkInDate: 1 })
    .lean<WeeklyCheckInDoc[]>();

  const withWeight = docs.filter(
    (doc) => doc.weight !== null && doc.weight !== undefined,
  );

  const series: WeightSeriesPoint[] = withWeight.map((doc) => ({
    date: doc.checkInDate.toISOString(),
    weight: doc.weight as number,
  }));

  const first = series[0]?.weight ?? null;
  const latest = series.at(-1)?.weight ?? null;
  const previous = series.length > 1 ? series.at(-2)!.weight : null;

  return {
    total: docs.length,
    latestWeight: latest,
    weightUnit: (withWeight.at(-1)?.weightUnit ?? "kg") as WeightUnit,
    totalChange:
      first !== null && latest !== null
        ? Number((latest - first).toFixed(2))
        : null,
    lastChange:
      previous !== null && latest !== null
        ? Number((latest - previous).toFixed(2))
        : null,
    series,
    lastCheckInDate: docs.at(-1)?.checkInDate.toISOString() ?? null,
  };
}
