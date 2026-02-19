import { z } from 'zod'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const numberOrNull = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : value
  }

  return value
}

const nullableFloat = z.preprocess(numberOrNull, z.number().positive().max(500).nullable())
const nullableInt = (max: number) =>
  z.preprocess(numberOrNull, z.number().int().nonnegative().max(max).nullable())

const nullableNote = z.preprocess((value: unknown) => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}, z.string().max(500).nullable())

export const dateStringSchema = z
  .string()
  .regex(ISO_DATE_REGEX, 'Date must use YYYY-MM-DD format')

export const dailyLogPayloadSchema = z.object({
  weight: nullableFloat,
  calories: nullableInt(10000),
  protein: nullableInt(1000),
  steps: nullableInt(100000),
  workoutCompleted: z.boolean().default(false),
  notes: nullableNote,
})

export const createOrUpdateLogInputSchema = z.object({
  date: dateStringSchema,
  data: dailyLogPayloadSchema,
})

export const weekRangeInputSchema = z
  .object({
    startDate: dateStringSchema,
    endDate: dateStringSchema,
  })
  .refine(({ startDate, endDate }) => startDate <= endDate, {
    message: 'startDate must be less than or equal to endDate',
    path: ['endDate'],
  })

export type DailyLogPayloadInput = z.input<typeof dailyLogPayloadSchema>
export type DailyLogPayload = z.infer<typeof dailyLogPayloadSchema>
export type CreateOrUpdateLogInput = z.infer<typeof createOrUpdateLogInputSchema>
export type WeekRangeInput = z.infer<typeof weekRangeInputSchema>
