# FitFlow

A mobile-first CRM and coaching platform for a fitness business — leads through
to memberships, personal training and online coaching, in one application.

> **Status: Phase 3 complete.** Authentication, branding, settings, account
> management, a live-metric dashboard, the full Lead CRM and lead conversion
> into customers are working. Memberships, payments and the coaching modules
> are built in subsequent phases. Navigation entries for unbuilt areas are
> visibly marked "Soon" rather than linking to empty pages.

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
    validation/       Zod schemas
    collections.ts    canonical MongoDB collection names
    dashboard.ts      dashboard metric queries
    dates.ts          timezone-safe date handling
    db.ts             cached Mongoose connection
    env.ts            lazy environment validation
    settings.ts       business settings + branding
  models/             Mongoose models
  proxy.ts            first-gate route protection
scripts/
  __checks__/         logic checks run by `npm test`
  dev-db.ts           local MongoDB
  seed-admin.ts       staff account bootstrap
```

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

## Dates and timezones

The business operates in one timezone, set in Business settings. "Today",
"due" and "expiring soon" are all evaluated against the *business* day rather
than the server day — otherwise a gym in `Asia/Kolkata` would see follow-ups
roll over at 5:30am. `src/lib/dates.ts` builds day boundaries with `Intl` and is
covered by `npm test`, including DST transitions. Month names come from a fixed
table because ICU renders September as "Sept" in some Node builds.

---

## Out of scope for this MVP

Not built, and not stubbed with fake behaviour: multiple roles, a client-facing
portal, photo uploads, Instagram DM integration, an AI assistant, automated lead
messaging, multi-branch support, and payment gateway integration. Payments are
recorded manually.
