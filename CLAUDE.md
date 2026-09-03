# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

FitFlow — a mobile-first CRM and coaching platform for a **single** fitness business.
One deployment serves one gym: there is one authenticated staff account, no
public sign-up, and no multi-tenancy. Branding (name, colours, contact details)
is configurable so the same codebase can be deployed for any gym, but a
deployment is never shared between businesses. Adding tenant isolation later
would be a rewrite, so do not introduce per-tenant scoping casually.

Built by following `docs/fitness_crm_coaching_claude_code_prompt_pack.txt`,
which also lists what is deliberately **not** built: multiple roles, a
client-facing portal, photo uploads, Instagram integration, AI features,
automated messaging, multi-branch, payment gateway. Confirm before adding any
of those.

## Commands

Local development needs two terminals — the app expects a MongoDB it does not
start itself:

```bash
npm run db:dev   # terminal 1: real mongod on :27017, data in .mongo-data/
npm run dev      # terminal 2
```

`db:dev` uses `mongodb-memory-server` to run a **real mongod on a fixed port
with an on-disk data directory**, not an ephemeral in-process instance — the
dev server and the seed scripts must share one database. Pointing
`MONGODB_URI` at Atlas instead is a one-line `.env.local` change and needs no
code edit; do not run `db:dev` in that case.

```bash
npm run check          # lint + typecheck + test + build (run before finishing)
npm test               # all logic checks
npx tsx scripts/__checks__/dates.check.ts   # one check file
npm run seed:admin     # create/repair the staff login (no public sign-up exists)
npm run seed:demo -- --reset   # realistic data across every screen
```

`seed:demo --reset` clears all business data but never the login or business
settings. Its dates are relative to today so the dashboard's due/expiring/
expired buckets are always populated.

## Testing

`npm test` runs every `scripts/__checks__/*.check.ts` in its own process. These
are fast, dependency-free assertions over pure logic — dates and timezones,
membership duration arithmetic, derived membership status, rate limiting and
phone normalisation. There are **no automated browser or integration tests**;
UI flows are verified by hand.

Anything with non-obvious edge cases (month-end clamping, DST, day boundaries
across timezones) belongs in a check file rather than being reasoned about in
review.

## Architecture

Next.js 16 App Router, React 19, Mongoose, Tailwind v4, shadcn/ui. **Read
`AGENTS.md` and the bundled docs in `node_modules/next/dist/docs/` before
writing framework code** — this Next.js major differs from most training data.
Notably route protection lives in `src/proxy.ts`, not `middleware.ts`.

### Request flow

`src/proxy.ts` is a fast first gate that only checks for a well-formed session
cookie. It is **never** the authorization check. Every protected page calls
`requireUser()` and every server action calls `requireUserOrThrow()`
(`src/lib/auth/guard.ts`), which re-validate the user against the database so a
deactivated account cannot use an unexpired token.

### Auth is deliberately hand-rolled

bcryptjs for hashing, `jose` for a signed httpOnly JWT cookie. There is one
role and email/password only, so NextAuth would add a beta dependency for
nothing. **Do not "upgrade" this without asking.**

### Data layer conventions

- **Nothing is hard-deleted.** Every model has `archivedAt`; queries filter
  `archivedAt: null`. Plans and exercises additionally deactivate via `active`
  so historical records stay resolvable.
- **`src/lib/collections.ts` is the single source of truth for collection
  names.** Models bind to them via the schema's `collection` option, and
  `src/lib/dashboard.ts` counts documents in collections whose features may not
  exist yet. Renaming one silently breaks dashboard metrics.
- **Aggregation pipelines bypass Mongoose casting.** MongoDB compares BSON
  types strictly, so a stringified id matched against an ObjectId field returns
  nothing *silently*. This has already caused two production-shaped bugs. Pass
  real `Types.ObjectId` values into any `$match`, and keep ids unstringified
  when a filter is reused by both `find()` and `aggregate()`.
- **Snapshot what was agreed.** A membership stores its own `planName` and
  `price`; a workout entry stores `exerciseName` and `videoUrl`. Renaming or
  repricing the source must never rewrite history.
