import { addDays, differenceInCalendarDays, format } from 'date-fns'

import { getWeekDays, parseDateKey, toDateKey } from '@/lib/date-utils'
import type { DailyLog, WeeklySummary, WorkoutStreak } from '@/lib/types'

const averageOf = (values: Array<number | null>) => {
  const validValues = values.filter((value): value is number => value !== null)
  if (validValues.length === 0) {
    return null
  }

  const total = validValues.reduce((sum, value) => sum + value, 0)
  return Number((total / validValues.length).toFixed(1))
}

const firstNonNull = (values: Array<number | null>) =>
  values.find((value): value is number => value !== null) ?? null

const lastNonNull = (values: Array<number | null>) => {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index] !== null) {
      return values[index]
    }
  }

  return null
}

export const calculateWeeklySummary = (logs: DailyLog[]): WeeklySummary => {
  const ordered = [...logs].sort((a, b) => a.date.localeCompare(b.date))

  return {
    startWeight: firstNonNull(ordered.map((log) => log.weight)),
    endWeight: lastNonNull(ordered.map((log) => log.weight)),
    averageCalories: averageOf(ordered.map((log) => log.calories)),
    averageProtein: averageOf(ordered.map((log) => log.protein)),
    averageSteps: averageOf(ordered.map((log) => log.steps)),
    totalWorkouts: ordered.filter((log) => log.workoutCompleted).length,
  }
}

export const calculateComplianceScore = (
  logs: DailyLog[],
  weekStart: Date,
  stepsGoal = 8000,
) => {
  const logByDate = new Map(logs.map((log) => [log.date, log]))
  const weekDates = getWeekDays(weekStart)

  let totalPoints = 0
  const maxPoints = weekDates.length * 4

  for (const date of weekDates) {
    const log = logByDate.get(toDateKey(date))

    if (!log) {
      continue
    }

    if (log.calories !== null) {
      totalPoints += 1
    }

    if (log.protein !== null) {
      totalPoints += 1
    }

    if ((log.steps ?? 0) >= stepsGoal) {
      totalPoints += 1
    }

    if (log.workoutCompleted) {
      totalPoints += 1
    }
  }

  if (maxPoints === 0) {
    return 0
  }

  return Math.round((totalPoints / maxPoints) * 100)
}

export const calculateWorkoutStreak = (logs: DailyLog[]): WorkoutStreak => {
  const workoutDates = logs
    .filter((log) => log.workoutCompleted)
    .map((log) => parseDateKey(log.date))
    .sort((a, b) => a.getTime() - b.getTime())

  if (workoutDates.length === 0) {
    return { current: 0, longest: 0 }
  }

  let longest = 1
  let running = 1

  for (let index = 1; index < workoutDates.length; index += 1) {
    const previousDate = workoutDates[index - 1]
    const currentDate = workoutDates[index]
    const delta = differenceInCalendarDays(currentDate, previousDate)

    if (delta === 1) {
      running += 1
      longest = Math.max(longest, running)
    } else if (delta > 1) {
      running = 1
    }
  }

  const workoutDateKeys = new Set(workoutDates.map((date) => format(date, 'yyyy-MM-dd')))

  let current = 0
  let cursor = new Date()
  while (workoutDateKeys.has(format(cursor, 'yyyy-MM-dd'))) {
    current += 1
    cursor = addDays(cursor, -1)
  }

  return { current, longest }
}
