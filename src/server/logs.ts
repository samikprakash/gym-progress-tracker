import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, gte, lte } from 'drizzle-orm'

import { db } from '@/lib/db'
import { dailyLogs } from '@/lib/db/schema'
import {
  createOrUpdateLogInputSchema,
  dailyLogPayloadSchema,
  weekRangeInputSchema,
} from '@/lib/validation/daily-log'
import { requireAuthenticatedUserForCurrentRequest } from '@/server/auth-core'
import { writeAccessMiddleware } from '@/server/security'

const saveLog = async ({
  userId,
  date,
  data,
}: {
  userId: number
  date: string
  data: ReturnType<typeof dailyLogPayloadSchema.parse>
}) => {
  const now = new Date().toISOString()

  await db
    .insert(dailyLogs)
    .values({
      userId,
      date,
      weight: data.weight,
      calories: data.calories,
      protein: data.protein,
      steps: data.steps,
      workoutCompleted: data.workoutCompleted,
      notes: data.notes,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [dailyLogs.userId, dailyLogs.date],
      set: {
        weight: data.weight,
        calories: data.calories,
        protein: data.protein,
        steps: data.steps,
        workoutCompleted: data.workoutCompleted,
        notes: data.notes,
        updatedAt: now,
      },
    })

  const savedRows = await db
    .select()
    .from(dailyLogs)
    .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, date)))
    .limit(1)
  const saved = savedRows.at(0) ?? null

  if (saved === null) {
    throw new Error('Unable to read saved log entry')
  }

  return saved
}

export const createOrUpdateLog = createServerFn({ method: 'POST' })
  .middleware([writeAccessMiddleware])
  .inputValidator((input: unknown) => createOrUpdateLogInputSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const sessionUser = await requireAuthenticatedUserForCurrentRequest()

      return await saveLog({
        userId: sessionUser.id,
        date: data.date,
        data: dailyLogPayloadSchema.parse(data.data),
      })
    } catch (error) {
      console.error('createOrUpdateLog failed:', error)
      throw new Error('Failed to save daily log')
    }
  })

export const getLogsByWeek = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => weekRangeInputSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const sessionUser = await requireAuthenticatedUserForCurrentRequest()

      return await db
        .select()
        .from(dailyLogs)
        .where(
          and(
            eq(dailyLogs.userId, sessionUser.id),
            gte(dailyLogs.date, data.startDate),
            lte(dailyLogs.date, data.endDate),
          ),
        )
        .orderBy(asc(dailyLogs.date))
    } catch (error) {
      console.error('getLogsByWeek failed:', error)
      throw new Error('Failed to fetch weekly logs')
    }
  })

export const getAllLogs = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const sessionUser = await requireAuthenticatedUserForCurrentRequest()

    return await db
      .select()
      .from(dailyLogs)
      .where(eq(dailyLogs.userId, sessionUser.id))
      .orderBy(asc(dailyLogs.date))
  } catch (error) {
    console.error('getAllLogs failed:', error)
    throw new Error('Failed to fetch logs')
  }
})
