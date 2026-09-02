# FitFlow

A mobile-first CRM and coaching platform for a fitness business — leads through
to memberships, personal training and online coaching, in one application.

> **Status: MVP complete.** The whole journey works end to end — landing page →
> public enquiry → CRM → conversion → customer → membership → renewal → payment,
> and online coaching with workout plans, diet plans and weekly check-ins — on a
> dashboard driven entirely by real counts. See **Known limitations** and
> **Not built** below for what is deliberately out of scope.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui on Radix primitives |
| Database | MongoDB (Atlas in production) via Mongoose |
| Validation | Zod, on every input, server-side |
| Auth | Email + password; bcrypt hashing; signed JWT session cookie (`jose`) |
| Icons | Lucide |
| Deployment | Docker image, targeted at Render |

### Why not NextAuth?

Auth here is a single internal staff role with email + password. A hand-rolled
session — bcrypt for hashing, `jose` for a signed, `httpOnly`, `SameSite=Lax`
cookie — keeps the surface small, fully typed, and free of a beta dependency on
a brand-new Next.js major. Every protected page and server action re-validates
the user against the database (see `src/lib/auth/guard.ts`); `src/proxy.ts` is a
fast first gate, never the only check.

---

## Prerequisites

- **Node.js 20.9+** (developed on 22.x)
- **npm 10+**
- A **MongoDB** database — MongoDB Atlas free tier is enough. For local work you
  can use the bundled dev database instead (below); no Docker required.

---

## Local setup

```bash
npm install
cp .env.example .env.local
```

Then fill in `.env.local`:

```bash
# generate a session secret
openssl rand -base64 48
```

### Option A — bundled local database (no Atlas account needed)

`npm run db:dev` starts a real `mongod` on port 27017 with an on-disk data
directory at `.mongo-data/` (gitignored). The binary is downloaded on first run
by `mongodb-memory-server`. Data survives restarts, and the dev server and seed
script share one database.

```bash
# terminal 1 — leave running
npm run db:dev

# .env.local
MONGODB_URI=mongodb://127.0.0.1:27017/fitflow
```

### Option B — MongoDB Atlas

Create a free cluster, add a database user, allow your IP under Network Access,
and copy the connection string:

```bash
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/fitflow?retryWrites=true&w=majority
```

Do **not** run `npm run db:dev` when using Atlas.

### Create the staff account

There is no public sign-up route by design. Set the seed variables in
`.env.local` and run:

```bash
npm run seed:admin
```

```bash
SEED_ADMIN_NAME=Owner
SEED_ADMIN_EMAIL=you@yourgym.com
SEED_ADMIN_PASSWORD=at-least-ten-characters
```

Re-running is safe — an existing account is left untouched. To change a
password: `npm run seed:admin -- --reset-password`. Remove the seed variables
once the account exists.

### Run it

```bash
npm run dev
```

Open http://localhost:3000 and sign in at `/login`.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `AUTH_SECRET` | ✅ | Signs session cookies. Minimum 32 characters |
| `NEXT_PUBLIC_APP_URL` | — | Public origin of the app |
| `AUTH_URL` | — | Public origin, used for auth redirects |
| `SEED_ADMIN_NAME` | — | Seed script only |
| `SEED_ADMIN_EMAIL` | — | Seed script only |
| `SEED_ADMIN_PASSWORD` | — | Seed script only |

Validation lives in `src/lib/env.ts` and runs lazily, so a missing runtime
secret produces a clear error at request time rather than breaking `next build`.
Values are never logged.

---

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Logic checks (dates, timezones) |
| `npm run check` | lint + typecheck + test + build |
| `npm run db:dev` | Local MongoDB for development |
| `npm run seed:admin` | Create/repair the staff account |

---

## Health endpoint

`GET /api/health` returns `200` when configuration and the database are both
usable, `503` otherwise. It reports variable *names* and error *types* only —
never values.

```json
{
  "status": "ok",
  "checks": {
    "environment": { "ok": true, "missing": [], "problems": [] },
    "database": { "ok": true }
  }
}
```

---

## Deploying to Render

1. **MongoDB Atlas** — create a cluster and a database user. Under *Network
   Access*, allow Render's outbound IPs, or `0.0.0.0/0` if you accept that
   trade-off for an MVP.
2. **Push this repository** to GitHub.
3. **Create the Render service** — New → Web Service → connect the repo. Render
   picks up `render.yaml`; otherwise choose runtime **Docker** with
   `./Dockerfile` and health check path `/api/health`.
4. **Set environment variables** in the Render dashboard (they are deliberately
   `sync: false` in `render.yaml`, so no secret is committed):
   - `MONGODB_URI`
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL` — `https://<your-service>.onrender.com`
   - `AUTH_URL` — same value
5. **Deploy**, then confirm `https://<your-service>.onrender.com/api/health`
   returns `200`.
6. **Create the staff account** — Render Shell: `npm run seed:admin` with the
   seed variables set, or run the seed locally against the same Atlas database.

**Post-deploy note:** `NEXT_PUBLIC_APP_URL` and `AUTH_URL` must match the real
deployed origin. Update them after any custom-domain change and redeploy.

No persistent disk is used — all state lives in MongoDB. There are no file
uploads in this MVP; logos are referenced by URL.

---

## Project structure

