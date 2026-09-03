"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { saveBusinessSettingsAction } from "@/lib/actions/settings";
import { idleFormState } from "@/lib/actions/types";
import { useFormErrors } from "@/components/form/use-form-errors";
import { isHexColor, readableForeground } from "@/lib/colors";
import type { BrandSettings } from "@/lib/settings";

/** A short, practical list. Any IANA zone is accepted by the server. */
const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

function ColorField({
  id,
  name,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <Field id={id} label={label} error={error} hint="Hex value, e.g. #2563eb">
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} colour picker`}
          value={isHexColor(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="border-input h-10 w-12 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
        />
        <Input
          id={id}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          autoCapitalize="none"
          maxLength={7}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          className="font-mono"
        />
      </div>
    </Field>
  );
}

export function SettingsForm({ brand }: { brand: BrandSettings }) {
  const [state, formAction] = useActionState(
    saveBusinessSettingsAction,
    idleFormState,
  );
  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor);
  const [accentColor, setAccentColor] = useState(brand.accentColor);
  const [timezone, setTimezone] = useState(brand.timezone);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  const { errors, handleInput, alertState } = useFormErrors(state);
  const timezoneOptions = TIMEZONES.includes(timezone)
    ? TIMEZONES
    : [timezone, ...TIMEZONES];

  return (
    <form action={formAction} onInput={handleInput} className="space-y-5 pb-4" noValidate>
      <FormAlert state={alertState} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business identity</CardTitle>
          <CardDescription>
            Shown on your landing page, the public enquiry form and throughout
            the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="businessName"
            label="Business name"
            error={errors.businessName}
            required
          >
            <Input
              id="businessName"
              name="businessName"
              defaultValue={brand.businessName}
              required
              maxLength={120}
              aria-invalid={Boolean(errors.businessName)}
              aria-describedby={
                errors.businessName ? "businessName-error" : undefined
              }
            />
          </Field>

          <Field
            id="tagline"
            label="Tagline"
            hint="One short line describing what you offer. Used as your landing page headline."
            error={errors.tagline}
          >
            <Textarea
              id="tagline"
              name="tagline"
              defaultValue={brand.tagline}
              maxLength={200}
              rows={2}
              aria-describedby="tagline-hint"
            />
          </Field>

          <Field
            id="logoUrl"
            label="Logo URL"
            hint="Optional. Paste a hosted image URL — there are no file uploads in this MVP."
            error={errors.logoUrl}
          >
            <Input
              id="logoUrl"
              name="logoUrl"
              type="url"
              inputMode="url"
              autoCapitalize="none"
              defaultValue={brand.logoUrl}
              placeholder="https://…"
              aria-invalid={Boolean(errors.logoUrl)}
              aria-describedby={errors.logoUrl ? "logoUrl-error" : "logoUrl-hint"}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Colours</CardTitle>
          <CardDescription>
            Applied across buttons, highlights and charts as soon as you save.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ColorField
            id="primaryColor"
            name="primaryColor"
            label="Primary colour"
            value={primaryColor}
            onChange={setPrimaryColor}
            error={errors.primaryColor}
          />
          <ColorField
            id="accentColor"
            name="accentColor"
            label="Accent colour"
            value={accentColor}
            onChange={setAccentColor}
            error={errors.accentColor}
          />

          <div className="sm:col-span-2">
            <p className="text-muted-foreground mb-2 text-xs">Preview</p>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-md px-4 py-2 text-sm font-medium"
                style={
                  isHexColor(primaryColor)
                    ? {
                        backgroundColor: primaryColor,
                        color: readableForeground(primaryColor),
                      }
                    : undefined
                }
              >
                Primary button
              </span>
              <span
                className="rounded-md px-4 py-2 text-sm font-medium"
                style={
                  isHexColor(accentColor)
                    ? {
                        backgroundColor: accentColor,
                        color: readableForeground(accentColor),
                      }
                    : undefined
                }
              >
                Accent
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact &amp; location</CardTitle>
          <CardDescription>
            Optional. Shown on your landing page so leads can reach you.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="contactPhone" label="Phone" error={errors.contactPhone}>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={brand.contactPhone}
            />
          </Field>

          <Field id="contactEmail" label="Email" error={errors.contactEmail}>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              defaultValue={brand.contactEmail}
              aria-invalid={Boolean(errors.contactEmail)}
              aria-describedby={
                errors.contactEmail ? "contactEmail-error" : undefined
              }
            />
          </Field>

          <Field
            id="whatsappNumber"
            label="WhatsApp number"
            error={errors.whatsappNumber}
          >
            <Input
              id="whatsappNumber"
              name="whatsappNumber"
              type="tel"
              inputMode="tel"
              defaultValue={brand.whatsappNumber}
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
              defaultValue={brand.instagramHandle}
              autoCapitalize="none"
              autoCorrect="off"
              aria-describedby="instagramHandle-hint"
            />
          </Field>

          <Field id="addressLine" label="Address" error={errors.addressLine}>
            <Input
              id="addressLine"
              name="addressLine"
              autoComplete="street-address"
              defaultValue={brand.addressLine}
            />
          </Field>

          <Field id="city" label="City" error={errors.city}>
            <Input
              id="city"
              name="city"
              autoComplete="address-level2"
              defaultValue={brand.city}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regional</CardTitle>
          <CardDescription>
            Controls how dates and prices are displayed and when a day rolls
            over.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            id="timezone"
            label="Timezone"
            hint="Used for follow-up dates and membership expiry."
            error={errors.timezone}
          >
            <input type="hidden" name="timezone" value={timezone} />
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone" className="w-full">
                <SelectValue placeholder="Select a timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            id="currency"
            label="Currency code"
            hint="Used to format prices, e.g. INR, USD, GBP."
            error={errors.currency}
          >
            <Input
              id="currency"
              name="currency"
              defaultValue={brand.currency}
              maxLength={8}
              autoCapitalize="characters"
              className="uppercase"
              aria-invalid={Boolean(errors.currency)}
              aria-describedby={
                errors.currency ? "currency-error" : "currency-hint"
              }
            />
          </Field>
        </CardContent>
      </Card>

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-20 z-20 -mx-4 border-t px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:bottom-0">
        <SubmitButton className="w-full sm:w-auto">Save changes</SubmitButton>
      </div>
    </form>
  );
}
