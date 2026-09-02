"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { saveBusinessSettingsAction } from "@/lib/actions/settings";
import { idleFormState } from "@/lib/actions/types";
import { isHexColor } from "@/lib/colors";
import type { BrandSettings } from "@/lib/settings";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

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
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="font-mono"
        />
      </div>
    </Field>
  );
}

function SaveBar() {
  const { pending } = useFormStatus();
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-20 z-20 -mx-4 border-t px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:bottom-0">
      <Button
        type="submit"
        disabled={pending}
        className="bg-brand text-brand-foreground hover:bg-brand-strong w-full sm:w-auto"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </div>
  );
}

export function SettingsForm({ brand }: { brand: BrandSettings }) {
  const [state, formAction] = useActionState(
    saveBusinessSettingsAction,
    idleFormState,
  );
  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor);
  const [accentColor, setAccentColor] = useState(brand.accentColor);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.status === "error" && state.message ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business identity</CardTitle>
          <CardDescription>
            Shown on the landing page, the public enquiry form and throughout the
            app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="businessName" label="Business name" error={errors.businessName}>
            <Input
              id="businessName"
              name="businessName"
              defaultValue={brand.businessName}
              required
              maxLength={120}
              aria-invalid={Boolean(errors.businessName)}
              aria-describedby={errors.businessName ? "businessName-error" : undefined}
            />
          </Field>

          <Field
            id="tagline"
            label="Tagline"
            hint="One short line describing what you offer."
            error={errors.tagline}
          >
            <Textarea
              id="tagline"
              name="tagline"
              defaultValue={brand.tagline}
              maxLength={200}
              rows={2}
            />
          </Field>

          <Field
            id="logoUrl"
            label="Logo URL"
            hint="Optional. Paste a hosted image URL — file uploads are not part of this MVP."
            error={errors.logoUrl}
          >
            <Input
              id="logoUrl"
              name="logoUrl"
              type="url"
              inputMode="url"
              defaultValue={brand.logoUrl}
              placeholder="https://…"
              aria-invalid={Boolean(errors.logoUrl)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Colours</CardTitle>
          <CardDescription>
            Applied instantly across buttons, highlights and charts once saved.
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
                style={{
                  backgroundColor: isHexColor(primaryColor) ? primaryColor : undefined,
                  color: "#fff",
                }}
              >
                Primary button
              </span>
              <span
                className="rounded-md px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: isHexColor(accentColor) ? accentColor : undefined,
                  color: "#111",
                }}
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
            Optional. Used on the landing page so leads can reach you.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="contactPhone" label="Phone" error={errors.contactPhone}>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              inputMode="tel"
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
              defaultValue={brand.contactEmail}
              aria-invalid={Boolean(errors.contactEmail)}
            />
          </Field>
          <Field id="whatsappNumber" label="WhatsApp number" error={errors.whatsappNumber}>
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
            />
          </Field>
          <Field id="addressLine" label="Address" error={errors.addressLine}>
            <Input
              id="addressLine"
              name="addressLine"
              defaultValue={brand.addressLine}
            />
          </Field>
          <Field id="city" label="City" error={errors.city}>
            <Input id="city" name="city" defaultValue={brand.city} />
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
              className="uppercase"
            />
          </Field>
        </CardContent>
      </Card>

      <SaveBar />
    </form>
  );
}
