import path from 'node:path'

import { defineConfig } from 'drizzle-kit'

const DEFAULT_DATABASE_URL =
  process.env.NODE_ENV === 'production'
    ? '/data/gym-tracker.db'
    : path.resolve(process.cwd(), 'data/gym-tracker.db')

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  },
})
