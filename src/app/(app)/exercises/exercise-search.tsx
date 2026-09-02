"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  EXERCISE_CATEGORIES,
  EXERCISE_CATEGORY_LABELS,
} from "@/lib/workouts/constants";

export function ExerciseSearch({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const firstRender = useRef(true);

  const category = searchParams.get("category");

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => {
      router.replace(`/exercises?${params.toString()}`, { scroll: false });
    });
  };

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== term) {
        setParam("q", term.trim() || null);
      }
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search exercises"
          aria-label="Search exercises"
          className="pl-9"
        />
      </div>

      <div
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        role="group"
        aria-label="Filter by category"
      >
        <Chip
          label="All"
          count={counts.all ?? 0}
          active={!category}
          onClick={() => setParam("category", null)}
        />
        {EXERCISE_CATEGORIES.filter((value) => (counts[value] ?? 0) > 0).map(
          (value) => (
            <Chip
              key={value}
              label={EXERCISE_CATEGORY_LABELS[value]}
              count={counts[value] ?? 0}
              active={category === value}
              onClick={() =>
                setParam("category", category === value ? null : value)
              }
            />
          ),
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
        active ? "border-brand bg-brand text-brand-foreground" : "hover:bg-accent",
      )}
    >
      {label}
      <span
        className={cn(
          "ml-1.5 text-xs",
          active ? "opacity-80" : "text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