```
src/
  app/
    (app)/            protected shell — dashboard, settings
    (public)/lead/    public enquiry form
    api/health/       health probe
    login/            sign-in
    page.tsx          landing page
  components/
    branding/         brand mark, runtime colour injection
    layout/           nav, page header, stat card, empty state
    ui/               shadcn primitives
  lib/
    actions/          server actions
    auth/             password hashing, sessions, route guards
    checkins/         weekly check-in queries and vocabulary
    coaching/         coaching client queries
    diet/             diet plan queries and vocabulary
    leads/            lead queries, phone normalisation, vocabulary
    memberships/      membership queries and derived status
    people/           customer queries and conversion vocabulary
    workouts/         exercise and workout queries
    validation/       Zod schemas
    collections.ts    canonical MongoDB collection names
    dashboard.ts      dashboard metric queries
    dates.ts          timezone-safe date handling
    db.ts             cached Mongoose connection
    env.ts            lazy environment validation
    rate-limit.ts     in-memory limiter for the public form
    settings.ts       business settings + branding
  models/             Mongoose models
  proxy.ts            first-gate route protection
scripts/
  __checks__/         logic checks run by `npm test`
  dev-db.ts           local MongoDB
  seed-admin.ts       staff account bootstrap
```

## Online coaching

A coaching engagement belongs to a **Person**, so identity is never duplicated,
and a customer can only ever have one. Its workspace is split into Overview,
Workouts, Diet and Check-ins — driven by the URL (`?tab=`) rather than client
state, so a section is linkable and survives a refresh.

**Workouts.** Templates are reusable; assigning one **deep-copies** its days
into the client's own plan, rebuilding every subdocument so the copy shares no
references. Customising a client's plan can never reach the template or another
client's plan. Plans can also be built from scratch. Exercise names and video
links are snapshotted when added, so renaming a library entry never rewrites
what was prescribed.

**Diet.** Meal sections with foods and free-text quantities. Calorie and macro
targets are stored exactly as typed — nothing is calculated from the foods, and
the UI says so rather than implying accuracy the app does not have. A new plan
supersedes the previous one, which is kept as history.

**Check-ins.** Recorded by the coach, since there is no client portal.
Everything except the date is optional, and a missing weight stays missing — it
is skipped when computing changes and plotting, never coerced to zero. The
weight chart is server-rendered inline SVG with no chart library; its y-axis is
deliberately not zero-based, so both bounds are labelled and the caption says
so.

The builders for workouts and diet plans persist every step: each addition or
edit is its own form posting to a server action, so half-built work cannot be
lost by navigating away.

## Public enquiry form

`/lead` is the only route that writes to the database without a session. It is
narrowed accordingly:

- The schema accepts name, phone, email, interest and goal — nothing else.
  `status` and `source` are set server-side, so a crafted submission cannot
  create a lead that is already "converted".
- A hidden honeypot field is accepted by validation but silently discards the
  submission, because browser autofill sometimes fills hidden fields and a real
  user must never see an error they cannot fix.
- Five submissions per IP per hour (in-memory; see the note in
  `src/lib/rate-limit.ts` if the app is ever scaled beyond one instance).
- The same phone number within ten minutes is treated as a double-tap and
  reports success without creating a second lead.

## Leads, people and conversion

A **Lead** is an enquiry. A **Person** is a customer. Converting a lead creates
the person and an append-only **Conversion** record — the lead itself is never
deleted, so its source and full history survive.

Identity is stored once. When a lead's phone or email matches an existing
customer, conversion offers to attach to that person instead of creating a
second record for the same human. One person can hold any combination of gym,
personal-training and online-coaching conversions; a `{lead, type}` unique index
means converting the same lead to the same destination twice is a no-op rather
than a duplicate.

## Memberships

A **MembershipPlan** is what you sell; a **Membership** is one purchased
period. Selecting a plan *suggests* a duration and price — every membership
stores its own `planName`, dates and price, so renaming or repricing a plan can
never rewrite what an existing member bought. Plans deactivate rather than
delete, for the same reason.

Purchase, start and expiry are three independent dates. Expiry is never
calculated from the purchase date: a member can pay in September for access
that begins in October.

**Renewing creates a new row** linked by `renewedFrom` rather than editing the
old one, so past periods keep their dates and the timeline stays intact. Any
period in a chain shows the whole history.

Whether a membership is currently usable is **derived from its dates**, not
stored — so it becomes "expired" the moment the business day rolls over, with
no scheduled job and no stale rows. Only cancellation is stored, and it wins
over the dates. The boundary cases are covered by `npm test`.

Payments are recorded manually — there is no gateway — and are tied to a person
and, optionally, the membership they paid for.

## Dates and timezones

The business operates in one timezone, set in Business settings. "Today",
"due" and "expiring soon" are all evaluated against the *business* day rather
than the server day — otherwise a gym in `Asia/Kolkata` would see follow-ups
roll over at 5:30am. `src/lib/dates.ts` builds day boundaries with `Intl` and is
covered by `npm test`, including DST transitions. Month names come from a fixed
table because ICU renders September as "Sept" in some Node builds.

---

## Known limitations

- **Single instance only.** The public form's rate limiter is in-memory
  (`src/lib/rate-limit.ts`), so limits reset on deploy and are per-instance.
  Scaling beyond one Render instance means moving it to Redis or the database.
- **No background jobs.** Membership expiry is derived from dates at read time
  rather than flipped by a scheduled task. This is a deliberate trade-off — it
  removes a whole class of stale-data bugs — but it means there is nothing to
  send a renewal reminder on its own.
- **Logos are URLs, not uploads.** There is no file storage in this MVP.
- **One staff account.** There is no invite flow; additional accounts are
  created with `npm run seed:admin`.
- **No automated browser tests.** `npm test` covers date/timezone, rate-limit,
  phone-normalisation and membership-status logic. UI flows were verified
  manually.

## Not built

Deliberately out of scope, and not stubbed with fake behaviour: multiple roles
and permissions, a client-facing portal, progress photo uploads, Instagram DM
integration, an AI assistant or AI diet generator, automated lead messaging,
multi-branch support, and payment gateway integration. Payments are recorded
manually.
