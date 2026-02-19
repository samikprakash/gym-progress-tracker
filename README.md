# Weekly Fitness Tracker

Production-style fitness tracking web app built with TanStack Start, TanStack Query, Drizzle ORM, SQLite, TailwindCSS, React Hook Form, and Zod.

## Features

- Mobile-first daily check-in flow with week day picker (Monday-Sunday)
- Automatic save on change for weight, calories, protein, steps, workout status, and notes
- Auto-seeded "Today's Plan" section (workout + diet) with no manual setup
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

2. Generate migrations (already included, optional unless schema changes)

```bash
npm run db:generate
```

3. Run migrations

```bash
mkdir -p data
npm run db:migrate
```

4. Seed example data

```bash
npm run db:seed
```

5. Start the app

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

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
