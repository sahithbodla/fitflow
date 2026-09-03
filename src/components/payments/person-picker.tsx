"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Search, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/layout/empty-state";
import type { PersonListItem } from "@/lib/people/queries";

/**
 * Choosing a customer to act on. `hrefFor` decides where picking one leads, so
 * the same picker serves the membership and payment flows.
 */
export function PersonPicker({
  people,
  hrefFor,
  title = "Who is this for?",
  description = "Pick an existing customer, or add a new one.",
}: {
  people: PersonListItem[];
  hrefFor: (personId: string) => string;
  title?: string;
  description?: string;
}) {
  const [query, setQuery] = useState("");

  const matches = query.trim()
    ? people.filter((person) => {
        const term = query.trim().toLowerCase();
        return (
          person.name.toLowerCase().includes(term) ||
          person.phone.replace(/\D/g, "").includes(term.replace(/\D/g, "")) ||
          person.email.toLowerCase().includes(term)
        );
      })
    : people;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/people/new">
            <UserPlus className="size-4" />
            Add a new customer
          </Link>
        </Button>

        {people.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add one first, then come back."
            className="border-0 px-0 py-4"
          />
        ) : (
          <>
            <div className="relative">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, phone or email"
                aria-label="Search customers"
                className="pl-9"
              />
            </div>

            <div className="max-h-96 space-y-2 overflow-y-auto">
              {matches.map((person) => (
                <Link
                  key={person.id}
                  href={hrefFor(person.id)}
                  className="hover:bg-accent/40 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {person.name}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {person.phone}
                    </span>
                  </span>
                  <ChevronRight
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden
                  />
                </Link>
              ))}
              {matches.length === 0 ? (
                <p className="text-muted-foreground px-1 py-3 text-sm">
                  Nobody matches. Add them as a new customer instead.
                </p>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
