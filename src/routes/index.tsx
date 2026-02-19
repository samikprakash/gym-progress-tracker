import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addWeeks } from 'date-fns'

import { DailyCheckIn } from '@/components/daily-check-in'
import { DarkModeToggle } from '@/components/dark-mode-toggle'
import { ProgressCharts } from '@/components/progress-charts'
import { TodayPlanSection } from '@/components/today-plan'
import { Badge } from '@/components/ui/badge'
import { WeeklySummaryCards } from '@/components/weekly-summary'
import { WeekNavigation } from '@/components/week-navigation'
import {
  calculateComplianceScore,
  calculateWeeklySummary,
  calculateWorkoutStreak,
} from '@/lib/fitness-metrics'
import {
  canNavigateToNextWeek,
  getWeekEnd,
  getWeekDays,
  getWeekStart,
  toDateKey,
} from '@/lib/date-utils'
import { logsQueryKeys } from '@/lib/query-keys'
import type { DailyLog, TodayPlan } from '@/lib/types'
import type { DailyLogPayload } from '@/lib/validation/daily-log'
import { createOrUpdateLog, getAllLogs, getLogsByWeek } from '@/server/logs'
import { getTodayPlan, markWorkoutDoneForToday } from '@/server/plans'

export const Route = createFileRoute('/')({
  component: Home,
})

type SaveDailyLogInput = {
  date: string
  data: DailyLogPayload
}

function Home() {
  const queryClient = useQueryClient()

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [savingDate, setSavingDate] = useState<string | null>(null)

  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart])
  const weekDateKeys = useMemo(
    () => getWeekDays(weekStart).map((day) => toDateKey(day)),
    [weekStart],
  )

  useEffect(() => {
    if (!weekDateKeys.includes(selectedDate)) {
      const firstDay = weekDateKeys[0]
      if (firstDay) {
        setSelectedDate(firstDay)
      }
    }
  }, [selectedDate, weekDateKeys])

  const weekStartKey = toDateKey(weekStart)
  const weekEndKey = toDateKey(weekEnd)

  const weeklyLogsQuery = useQuery({
    queryKey: logsQueryKeys.week(weekStartKey, weekEndKey),
    queryFn: async () => {
      return (await getLogsByWeek({
        data: { startDate: weekStartKey, endDate: weekEndKey },
      })) as DailyLog[]
    },
  })

  const allLogsQuery = useQuery({
    queryKey: logsQueryKeys.allLogs(),
    queryFn: async () => (await getAllLogs()) as DailyLog[],
  })

  const todayPlanQuery = useQuery({
    queryKey: logsQueryKeys.todayPlan(),
    queryFn: async () => (await getTodayPlan()) as TodayPlan,
  })

  const saveLogMutation = useMutation({
    mutationFn: async ({ date, data }: SaveDailyLogInput) => {
      setSavingDate(date)
      return createOrUpdateLog({ data: { date, data } })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: logsQueryKeys.all })
    },
    onSettled: () => {
      setSavingDate(null)
    },
  })

  const markWorkoutDoneMutation = useMutation({
    mutationFn: async () => markWorkoutDoneForToday(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: logsQueryKeys.all })
      await queryClient.invalidateQueries({ queryKey: logsQueryKeys.todayPlan() })
    },
  })

  const weeklyLogs = weeklyLogsQuery.data ?? []
  const allLogs = allLogsQuery.data ?? []
  const todayPlan = todayPlanQuery.data
  const todayDate = toDateKey(new Date())
  const isTodayWorkoutDone = allLogs.some(
    (log) => log.date === todayDate && log.workoutCompleted,
  )

  const weeklySummary = useMemo(
    () => calculateWeeklySummary(weeklyLogs),
    [weeklyLogs],
  )

  const complianceScore = useMemo(
    () => calculateComplianceScore(weeklyLogs, weekStart),
    [weeklyLogs, weekStart],
  )

  const workoutStreak = useMemo(
    () => calculateWorkoutStreak(allLogs),
    [allLogs],
  )

  const handleSaveLog = async (input: SaveDailyLogInput) => {
    await saveLogMutation.mutateAsync(input)
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6 md:py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Fitness Progress
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Weekly Fitness Tracker
          </h1>
          <p className="text-sm text-muted-foreground">
            Daily check-ins with automatic saves, plus weekly dashboards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">Longest streak: {workoutStreak.longest}</Badge>
          <DarkModeToggle />
        </div>
      </header>

      <WeekNavigation
        weekStart={weekStart}
        weekEnd={weekEnd}
        canGoNext={canNavigateToNextWeek(weekStart)}
        onPreviousWeek={() => setWeekStart((current) => addWeeks(current, -1))}
        onNextWeek={() => setWeekStart((current) => addWeeks(current, 1))}
      />

      {weeklyLogsQuery.isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {weeklyLogsQuery.error instanceof Error
            ? weeklyLogsQuery.error.message
            : 'Failed to load weekly logs.'}
        </p>
      ) : null}

      {saveLogMutation.isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {saveLogMutation.error instanceof Error
            ? saveLogMutation.error.message
            : 'Failed to save log.'}
        </p>
      ) : null}

      {todayPlanQuery.isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {todayPlanQuery.error instanceof Error
            ? todayPlanQuery.error.message
            : "Failed to load today's plan."}
        </p>
      ) : null}

      {markWorkoutDoneMutation.isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {markWorkoutDoneMutation.error instanceof Error
            ? markWorkoutDoneMutation.error.message
            : 'Failed to mark workout done.'}
        </p>
      ) : null}

      <TodayPlanSection
        plan={todayPlan}
        isLoading={todayPlanQuery.isLoading}
        isWorkoutCompleted={isTodayWorkoutDone}
        isMarkingWorkout={markWorkoutDoneMutation.isPending}
        onMarkWorkoutDone={() => void markWorkoutDoneMutation.mutateAsync()}
      />

      <DailyCheckIn
        weekStart={weekStart}
        selectedDate={selectedDate}
        logs={weeklyLogs}
        isSaving={savingDate === selectedDate}
        onSelectDate={setSelectedDate}
        onAutoSave={handleSaveLog}
      />

      <WeeklySummaryCards
        summary={weeklySummary}
        complianceScore={complianceScore}
        currentStreak={workoutStreak.current}
      />

      {allLogsQuery.isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {allLogsQuery.error instanceof Error
            ? allLogsQuery.error.message
            : 'Failed to load progress charts.'}
        </p>
      ) : null}

      <ProgressCharts logs={allLogs} />
    </main>
  )
}
