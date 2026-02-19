import { CheckCircle2 } from 'lucide-react'

import type { TodayPlan } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type TodayPlanProps = {
  plan: TodayPlan | undefined
  isLoading: boolean
  isWorkoutCompleted: boolean
  isMarkingWorkout: boolean
  isWriteEnabled: boolean
  onMarkWorkoutDone: () => void
}

const formatSetsAndReps = ({
  sets,
  reps,
}: {
  sets: string | null
  reps: string | null
}) => {
  const parts = [sets, reps].filter((value): value is string => Boolean(value))
  return parts.length > 0 ? parts.join(' x ') : null
}

export function TodayPlanSection({
  plan,
  isLoading,
  isWorkoutCompleted,
  isMarkingWorkout,
  isWriteEnabled,
  onMarkWorkoutDone,
}: TodayPlanProps) {
  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle>Today's Plan</CardTitle>
          <p className="text-sm text-muted-foreground">
            Auto-assigned based on today and loaded instantly.
          </p>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-2">
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-base">Workout</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? 'Loading workout...'
                  : plan?.workout?.title ?? 'No workout assigned'}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan?.workout && plan.workout.exercises.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {plan.workout.exercises.map((exercise) => {
                    const setsAndReps = formatSetsAndReps(exercise)

                    return (
                      <li key={`${exercise.name}-${exercise.sets ?? ''}-${exercise.reps ?? ''}`}>
                        <p className="font-medium">{exercise.name}</p>
                        {setsAndReps ? (
                          <p className="text-xs text-muted-foreground">{setsAndReps}</p>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Rest / recovery day.</p>
              )}

              {plan?.workout && plan.workout.exercises.length > 0 ? (
                <Button
                  type="button"
                  variant={isWorkoutCompleted ? 'secondary' : 'default'}
                  onClick={onMarkWorkoutDone}
                  disabled={!isWriteEnabled || isWorkoutCompleted || isMarkingWorkout}
                >
                  <CheckCircle2 className="size-4" />
                  {!isWriteEnabled
                    ? 'Write Access Required'
                    : isWorkoutCompleted
                    ? 'Workout Completed'
                    : isMarkingWorkout
                      ? 'Updating...'
                      : 'Mark Workout Done'}
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader>
              <CardTitle className="text-base">Diet</CardTitle>
              {plan?.diet ? (
                <p className="text-sm text-muted-foreground">
                  Calories: {plan.diet.targetCalories} · Protein: {plan.diet.targetProtein}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Loading diet...' : 'No diet assigned'}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {plan?.diet ? (
                <ul className="space-y-2 text-sm">
                  {plan.diet.meals.map((meal) => (
                    <li key={meal.name}>
                      <p className="font-medium">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">{meal.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Protein: {meal.protein} · Calories: {meal.calories}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  )
}
