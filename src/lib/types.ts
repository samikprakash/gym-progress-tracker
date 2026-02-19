export type DailyLog = {
  id: number
  date: string
  weight: number | null
  calories: number | null
  protein: number | null
  steps: number | null
  workoutCompleted: boolean
  notes: string | null
  workoutPlanId: number | null
  dietPlanId: number | null
  createdAt: string
  updatedAt: string
}

export type WeeklySummary = {
  startWeight: number | null
  endWeight: number | null
  averageCalories: number | null
  averageProtein: number | null
  averageSteps: number | null
  totalWorkouts: number
}

export type WorkoutStreak = {
  current: number
  longest: number
}

export type TodayPlan = {
  workout: {
    title: string
    exercises: Array<{
      name: string
      sets: string | null
      reps: string | null
    }>
  } | null
  diet: {
    meals: Array<{
      name: string
      description: string
      protein: string
      calories: string
    }>
    targetCalories: string
    targetProtein: string
  } | null
}
