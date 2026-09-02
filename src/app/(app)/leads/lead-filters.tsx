"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LEAD_INTERESTS,
  LEAD_INTEREST_LABELS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
} from "@/lib/leads/constants";

const DUE_OPTIONS = [
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Due this week" },
] as const;

/**
 * Search + filters, driven entirely through the URL so results are shareable,
 * survive a refresh and work with the browser's back button.
 */
export function LeadFilters({
  statusCounts,
}: {
  statusCounts: Record<string, number>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const firstRender = useRef(true);

  const status = searchParams.get("status");
  const interest = searchParams.get("interest");
  const source = searchParams.get("source");
  const due = searchParams.get("due");

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // Any filter change returns to the first page.
    params.delete("page");
    startTransition(() => {
      router.replace(`/leads?${params.toString()}`, { scroll: false });
    });
  };

  // Debounce the search box so typing does not fire a request per keystroke.
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

  const activeCount = [interest, source, due].filter(Boolean).length;

  const clearAll = () => {
    setTerm("");
    startTransition(() => router.replace("/leads", { scroll: false }));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search name, phone or email"
            aria-label="Search leads"
            className="pl-9"
          />
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="shrink-0 gap-2">
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeCount > 0 ? (
                <Badge variant="secondary" className="ml-0.5 px-1.5 text-[10px]">
                  {activeCount}
                </Badge>
              ) : null}
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle>Filter leads</SheetTitle>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-6">
              <FilterGroup
                label="Interested in"
                options={LEAD_INTERESTS.map((value) => ({
                  value,
                  label: LEAD_INTEREST_LABELS[value],
                }))}
                selected={interest}
                onSelect={(value) => setParam("interest", value)}
              />

              <FilterGroup
                label="Source"
                options={LEAD_SOURCES.map((value) => ({
                  value,
                  label: LEAD_SOURCE_LABELS[value],
                }))}
                selected={source}
                onSelect={(value) => setParam("source", value)}
              />

              <FilterGroup
                label="Follow-up"
                options={DUE_OPTIONS.map((option) => ({ ...option }))}
                selected={due}
                onSelect={(value) => setParam("due", value)}
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearAll}
                  disabled={activeCount === 0 && !status && !term}
                >
                  Clear all
                </Button>
                <Button
                  className="bg-brand text-brand-foreground hover:bg-brand-strong flex-1"
                  onClick={() => setSheetOpen(false)}
                >
                  Show results
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Status rail — the most-used filter, always one tap away. */}
      <div
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        role="group"
        aria-label="Filter by status"
      >
        <StatusChip
          label="All"
          count={statusCounts.all ?? 0}
          active={!status}
          onClick={() => setParam("status", null)}
        />
        {LEAD_STATUSES.map((value) => (
          <StatusChip
            key={value}
            label={LEAD_STATUS_LABELS[value]}
            count={statusCounts[value] ?? 0}
            active={status === value}
            onClick={() => setParam("status", status === value ? null : value)}
          />
        ))}
      </div>

      {activeCount > 0 || term ? (
        <button
          type="button"
          onClick={clearAll}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
        >
          <X className="size-3" />
          Clear filters
        </button>
      ) : null}

      {isPending ? (
        <span className="sr-only" role="status">
          Updating results
        </span>
      ) : null}
    </div>
  );
}

function StatusChip({
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
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "hover:bg-accent",
      )}
    >
      {label}
      <span className={cn("ml-1.5 text-xs", active ? "opacity-80" : "text-muted-foreground")}>
        {count}
      </span>
    </button>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? null : option.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-brand bg-brand text-brand-foreground"
                  : "hover:bg-accent",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
