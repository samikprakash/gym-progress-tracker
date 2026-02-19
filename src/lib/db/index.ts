import fs from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

const DEFAULT_DATABASE_PATH = path.resolve(process.cwd(), 'data/gym-tracker.db')
const configuredDatabasePath = process.env.DATABASE_URL ?? DEFAULT_DATABASE_PATH

const databasePath = configuredDatabasePath.startsWith('file:')
  ? configuredDatabasePath.replace(/^file:/, '')
  : configuredDatabasePath

const databaseDirectory = path.dirname(databasePath)
if (databaseDirectory && !fs.existsSync(databaseDirectory)) {
  fs.mkdirSync(databaseDirectory, { recursive: true })
}

const sqlite = new Database(databasePath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite)
