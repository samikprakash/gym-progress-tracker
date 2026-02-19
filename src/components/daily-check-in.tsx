import { format, isToday } from 'date-fns'
import { useCallback, useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import type { DailyLog } from '@/lib/types'
import type { DailyLogPayload } from '@/lib/validation/daily-log'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  getWeekDays,
  isPastDateWithoutLog,
  parseDateKey,
  toDateKey,
} from '@/lib/date-utils'
import { cn } from '@/lib/utils'

const numericTextField = ({
  label,
  max,
  integer = false,
}: {
  label: string
  max: number
  integer?: boolean
}) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || Number.isFinite(Number(value)), {
      message: `${label} must be a number`,
    })
    .refine((value) => value === '' || Number(value) >= 0, {
      message: `${label} must be 0 or higher`,
    })
    .refine((value) => value === '' || Number(value) <= max, {
      message: `${label} must be <= ${max}`,
    })
    .refine((value) => value === '' || !integer || Number.isInteger(Number(value)), {
      message: `${label} must be an integer`,
    })

const dailyCheckInSchema = z.object({
  weight: numericTextField({ label: 'Weight', max: 500 }),
  calories: numericTextField({ label: 'Calories', max: 10000, integer: true }),
  protein: numericTextField({ label: 'Protein', max: 1000, integer: true }),
  steps: numericTextField({ label: 'Steps', max: 100000, integer: true }),
  workoutCompleted: z.boolean(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters'),
})

type DailyCheckInValues = z.infer<typeof dailyCheckInSchema>

type SaveDailyLogInput = {
  date: string
  data: DailyLogPayload
}

type DailyCheckInProps = {
  weekStart: Date
  selectedDate: string
  logs: Array<DailyLog>
  isSaving: boolean
  isWriteEnabled: boolean
  onSelectDate: (dateKey: string) => void
  onAutoSave: (input: SaveDailyLogInput) => Promise<void>
}

const toFormDefaults = (log?: DailyLog): DailyCheckInValues => ({
  weight: log?.weight?.toString() ?? '',
  calories: log?.calories?.toString() ?? '',
  protein: log?.protein?.toString() ?? '',
  steps: log?.steps?.toString() ?? '',
  workoutCompleted: log?.workoutCompleted ?? false,
  notes: log?.notes ?? '',
})

const toNullableNumber = ({
  value,
  integer = false,
}: {
  value: string
  integer?: boolean
}) => {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return integer ? Math.round(parsed) : parsed
}

export function DailyCheckIn({
  weekStart,
  selectedDate,
  logs,
  isSaving,
  isWriteEnabled,
  onSelectDate,
  onAutoSave,
}: DailyCheckInProps) {
  const logsByDate = useMemo(() => new Map(logs.map((log) => [log.date, log])), [logs])
  const selectedLog = logsByDate.get(selectedDate)
  const selectedDay = parseDateKey(selectedDate)

  const defaults = useMemo(() => toFormDefaults(selectedLog), [selectedLog])

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<DailyCheckInValues>({
    resolver: zodResolver(dailyCheckInSchema),
    defaultValues: defaults,
    mode: 'onChange',
  })

  const watchedValues = useWatch({ control })
  const workoutCompleted = watchedValues.workoutCompleted

  useEffect(() => {
    reset(defaults)
  }, [defaults, reset])

  const onSubmit = useCallback(
    async (values: DailyCheckInValues) => {
      await onAutoSave({
        date: selectedDate,
        data: {
          weight: toNullableNumber({ value: values.weight }),
          calories: toNullableNumber({ value: values.calories, integer: true }),
          protein: toNullableNumber({ value: values.protein, integer: true }),
          steps: toNullableNumber({ value: values.steps, integer: true }),
          workoutCompleted: values.workoutCompleted,
          notes: values.notes.trim() ? values.notes.trim() : null,
        },
      })

      reset(values)
    },
    [onAutoSave, reset, selectedDate],
  )

  useEffect(() => {
    if (!isDirty || !isValid) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void handleSubmit(onSubmit)()
    }, 650)

    return () => window.clearTimeout(timeoutId)
  }, [watchedValues, isDirty, isValid, handleSubmit, onSubmit])

  const firstError = Object.values(errors).find((error) => Boolean(error.message))
  const firstErrorMessage =
    firstError && typeof firstError.message === 'string' ? firstError.message : null
  const isInputDisabled = isSaving || isSubmitting || !isWriteEnabled

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Check-In</CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(selectedDay, 'EEEE, MMM d')}
          {isToday(selectedDay) ? ' (Today)' : ''}
          {' '}
          · Saves automatically
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {getWeekDays(weekStart).map((day) => {
            const dateKey = toDateKey(day)
            const dayLog = logsByDate.get(dateKey)
            const isSelected = selectedDate === dateKey
            const isMissed = isPastDateWithoutLog({ date: day, hasLog: Boolean(dayLog) })
            const isWorkoutDone = dayLog?.workoutCompleted ?? false

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => onSelectDate(dateKey)}
                className={cn(
                  'flex min-w-16 flex-col items-center rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  isSelected && 'border-primary bg-primary text-primary-foreground',
                  !isSelected && isWorkoutDone &&
                    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
                  !isSelected && !isWorkoutDone && isMissed &&
                    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300',
                  !isSelected && !isWorkoutDone && !isMissed && 'bg-background text-foreground',
                )}
              >
                <span>{format(day, 'EEE')}</span>
                <span className="text-sm">{format(day, 'd')}</span>
              </button>
            )
          })}
        </div>

        <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="weight" className="text-xs font-medium text-muted-foreground">
                Weight (kg)
              </label>
              <Input
                id="weight"
                {...register('weight')}
                inputMode="decimal"
                placeholder="kg"
                disabled={isInputDisabled}
                className={cn(errors.weight && 'border-destructive')}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="steps" className="text-xs font-medium text-muted-foreground">
                Steps
              </label>
              <Input
                id="steps"
                {...register('steps')}
                inputMode="numeric"
                placeholder="steps"
                disabled={isInputDisabled}
                className={cn(errors.steps && 'border-destructive')}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="calories" className="text-xs font-medium text-muted-foreground">
                Calories
              </label>
              <Input
                id="calories"
                {...register('calories')}
                inputMode="numeric"
                placeholder="kcal"
                disabled={isInputDisabled}
                className={cn(errors.calories && 'border-destructive')}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="protein" className="text-xs font-medium text-muted-foreground">
                Protein
              </label>
              <Input
                id="protein"
                {...register('protein')}
                inputMode="numeric"
                placeholder="g"
                disabled={isInputDisabled}
                className={cn(errors.protein && 'border-destructive')}
              />
            </div>
          </div>

          <label
            htmlFor="workoutCompleted"
            className={cn(
              'flex items-center justify-between rounded-lg border px-3 py-2 transition-colors',
              isWriteEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-80',
              workoutCompleted
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'border-border bg-background',
            )}
          >
            <span className="text-sm font-medium">Workout completed</span>
            <input
              id="workoutCompleted"
              type="checkbox"
              {...register('workoutCompleted')}
              disabled={isInputDisabled}
              className="size-4 accent-emerald-600"
              aria-label={`Workout completed for ${format(selectedDay, 'PPP')}`}
            />
          </label>

          <div className="space-y-1">
            <label htmlFor="notes" className="text-xs font-medium text-muted-foreground">
              Notes
            </label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="How did training feel today?"
              disabled={isInputDisabled}
              className={cn('min-h-20 resize-y', errors.notes && 'border-destructive')}
            />
          </div>
        </form>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {!isWriteEnabled
              ? 'Read-only mode. Enter write credentials to save changes.'
              : isSaving || isSubmitting
              ? 'Saving changes...'
              : isDirty
                ? 'Changes pending...'
                : 'All changes saved.'}
          </p>

          {typeof firstErrorMessage === 'string' ? (
            <p className="text-xs text-destructive">{firstErrorMessage}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
