export type DailyLog = {
  id: number
  date: string
  weight: number | null
  calories: number | null
  protein: number | null
  steps: number | null
  workoutCompleted: boolean
  notes: string | null
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
