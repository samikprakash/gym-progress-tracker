import path from 'node:path'

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? path.resolve(process.cwd(), 'data/gym-tracker.db'),
  },
})
