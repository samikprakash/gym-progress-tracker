import { format, getISODay } from 'date-fns'
import { and, asc, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'

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
import { seedDefaultPlanTemplates, seedDefaultPlansForToday } from '@/server/plan-seed'
import { requireAuthenticatedUserForCurrentRequest } from '@/server/auth-core'
import { writeAccessMiddleware } from '@/server/security'

export const getTodayPlan = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const sessionUser = await requireAuthenticatedUserForCurrentRequest()
    const todayDate = format(new Date(), 'yyyy-MM-dd')
    const dayOfWeek = getISODay(new Date())

    const todayLogRows = await db
      .select({
        workoutPlanId: dailyLogs.workoutPlanId,
        dietPlanId: dailyLogs.dietPlanId,
      })
      .from(dailyLogs)
      .where(
        and(eq(dailyLogs.userId, sessionUser.id), eq(dailyLogs.date, todayDate)),
      )
      .limit(1)
    const todayLog = todayLogRows.at(0) ?? null

    let workoutPlanId: number | null =
      todayLog && todayLog.workoutPlanId !== null ? todayLog.workoutPlanId : null

    if (workoutPlanId === null) {
      const defaultWorkoutPlanRows = await db
        .select({
          id: workoutPlans.id,
        })
        .from(workoutPlans)
        .where(eq(workoutPlans.name, DEFAULT_WORKOUT_PLAN.name))
        .limit(1)
      const defaultWorkoutPlan = defaultWorkoutPlanRows.at(0) ?? null
      workoutPlanId = defaultWorkoutPlan ? defaultWorkoutPlan.id : null
    }

    let dietPlanId: number | null =
      todayLog && todayLog.dietPlanId !== null ? todayLog.dietPlanId : null

    if (dietPlanId === null) {
      const defaultDietPlanRows = await db
        .select({
          id: dietPlans.id,
        })
        .from(dietPlans)
        .where(eq(dietPlans.name, DEFAULT_DIET_PLAN.name))
        .limit(1)
      const defaultDietPlan = defaultDietPlanRows.at(0) ?? null
      dietPlanId = defaultDietPlan ? defaultDietPlan.id : null
    }

    if (workoutPlanId === null || dietPlanId === null) {
      const seededTemplates = await seedDefaultPlanTemplates()
      if (workoutPlanId === null) {
        workoutPlanId = seededTemplates.workoutPlanId
      }
      if (dietPlanId === null) {
        dietPlanId = seededTemplates.dietPlanId
      }
    }

    let workout: {
      title: string
      exercises: Array<{
        name: string
        sets: string | null
        reps: string | null
      }>
    } | null = null

    if (workoutPlanId !== null) {
      const todayWorkoutDayRows = await db
        .select({
          id: workoutDays.id,
          title: workoutDays.title,
        })
        .from(workoutDays)
        .where(
          and(
            eq(workoutDays.workoutPlanId, workoutPlanId),
            eq(workoutDays.dayOfWeek, dayOfWeek),
          ),
        )
        .limit(1)
      const todayWorkoutDay = todayWorkoutDayRows.at(0) ?? null

      if (todayWorkoutDay !== null) {
        const exercises = await db
          .select({
            name: workoutExercises.name,
            sets: workoutExercises.sets,
            reps: workoutExercises.reps,
          })
          .from(workoutExercises)
          .where(eq(workoutExercises.workoutDayId, todayWorkoutDay.id))
          .orderBy(asc(workoutExercises.exerciseOrder))

        workout = {
          title: todayWorkoutDay.title,
          exercises,
        }
      }
    }

    let diet: {
      meals: Array<{
        name: string
        description: string
        protein: string
        calories: string
      }>
      targetCalories: string
      targetProtein: string
    } | null = null

    if (dietPlanId !== null) {
      const todayDietPlanRows = await db
        .select({
          id: dietPlans.id,
          targetCalories: dietPlans.targetCalories,
          targetProtein: dietPlans.targetProtein,
        })
        .from(dietPlans)
        .where(eq(dietPlans.id, dietPlanId))
        .limit(1)
      const todayDietPlan = todayDietPlanRows.at(0) ?? null

      if (todayDietPlan !== null) {
        const meals = await db
          .select({
            name: dietMeals.name,
            description: dietMeals.description,
            protein: dietMeals.protein,
            calories: dietMeals.calories,
          })
          .from(dietMeals)
          .where(eq(dietMeals.dietPlanId, todayDietPlan.id))
          .orderBy(asc(dietMeals.mealOrder))

        diet = {
          targetCalories: todayDietPlan.targetCalories,
          targetProtein: todayDietPlan.targetProtein,
          meals,
        }
      }
    }

    return {
      workout,
      diet,
    }
  } catch (error) {
    console.error('getTodayPlan failed:', error)
    throw new Error('Failed to load today\'s plan')
  }
})

export const markWorkoutDoneForToday = createServerFn({ method: 'POST' })
  .middleware([writeAccessMiddleware])
  .handler(async () => {
    try {
      const sessionUser = await requireAuthenticatedUserForCurrentRequest()
      const { todayDate } = await seedDefaultPlansForToday({
        userId: sessionUser.id,
      })
      const updatedAt = new Date().toISOString()

      await db
        .update(dailyLogs)
        .set({
          workoutCompleted: true,
          updatedAt,
        })
        .where(
          and(eq(dailyLogs.userId, sessionUser.id), eq(dailyLogs.date, todayDate)),
        )

      const updatedLogRows = await db
        .select()
        .from(dailyLogs)
        .where(
          and(eq(dailyLogs.userId, sessionUser.id), eq(dailyLogs.date, todayDate)),
        )
        .limit(1)
      const updatedLog = updatedLogRows.at(0) ?? null

      return updatedLog
    } catch (error) {
      console.error('markWorkoutDoneForToday failed:', error)
      throw new Error('Failed to mark workout as done')
    }
  })
