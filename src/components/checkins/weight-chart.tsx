import { formatDate } from "@/lib/dates";
import type { WeightSeriesPoint } from "@/lib/checkins/queries";

/**
 * Weight over time.
 *
 * A single series, so there is no legend — the heading names it — and no
 * categorical palette to validate. The line wears the brand colour; every
 * label wears a text token.
 *
 * Server-rendered SVG with no client JavaScript: hover text comes from native
 * `<title>` elements, and the full table view is the check-in history rendered
 * directly beneath this chart.
 *
 * The y-axis is deliberately NOT zero-based — a zero-based weight chart
 * flattens every real change into noise — so the axis minimum and maximum are
 * both labelled to make the scale explicit rather than misleading.
 */
export function WeightChart({
  series,
  unit,
  timeZone,
}: {
  series: WeightSeriesPoint[];
  unit: string;
  timeZone: string;
}) {
  // A line needs at least two points to mean anything.
  if (series.length < 2) return null;

  const width = 600;
  const height = 200;
  const padding = { top: 26, right: 14, bottom: 30, left: 14 };

  const weights = series.map((point) => point.weight);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const range = rawMax - rawMin;
  // Keep a visible band even when every reading is identical.
  const pad = range === 0 ? 1 : range * 0.2;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;

  const times = series.map((point) => new Date(point.date).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tRange = tMax - tMin || 1;

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const x = (time: number) =>
    padding.left + ((time - tMin) / tRange) * plotWidth;
  const y = (weight: number) =>
    padding.top + ((yMax - weight) / (yMax - yMin)) * plotHeight;

  const points = series.map((point, index) => ({
    ...point,
    cx: x(times[index]),
    cy: y(point.weight),
  }));

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.cx} ${point.cy}`)
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];

  const summary = `Weight from ${first.weight}${unit} on ${formatDate(
    first.date,
    timeZone,
  )} to ${last.weight}${unit} on ${formatDate(last.date, timeZone)}, across ${
    series.length
  } check-ins.`;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={summary}
      >
        {/* Recessive gridlines at the axis bounds and midpoint. */}
        {[yMax, (yMax + yMin) / 2, yMin].map((value) => (
          <line
            key={value}
            x1={padding.left}
            x2={width - padding.right}
            y1={y(value)}
            y2={y(value)}
            stroke="currentColor"
            strokeWidth={1}
            className="text-border"
          />
        ))}

        {/* 2px line in the brand colour. */}
        <path
          d={path}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 8px markers with a 2px surface ring so they stay legible on the grid. */}
        {points.map((point) => (
          <circle
            key={point.date}
            cx={point.cx}
            cy={point.cy}
            r={4}
            fill="var(--brand)"
            stroke="var(--background)"
            strokeWidth={2}
          >
            <title>
              {`${point.weight}${unit} · ${formatDate(point.date, timeZone)}`}
            </title>
          </circle>
        ))}

        {/* Direct labels on the endpoints only — never a number on every point. */}
        <text
          x={first.cx}
          y={first.cy - 12}
          textAnchor="start"
          className="fill-muted-foreground text-[13px]"
        >
          {first.weight}
          {unit}
        </text>
        <text
          x={last.cx}
          y={last.cy - 12}
          textAnchor="end"
          className="fill-foreground text-[13px] font-medium"
        >
          {last.weight}
          {unit}
        </text>

        {/* Both axis bounds are labelled because the scale is not zero-based. */}
        <text
          x={padding.left}
          y={height - 10}
          textAnchor="start"
          className="fill-muted-foreground text-[12px]"
        >
          {formatDate(first.date, timeZone)}
        </text>
        <text
          x={width - padding.right}
          y={height - 10}
          textAnchor="end"
          className="fill-muted-foreground text-[12px]"
        >
          {formatDate(last.date, timeZone)}
        </text>
      </svg>

      <figcaption className="text-muted-foreground/80 mt-2 text-xs">
        Scale runs {yMin.toFixed(1)}–{yMax.toFixed(1)}
        {unit}, not from zero. Every reading is listed below.
      </figcaption>
    </figure>
  );
}
