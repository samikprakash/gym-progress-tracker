import { format, subDays } from 'date-fns'

import { db } from '../src/lib/db'
import { dailyLogs } from '../src/lib/db/schema'

const daysToSeed = 42

const createSeedData = () => {
  const today = new Date()

  return Array.from({ length: daysToSeed }, (_, index) => {
    const date = subDays(today, daysToSeed - index - 1)
    const weightTrend = 81 - index * 0.03
    const workoutCompleted = index % 2 === 0 || index % 5 === 0
    const steps = 6000 + (index % 7) * 1200 + Math.round(Math.random() * 1600)

    return {
      date: format(date, 'yyyy-MM-dd'),
      weight: Number((weightTrend + (Math.random() * 1.6 - 0.8)).toFixed(1)),
      calories: 1950 + (index % 6) * 110 + Math.round(Math.random() * 120),
      protein: 120 + (index % 4) * 12 + Math.round(Math.random() * 10),
      steps,
      workoutCompleted,
      notes:
        index % 6 === 0
          ? 'Good energy and strong session.'
          : index % 5 === 0
            ? 'Recovery focused day.'
            : null,
      updatedAt: new Date().toISOString(),
    }
  })
}

const seed = async () => {
  const entries = createSeedData()

  for (const entry of entries) {
    await db
      .insert(dailyLogs)
      .values(entry)
      .onConflictDoUpdate({
        target: dailyLogs.date,
        set: {
          weight: entry.weight,
          calories: entry.calories,
          protein: entry.protein,
          steps: entry.steps,
          workoutCompleted: entry.workoutCompleted,
          notes: entry.notes,
          updatedAt: entry.updatedAt,
        },
      })
  }

  console.info(`Seeded ${entries.length} daily log rows.`)
}

seed().catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
