# Weekly Fitness Tracker

Production-style fitness tracking web app built with TanStack Start, TanStack Query, Drizzle ORM, SQLite, TailwindCSS, React Hook Form, and Zod.

## Features

- Mobile-first daily check-in flow with week day picker (Monday-Sunday)
- Automatic save on change for weight, calories, protein, steps, workout status, and notes
- "Today's Plan" section (workout + diet) loaded from stored plan data
- Authenticated read/write workflow with per-user data isolation
- Basic `/auth` login/signup page
- Weekly summary metrics:
  - start/end weight
  - average calories/protein/steps
  - workout count
- Progress charts for weight and steps
- Week navigation (previous/next)
- SQLite persistence with Drizzle migrations
- Streak + compliance score extras
- Dark mode toggle

## Tech Stack

- Frontend: TanStack Start (React + TanStack Router)
- Data fetching/cache: TanStack Query
- Backend: TanStack Start server functions
- Database: SQLite + Drizzle ORM
- Styling: TailwindCSS
- Forms: React Hook Form + Zod

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Optional: configure write rate limits

```bash
cp .env.example .env
```

Optional auth setting in `.env`:

- `AUTH_ALLOW_SIGNUP=false` to disable new account registration.

3. Generate migrations (already included, optional unless schema changes)

```bash
npm run db:generate
```

4. Run migrations

```bash
mkdir -p data
npm run db:migrate
```

5. Seed example data

```bash
npm run db:seed
```

6. Start the app

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Security Notes

- This repository is safe to open source as long as you do not commit your `.env` file.
- User passwords are never committed and are stored server-side as salted scrypt hashes.
- All log/plan reads and writes require authentication.
- Each user can only access and mutate their own `daily_logs` data.
- `AUTH_ALLOW_SIGNUP=false` can disable future user registration.
- Write endpoints also use simple in-memory IP rate limiting (`WRITE_RATE_LIMIT_MAX_REQUESTS` / `WRITE_RATE_LIMIT_WINDOW_MS`).
- Use HTTPS in production so authentication traffic and cookies are encrypted in transit.

## Database

- SQLite file: `data/gym-tracker.db` (or `DATABASE_URL` if set)
- Drizzle config: `drizzle.config.ts`
- Schema: `src/lib/db/schema.ts`
- Server functions: `src/server/logs.ts`, `src/server/plans.ts`

## Example Seed Data

The seed script inserts and assigns:

- Workout plan: `Fat Loss PPL + Conditioning`
- Diet plan: `2000 Cal High Protein`
- Today's `daily_logs` entry with `workoutPlanId` + `dietPlanId`

Run with:

```bash
npm run db:seed
```
