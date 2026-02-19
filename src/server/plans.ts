import { getISODay } from 'date-fns'
import { and, asc, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'

import { db } from '@/lib/db'
import {
  dailyLogs,
  dietMeals,
  dietPlans,
  workoutDays,
  workoutExercises,
} from '@/lib/db/schema'
import { seedDefaultPlansForToday } from '@/server/plan-seed'

export const getTodayPlan = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { todayDate } = await seedDefaultPlansForToday()
    const dayOfWeek = getISODay(new Date())

    const [todayLog] = await db
      .select({
        workoutPlanId: dailyLogs.workoutPlanId,
        dietPlanId: dailyLogs.dietPlanId,
      })
      .from(dailyLogs)
      .where(eq(dailyLogs.date, todayDate))
      .limit(1)

    if (!todayLog) {
      return {
        workout: null,
        diet: null,
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

    if (todayLog.workoutPlanId !== null) {
      const [todayWorkoutDay] = await db
        .select({
          id: workoutDays.id,
          title: workoutDays.title,
        })
        .from(workoutDays)
        .where(
          and(
            eq(workoutDays.workoutPlanId, todayLog.workoutPlanId),
            eq(workoutDays.dayOfWeek, dayOfWeek),
          ),
        )
        .limit(1)

      if (todayWorkoutDay) {
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

    if (todayLog.dietPlanId !== null) {
      const [todayDietPlan] = await db
        .select({
          id: dietPlans.id,
          targetCalories: dietPlans.targetCalories,
          targetProtein: dietPlans.targetProtein,
        })
        .from(dietPlans)
        .where(eq(dietPlans.id, todayLog.dietPlanId))
        .limit(1)

      if (todayDietPlan) {
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

export const markWorkoutDoneForToday = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const { todayDate } = await seedDefaultPlansForToday()
      const updatedAt = new Date().toISOString()

      await db
        .update(dailyLogs)
        .set({
          workoutCompleted: true,
          updatedAt,
        })
        .where(eq(dailyLogs.date, todayDate))

      const [updatedLog] = await db
        .select()
        .from(dailyLogs)
        .where(eq(dailyLogs.date, todayDate))
        .limit(1)

      return updatedLog ?? null
    } catch (error) {
      console.error('markWorkoutDoneForToday failed:', error)
      throw new Error('Failed to mark workout as done')
    }
  },
)
