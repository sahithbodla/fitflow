"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/form/field";
import {
  LEAD_INTERESTS,
  LEAD_INTEREST_LABELS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadInterest,
  type LeadSource,
  type LeadStatus,
} from "@/lib/leads/constants";

export type LeadFormDefaults = {
  name: string;
  phone: string;
  email: string;
  instagramHandle: string;
  fitnessGoal: string;
  interestedIn: LeadInterest;
  source: LeadSource;
  status: LeadStatus;
  /** `yyyy-mm-dd`, or "" for none. */
  followUpDate: string;
};

export const EMPTY_LEAD_DEFAULTS: LeadFormDefaults = {
  name: "",
  phone: "",
  email: "",
  instagramHandle: "",
  fitnessGoal: "",
  interestedIn: "gym",
  source: "manual",
  status: "new",
  followUpDate: "",
};

/**
 * The shared field set for creating and editing a lead.
 *
 * Selects are Radix components, which do not post a value themselves, so each
 * carries a hidden input holding the current selection.
 */
export function LeadFormFields({
  defaults,
  errors,
  showStatus = true,
}: {
  defaults: LeadFormDefaults;
  errors: Record<string, string>;
  showStatus?: boolean;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact details</CardTitle>
          <CardDescription>
            Name and phone are required — everything else can be filled in later.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            id="name"
            label="Name"
            error={errors.name}
            required
            className="sm:col-span-2"
          >
            <Input
              id="name"
              name="name"
              defaultValue={defaults.name}
              required
              maxLength={120}
              autoComplete="name"
              autoCapitalize="words"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>

          <Field id="phone" label="Phone" error={errors.phone} required>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={defaults.phone}
              required
              maxLength={30}
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
          </Field>

          <Field id="email" label="Email" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              defaultValue={defaults.email}
              maxLength={200}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </Field>

          <Field
            id="instagramHandle"
            label="Instagram handle"
            hint="Without the @."
            error={errors.instagramHandle}
          >
            <Input
              id="instagramHandle"
              name="instagramHandle"
              defaultValue={defaults.instagramHandle}
              maxLength={60}
              autoCapitalize="none"
              autoCorrect="off"
              aria-describedby="instagramHandle-hint"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enquiry</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="interestedIn"
            label="Interested in"
            defaultValue={defaults.interestedIn}
            error={errors.interestedIn}
            required
            options={LEAD_INTERESTS.map((value) => ({
              value,
              label: LEAD_INTEREST_LABELS[value],
            }))}
          />

          <SelectField
            id="source"
            label="Source"
            defaultValue={defaults.source}
            error={errors.source}
            options={LEAD_SOURCES.map((value) => ({
              value,
              label: LEAD_SOURCE_LABELS[value],
            }))}
          />

          {showStatus ? (
            <SelectField
              id="status"
              label="Status"
              defaultValue={defaults.status}
              error={errors.status}
              options={LEAD_STATUSES.map((value) => ({
                value,
                label: LEAD_STATUS_LABELS[value],
              }))}
            />
          ) : (
            <input type="hidden" name="status" value={defaults.status} />
          )}

          <Field
            id="followUpDate"
            label="Follow up on"
            hint="Optional. Shows on your dashboard when due."
            error={errors.followUpDate}
          >
            <Input
              id="followUpDate"
              name="followUpDate"
              type="date"
              defaultValue={defaults.followUpDate}
              aria-describedby="followUpDate-hint"
            />
          </Field>

          <Field
            id="fitnessGoal"
            label="Goal"
            hint="What are they trying to achieve?"
            error={errors.fitnessGoal}
            className="sm:col-span-2"
          >
            <Textarea
              id="fitnessGoal"
              name="fitnessGoal"
              defaultValue={defaults.fitnessGoal}
              rows={3}
              maxLength={1000}
              aria-describedby="fitnessGoal-hint"
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * A Radix select paired with a hidden input carrying the value.
 *
 * Radix only creates its own hidden control once the component hydrates, so a
 * form submitted in that window would post no value and the user would be told
 * to pick something that already looks picked. The hidden input is server-
 * rendered with the current value, so the field always posts.
 */
function SelectField({
  id,
  label,
  defaultValue,
  options,
  error,
  required,
}: {
  id: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Field id={id} label={label} error={error} required={required}>
      <input type="hidden" name={id} value={value} readOnly />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
