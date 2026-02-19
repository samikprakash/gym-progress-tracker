import { CheckCircle2, Dumbbell, Flame } from 'lucide-react'

import type { TodayPlan } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
      <Card className="motion-surface rounded-3xl border-white/15 bg-white/[0.03] py-5 text-zinc-100 shadow-[0_22px_50px_rgba(0,0,0,0.28)] sm:py-6">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Your Plan
              </p>
              <CardTitle className="mt-2 text-2xl font-semibold tracking-tight">
                Execution Focus
              </CardTitle>
              <p className="mt-1 text-sm text-zinc-400">
                Auto-assigned based on today and ready for quick logging.
              </p>
            </div>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-200">
              Ready
            </span>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-4 md:grid-cols-2">
          <Card className="motion-surface rounded-2xl border-white/12 bg-black/35 py-4 text-zinc-100">
            <CardHeader className="pb-2">
              <CardTitle className="inline-flex items-center gap-2 text-lg">
                <span className="inline-flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <Dumbbell className="size-4" />
                </span>
                Workout
              </CardTitle>
              <p className="text-sm text-zinc-400">
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
                      <li
                        key={`${exercise.name}-${exercise.sets ?? ''}-${exercise.reps ?? ''}`}
                        className="motion-surface rounded-xl border border-white/12 bg-white/[0.02] px-3 py-2 hover:border-white/30"
                      >
                        <p className="font-medium text-zinc-100">{exercise.name}</p>
                        {setsAndReps ? (
                          <p className="text-xs text-zinc-400">{setsAndReps}</p>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-zinc-400">Rest / recovery day.</p>
              )}

              {plan?.workout && plan.workout.exercises.length > 0 ? (
                <Button
                  type="button"
                  onClick={onMarkWorkoutDone}
                  disabled={!isWriteEnabled || isWorkoutCompleted || isMarkingWorkout}
                  className={cn(
                    'h-11 w-full rounded-2xl font-semibold',
                    isWorkoutCompleted
                      ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/25'
                      : 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200',
                  )}
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

          <Card className="motion-surface rounded-2xl border-white/12 bg-black/35 py-4 text-zinc-100">
            <CardHeader className="pb-2">
              <CardTitle className="inline-flex items-center gap-2 text-lg">
                <span className="inline-flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <Flame className="size-4" />
                </span>
                Nutrition
              </CardTitle>
              {plan?.diet ? (
                <p className="text-sm text-zinc-400">
                  Calories: {plan.diet.targetCalories} · Protein: {plan.diet.targetProtein}
                </p>
              ) : (
                <p className="text-sm text-zinc-400">
                  {isLoading ? 'Loading diet...' : 'No diet assigned'}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {plan?.diet ? (
                <ul className="space-y-2 text-sm">
                  {plan.diet.meals.map((meal) => (
                    <li
                      key={meal.name}
                      className="motion-surface rounded-xl border border-white/12 bg-white/[0.02] px-3 py-2 hover:border-white/30"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-zinc-100">{meal.name}</p>
                        <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-zinc-300">
                          {meal.calories}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">{meal.description}</p>
                      <p className="mt-1 text-xs text-zinc-400">Protein: {meal.protein}</p>
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
