import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const dailyLogs = sqliteTable('daily_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(),
  weight: real('weight'),
  calories: integer('calories'),
  protein: integer('protein'),
  steps: integer('steps'),
  workoutCompleted: integer('workout_completed', { mode: 'boolean' })
    .notNull()
    .default(false),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export type DailyLogRecord = typeof dailyLogs.$inferSelect
export type NewDailyLogRecord = typeof dailyLogs.$inferInsert
