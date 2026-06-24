# Shivkripa Job Work Tracker

A job-work / material-movement tracker for Shivkripa Auto Industries — built with
**Next.js + SQLite (Turso)**, deployable on **Vercel's free Hobby plan** with **zero
paid services**.

- Frontend + backend: Next.js (App Router), one project, one deploy
- Database: SQLite, via [Turso](https://turso.tech) — free tier, works on serverless
- Auth: cookie-based sessions (JWT), passwords hashed with bcrypt — no third-party auth service
- Charts: Recharts · Exports: CSV / Excel (xlsx) / PDF (jsPDF) — all free npm packages

Nothing here requires a credit card. Total cost to run this for a small/medium
manufacturing company's job-work volume: **₹0/month**.

---

## 1. Run it locally (no account needed)

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. That's it — with no `.env.local` file, the app
automatically creates a SQLite file called `local.db` right in the project folder
and seeds it with:

- **Vendors:** Aryan Heat Treatment, Tarsem, Tejinder, DMK, GS
- **Parts:** Pin 24mm, Pin 40mm, Pin 36mm, Shifter Rod, Locking Pin, Link Pin, Swinging Link Pin
- **Logins:** `admin` / `admin123` (Admin) and `operator` / `operator123` (Operator)

Both vendor and part dropdowns also have a **"+ Add new…"** option right in the
form — typing a new vendor or part there saves it permanently, no code changes needed.

**Change the default passwords** the first time you log in (Settings → Change Your Password).

---

## 2. Deploy to Vercel for free

### Step A — Create a free Turso database (this is your production "Postgres-but-free-and-SQLite")

1. Go to https://turso.tech → Sign up free (no card required) → Create a database
   (any name, e.g. `shivkripa-tracker`).
2. From the database page, copy:
   - the **Database URL** (looks like `libsql://shivkripa-tracker-yourname.turso.io`)
   - an **Auth Token** (click "Create Token")

   You can also do this with their CLI if you prefer:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth login
   turso db create shivkripa-tracker
   turso db show shivkripa-tracker --url
   turso db tokens create shivkripa-tracker
   ```

Turso's free tier (check current limits at https://turso.tech/pricing — they've changed
over time, but a no-card-required free tier has consistently existed) covers far more
reads/writes and storage than a small job-work ledger like this will ever produce.

### Step B — Push this project to GitHub

```bash
git init
git add .
git commit -m "Shivkripa Job Work Tracker"
gh repo create shivkripa-tracker --private --source=. --push
# (or create a repo on github.com and `git remote add origin ...` + `git push`)
```

### Step C — Import into Vercel

1. Go to https://vercel.com → **Add New → Project** → import your GitHub repo.
2. Vercel auto-detects Next.js — leave build settings as default.
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | the URL from Step A |
   | `TURSO_AUTH_TOKEN` | the token from Step A |
   | `AUTH_SECRET` | any long random string — generate one with `openssl rand -base64 32` |

4. Click **Deploy**.

That's it — on first request, the app creates all tables and seeds vendors/parts/logins
automatically inside your Turso database, exactly like it does locally.

Vercel's **free Hobby plan** comfortably covers this app's traffic. You will not be
asked to pay anything as long as you stay on Hobby (personal/small-team use).

### Step D — First login on production

Go to your `*.vercel.app` URL, log in with `admin` / `admin123`, and immediately go to
**Settings** to change the password and add your team's real accounts.

---

## 3. Project structure

```
app/
  login/page.js              Login screen
  (app)/                     Everything behind login
    layout.js                 Reads session, wraps pages in the shared data context
    dashboard/page.js         KPIs, current position, pending-at-vendor
    transactions/page.js      Entry form + full transaction table (edit/delete = Admin)
    inventory/page.js         Live stock-by-location, derived from transactions
    vendors/page.js           Vendor performance cards + Recharts
    reports/page.js           Filters + CSV/Excel/PDF export
    settings/page.js          Change password, manage users, manage vendors/parts/projects
  api/                        All backend routes (transactions, vendors, parts, projects, auth)
lib/
  db.js                       Turso/SQLite client, schema, seed data
  auth.js                     JWT session signing/verification, password hashing
  calculations.js             The ledger math (see below) — framework-free, unit-testable
  serverSession.js            Reads the logged-in user inside API routes
components/                   UI building blocks (form, modals, charts, etc.)
proxy.js                      Route protection — redirects to /login if not authenticated
```

## 4. How the "where is my material right now" calculation works

This was the trickiest part of the spec: material can leave Shivkripa, get
**partially** forwarded to a second vendor, **partially** forwarded again to a third,
and partially return — and the app needs to say exactly how much is sitting at each
stop, automatically, from nothing but the transaction log.

`lib/calculations.js` does this with a simple ledger rule, applied per challan number:

- The **first** transaction for a challan doesn't debit its `from` location — that
  location's stock already existed before the challan was created, so it isn't
  something this challan's own ledger is tracking.
- **Every transaction after that** debits the `from` location and credits the `to`
  location normally.

So your example —

```
DISPATCH  Shivkripa → XYZ   800
TRANSFER  XYZ → ABC         300   (ready portion only)
TRANSFER  ABC → PQR         250   (ready portion only)
RETURN    PQR → Shivkripa   250
```

— resolves automatically to **XYZ: 500, ABC: 50, PQR: 0 (drops off "pending"),
Shivkripa: 250**, with zero special-casing per vendor and no limit on how many hops
or vendors are involved. This is unit-tested in isolation (the function takes plain
JS objects in, plain numbers out) so you can verify it independently of the database
or UI at any time.

## 5. Notes on the free-tier choices

- **SQLite via Turso**, not Postgres — same SQL you already know, but it's
  filesystem-based, which is what made it genuinely free-forever rather than
  "free until you hit a row/connection limit," which is how most hosted Postgres
  free tiers work.
- **No Supabase Auth** — a from-scratch cookie+JWT login was used instead, so there's
  one less paid service in the chain and one less account to manage.
- **No server-rendered PDF service** — exports run in the visitor's browser using
  free npm packages, so there's no export server to pay for or scale.
