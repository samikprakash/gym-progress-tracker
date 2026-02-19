import { format } from 'date-fns'
import { and, eq, gt } from 'drizzle-orm'

import { db } from '@/lib/db'
import { DEFAULT_DIET_PLAN, DEFAULT_WORKOUT_PLAN } from '@/lib/default-plan'
import {
  dailyLogs,
  dietMeals,
  dietPlans,
  workoutDays,
  workoutExercises,
  workoutPlans,
} from '@/lib/db/schema'

type SeedResult = {
  todayDate: string
  workoutPlanId: number
  dietPlanId: number
}

const nowIsoString = () => new Date().toISOString()

const getTodayDate = () => format(new Date(), 'yyyy-MM-dd')

const getExistingDefaultPlanState = async (): Promise<SeedResult | null> => {
  const todayDate = getTodayDate()

  const [workoutPlan] = await db
    .select({ id: workoutPlans.id })
    .from(workoutPlans)
    .where(eq(workoutPlans.name, DEFAULT_WORKOUT_PLAN.name))
    .limit(1)

  const [dietPlan] = await db
    .select({ id: dietPlans.id })
    .from(dietPlans)
    .where(eq(dietPlans.name, DEFAULT_DIET_PLAN.name))
    .limit(1)

  if (!workoutPlan || !dietPlan) {
    return null
  }

  const workoutDayRows = await db
    .select({ id: workoutDays.id })
    .from(workoutDays)
    .where(eq(workoutDays.workoutPlanId, workoutPlan.id))

  const dietMealRows = await db
    .select({ id: dietMeals.id })
    .from(dietMeals)
    .where(eq(dietMeals.dietPlanId, dietPlan.id))

  if (
    workoutDayRows.length !== DEFAULT_WORKOUT_PLAN.days.length ||
    dietMealRows.length !== DEFAULT_DIET_PLAN.meals.length
  ) {
    return null
  }

  const [todayLog] = await db
    .select({
      workoutPlanId: dailyLogs.workoutPlanId,
      dietPlanId: dailyLogs.dietPlanId,
    })
    .from(dailyLogs)
    .where(eq(dailyLogs.date, todayDate))
    .limit(1)

  if (
    !todayLog ||
    todayLog.workoutPlanId !== workoutPlan.id ||
    todayLog.dietPlanId !== dietPlan.id
  ) {
    return null
  }

  return {
    todayDate,
    workoutPlanId: workoutPlan.id,
    dietPlanId: dietPlan.id,
  }
}

const ensureWorkoutPlan = async () => {
  const updatedAt = nowIsoString()

  await db
    .insert(workoutPlans)
    .values({
      name: DEFAULT_WORKOUT_PLAN.name,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: workoutPlans.name,
      set: {
        updatedAt,
      },
    })

  const [plan] = await db
    .select({ id: workoutPlans.id })
    .from(workoutPlans)
    .where(eq(workoutPlans.name, DEFAULT_WORKOUT_PLAN.name))
    .limit(1)

  if (!plan) {
    throw new Error('Unable to create workout plan')
  }

  for (const day of DEFAULT_WORKOUT_PLAN.days) {
    await db
      .insert(workoutDays)
      .values({
        workoutPlanId: plan.id,
        dayOfWeek: day.dayOfWeek,
        title: day.title,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: [workoutDays.workoutPlanId, workoutDays.dayOfWeek],
        set: {
          title: day.title,
          updatedAt,
        },
      })

    const [storedDay] = await db
      .select({ id: workoutDays.id })
      .from(workoutDays)
      .where(
        and(
          eq(workoutDays.workoutPlanId, plan.id),
          eq(workoutDays.dayOfWeek, day.dayOfWeek),
        ),
      )
      .limit(1)

    if (!storedDay) {
      throw new Error(`Unable to create workout day ${day.title}`)
    }

    for (let index = 0; index < day.exercises.length; index += 1) {
      const exercise = day.exercises[index]

      await db
        .insert(workoutExercises)
        .values({
          workoutDayId: storedDay.id,
          exerciseOrder: index + 1,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          notes: null,
          updatedAt,
        })
        .onConflictDoUpdate({
          target: [workoutExercises.workoutDayId, workoutExercises.exerciseOrder],
          set: {
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            notes: null,
            updatedAt,
          },
        })
    }

    await db.delete(workoutExercises).where(
      and(
        eq(workoutExercises.workoutDayId, storedDay.id),
        gt(workoutExercises.exerciseOrder, day.exercises.length),
      ),
    )
  }

  return plan.id
}

const ensureDietPlan = async () => {
  const updatedAt = nowIsoString()

  await db
    .insert(dietPlans)
    .values({
      name: DEFAULT_DIET_PLAN.name,
      targetCalories: DEFAULT_DIET_PLAN.targetCalories,
      targetProtein: DEFAULT_DIET_PLAN.targetProtein,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: dietPlans.name,
      set: {
        targetCalories: DEFAULT_DIET_PLAN.targetCalories,
        targetProtein: DEFAULT_DIET_PLAN.targetProtein,
        updatedAt,
      },
    })

  const [plan] = await db
    .select({ id: dietPlans.id })
    .from(dietPlans)
    .where(eq(dietPlans.name, DEFAULT_DIET_PLAN.name))
    .limit(1)

  if (!plan) {
    throw new Error('Unable to create diet plan')
  }

  for (let index = 0; index < DEFAULT_DIET_PLAN.meals.length; index += 1) {
    const meal = DEFAULT_DIET_PLAN.meals[index]

    await db
      .insert(dietMeals)
      .values({
        dietPlanId: plan.id,
        mealOrder: index + 1,
        name: meal.name,
        description: meal.description,
        protein: meal.protein,
        calories: meal.calories,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: [dietMeals.dietPlanId, dietMeals.mealOrder],
        set: {
          name: meal.name,
          description: meal.description,
          protein: meal.protein,
          calories: meal.calories,
          updatedAt,
        },
      })
  }

  await db.delete(dietMeals).where(
    and(
      eq(dietMeals.dietPlanId, plan.id),
      gt(dietMeals.mealOrder, DEFAULT_DIET_PLAN.meals.length),
    ),
  )

  return plan.id
}

export const seedDefaultPlansForToday = async ({
  force = false,
}: {
  force?: boolean
} = {}): Promise<SeedResult> => {
  if (!force) {
    const existingState = await getExistingDefaultPlanState()
    if (existingState) {
      return existingState
    }
  }

  const workoutPlanId = await ensureWorkoutPlan()
  const dietPlanId = await ensureDietPlan()

  const todayDate = getTodayDate()
  const updatedAt = nowIsoString()

  await db
    .insert(dailyLogs)
    .values({
      date: todayDate,
      workoutPlanId,
      dietPlanId,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: dailyLogs.date,
      set: {
        workoutPlanId,
        dietPlanId,
        updatedAt,
      },
    })

  return {
    todayDate,
    workoutPlanId,
    dietPlanId,
  }
}
