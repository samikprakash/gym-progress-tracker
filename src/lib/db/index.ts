import fs from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

const DEFAULT_DATABASE_PATH =
  process.env.NODE_ENV === 'production'
    ? '/data/gym-tracker.db'
    : path.resolve(process.cwd(), 'data/gym-tracker.db')
const configuredDatabasePath = process.env.DATABASE_URL ?? DEFAULT_DATABASE_PATH

const databasePath = configuredDatabasePath.startsWith('file:')
  ? configuredDatabasePath.replace(/^file:/, '')
  : configuredDatabasePath

if (process.env.NODE_ENV === 'production') {
  if (!process.env.DATABASE_URL) {
    console.warn(
      '[db] DATABASE_URL is not set; defaulting to /data/gym-tracker.db. Mount a persistent volume to /data in production.',
    )
  } else if (!databasePath.startsWith('/data/')) {
    console.warn(
      `[db] DATABASE_URL points to "${databasePath}". For Coolify persistence, mount a persistent volume to /data and set DATABASE_URL=/data/gym-tracker.db.`,
    )
  }
}

const databaseDirectory = path.dirname(databasePath)
if (databaseDirectory && !fs.existsSync(databaseDirectory)) {
  fs.mkdirSync(databaseDirectory, { recursive: true })
}

const sqlite = new Database(databasePath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite)