- **Assigning a workout template deep-copies it.** `assignWorkoutAction`
  rebuilds every subdocument field by field so the client's plan gets fresh
  ids and shares no references — editing a client's plan can never reach the
  template or another client.

### Derived vs stored status

A membership's usable state is **computed from its dates at read time**
(`src/lib/memberships/status.ts`), not stored — so it expires when the business
day rolls over, with no scheduled job and no stale rows. Only `cancelled` and
`terminated` are stored decisions, and they win over the dates.

`effectiveStatus()` (per-row, in JS) and `stateFilter()` (in
`src/lib/memberships/queries.ts`, in the database, so lists can paginate) encode
the same rules twice. **Change one and you must change the other**, or counts
and badges will disagree.

### Dates and timezones

The business runs in one timezone (`BusinessSettings.timezone`). "Today",
"due" and "expiring soon" are evaluated against the *business* day, never the
server day. Always go through `src/lib/dates.ts`; never `new Date("yyyy-mm-dd")`
(that parses as UTC midnight, landing a day early west of Greenwich). Form
dates become instants via `zonedDayStart()`.

`formatDate` uses a fixed month table rather than `Intl` month `short`, because
ICU renders September as "Sept" in some Node builds.

## Server actions and forms

All mutations are server actions in `src/lib/actions/`, driven by
`useActionState` and the shared `FormState` contract in
`src/lib/actions/types.ts`. Four patterns exist because each fixes a real bug —
follow them:

1. **Failed actions echo submitted values back** (`formValues()` +
   `withSubmittedValues()`), because React resets uncontrolled inputs once an
   action settles and would otherwise discard everything the user typed. The
   form needs a `key` derived from `state.values` so `defaultValue` reapplies.

2. **A button whose click implies a value carries it as submit-button
   `name`/`value`** — status chips, "add anyway", "clear reminder". Setting
   state and then calling `requestSubmit()` races React's commit and sends
   stale data.

3. **Selects post a server-rendered hidden input**, not Radix's own hidden
   control, which only exists after hydration. Read-only, never `disabled`, for
   fields that must still post (a disabled input posts nothing).

4. **`useFormErrors`** (`src/components/form/use-form-errors.ts`) clears a
   field's error as the user corrects it. One `onInput` on the `<form>` covers
   every field via bubbling — attach it or errors persist until the next
   submit.

`ConfirmSubmit` is a real `type="submit"` that only prevents the default inside
its click handler, so without JavaScript the action still runs and only the
confirmation is lost. Never gate an action behind a trigger that does nothing
without JS.

### The effect lint rule

`react-hooks/set-state-in-effect` is an **error**. Do not call `setState`
inside an effect to close a form or reset a toggle. Instead give the component
a `key` derived from the data that changed so it remounts — see
`dayFingerprint` in `src/components/workouts/workout-builder.tsx`.

### Builders persist every step

The workout and diet builders make each addition or edit its own form posting
to a server action rather than one large client-side draft, so a coach cannot
lose half-built work by navigating away and each step works before hydration.
Keep that property when extending them.

## Adding a route

Next 16 generates typed-route definitions during a build. After adding a page,
`PageProps<"/your/route">` will fail typecheck until you run `npm run build`
once. If `.next/dev/types` goes stale mid-session, `rm -rf .next` and rebuild.

## Verification limits in this environment

The in-app browser pane runs hidden, so **Chrome suspends script and React
never hydrates there**. Consequences that look like app bugs but are not:
`onClick` handlers are inert, Radix overlays never open (`data-state` stays
`closed`), `innerText`/`textContent` return `""`, and
`getBoundingClientRect()` returns zeros so ref-based clicks fail.

Screenshots force a paint and are reliable ground truth for rendering. To
exercise a server action, set inputs with the native value setter and call
`form.requestSubmit()` — native submission needs no React — then assert against
MongoDB. Genuinely client-only behaviour cannot be verified here; say so
explicitly rather than implying it was tested.
