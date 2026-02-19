import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addWeeks, format } from 'date-fns'
import {
  CalendarDays,
  Flame,
  LogIn,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react'

import type { DailyLog, TodayPlan } from '@/lib/types'
import type { DailyLogPayload } from '@/lib/validation/daily-log'
import { DailyCheckIn } from '@/components/daily-check-in'
import { ProgressCharts } from '@/components/progress-charts'
import { TodayPlanSection } from '@/components/today-plan'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WeeklySummaryCards } from '@/components/weekly-summary'
import { WeekNavigation } from '@/components/week-navigation'
import {
  calculateComplianceScore,
  calculateWeeklySummary,
  calculateWorkoutStreak,
} from '@/lib/fitness-metrics'
import {
  canNavigateToNextWeek,
  getWeekDays,
  getWeekEnd,
  getWeekStart,
  toDateKey,
} from '@/lib/date-utils'
import { logsQueryKeys } from '@/lib/query-keys'
import { cn } from '@/lib/utils'
import { getAuthStatus, logout } from '@/server/auth'
import { createOrUpdateLog, getAllLogs, getLogsByWeek } from '@/server/logs'
import { getTodayPlan, markWorkoutDoneForToday } from '@/server/plans'

export const Route = createFileRoute('/')({
  component: Home,
})

type SaveDailyLogInput = {
  date: string
  data: DailyLogPayload
}

const navItems = [
  { href: '#week', label: 'Week' },
  { href: '#plan', label: 'Plan' },
  { href: '#check-in', label: 'Check-in' },
  { href: '#progress', label: 'Progress' },
]

function Home() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [savingDate, setSavingDate] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  const authStatusQuery = useQuery({
    queryKey: logsQueryKeys.authStatus(),
    queryFn: async () => getAuthStatus(),
  })
  const isAuthenticated = authStatusQuery.data?.isAuthenticated ?? false

  const weeklyLogsQuery = useQuery({
    queryKey: logsQueryKeys.week(weekStartKey, weekEndKey),
    enabled: isAuthenticated,
    queryFn: async () => {
      return (await getLogsByWeek({
        data: { startDate: weekStartKey, endDate: weekEndKey },
      })) as Array<DailyLog>
    },
  })

  const allLogsQuery = useQuery({
    queryKey: logsQueryKeys.allLogs(),
    enabled: isAuthenticated,
    queryFn: async () => (await getAllLogs()) as Array<DailyLog>,
  })

  const todayPlanQuery = useQuery({
    queryKey: logsQueryKeys.todayPlan(),
    enabled: isAuthenticated,
    queryFn: async () => (await getTodayPlan()) as TodayPlan,
  })

  const saveLogMutation = useMutation({
    mutationFn: async ({ date, data }: SaveDailyLogInput) => {
      setSavingDate(date)

      if (!authStatusQuery.data?.canWrite) {
        throw new Error('Log in to write changes.')
      }

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
    mutationFn: async () => {
      if (!authStatusQuery.data?.canWrite) {
        throw new Error('Log in to update workouts.')
      }

      return markWorkoutDoneForToday()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: logsQueryKeys.all })
      await queryClient.invalidateQueries({ queryKey: logsQueryKeys.todayPlan() })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => logout(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: logsQueryKeys.authStatus() })
    },
  })

  const weeklyLogs = weeklyLogsQuery.data ?? []
  const allLogs = allLogsQuery.data ?? []
  const todayPlan = todayPlanQuery.data
  const authStatus = authStatusQuery.data
  const isWriteEnabled = authStatus?.canWrite ?? false
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

  const closeMobileMenu = () => setIsMobileMenuOpen(false)
  const todayLabel = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
    <div className="min-h-screen bg-[radial-gradient(130%_80%_at_50%_-10%,rgba(120,120,120,0.22),rgba(9,9,11,0))] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <a
            href="#overview"
            className="group motion-press inline-flex items-center gap-2 text-base font-semibold tracking-[0.05em] text-zinc-50"
            onClick={closeMobileMenu}
          >
            <span className="inline-flex size-8 items-center justify-center rounded-full border border-white/30 bg-white/5 text-xs transition-transform duration-300 ease-out group-hover:rotate-6">
              GP
            </span>
            Gym Progress
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {isAuthenticated
              ? navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="nav-pill motion-press rounded-full px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </a>
                ))
              : null}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                <Badge
                  variant="outline"
                  className="h-8 border-white/20 bg-white/5 px-3 text-zinc-200"
                >
                  <UserRound className="size-3.5" />
                  {authStatus?.username ?? 'user'}
                </Badge>
                <Badge
                  variant="outline"
                  className="h-8 border-white/20 bg-white/5 px-3 text-zinc-200"
                >
                  <Flame className="size-3.5" />
                  Longest streak: {workoutStreak.longest}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void logoutMutation.mutateAsync()}
                  disabled={logoutMutation.isPending}
                  className="h-9 border-white/20 bg-white/5 px-4 text-zinc-100 hover:border-white/40 hover:bg-white/10"
                >
                  <LogOut className="size-4" />
                  {logoutMutation.isPending ? 'Signing out...' : 'Log out'}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => void navigate({ to: '/auth' })}
                className="h-9 bg-zinc-100 px-4 text-zinc-950 hover:bg-zinc-200"
              >
                <LogIn className="size-4" />
                Log In / Sign Up
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-full border border-white/15 bg-white/5 text-zinc-100 hover:bg-white/15 md:hidden"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? (
              <X className="size-5 transition-transform duration-300 ease-out" />
            ) : (
              <Menu className="size-5 transition-transform duration-300 ease-out" />
            )}
          </Button>
        </div>

        <div
          className={cn(
            'overflow-hidden border-t border-white/10 transition-[max-height,opacity,transform] duration-300 md:hidden',
            isMobileMenuOpen
              ? 'max-h-96 translate-y-0 opacity-100'
              : 'max-h-0 -translate-y-1 opacity-0',
          )}
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
            {isAuthenticated ? (
              <nav className="grid gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="motion-surface motion-press rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200"
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Badge
                    variant="outline"
                    className="h-8 border-white/20 bg-white/5 px-3 text-zinc-200"
                  >
                    <UserRound className="size-3.5" />
                    {authStatus?.username ?? 'user'}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      closeMobileMenu()
                      void logoutMutation.mutateAsync()
                    }}
                    disabled={logoutMutation.isPending}
                    className="h-9 border-white/20 bg-white/5 px-4 text-zinc-100"
                  >
                    <LogOut className="size-4" />
                    {logoutMutation.isPending ? 'Signing out...' : 'Log out'}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    closeMobileMenu()
                    void navigate({ to: '/auth' })
                  }}
                  className="h-9 bg-zinc-100 px-4 text-zinc-950 hover:bg-zinc-200"
                >
                  <LogIn className="size-4" />
                  Log In / Sign Up
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main
        id="overview"
        className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-10 pt-6 sm:px-6 md:gap-6 md:pt-8"
      >
        <section className="motion-surface reveal-up relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-20 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Today
          </h1>
          <p className="mt-1 text-sm text-zinc-300">{todayLabel}</p>
          <p className="mt-4 max-w-2xl text-sm text-zinc-400">
            Track your plan, log your check-ins, and keep consistency streaks moving.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="motion-surface rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                <CalendarDays className="size-3.5" />
                This Week
              </p>
              <p className="mt-2 text-base font-medium text-zinc-100">
                {format(weekStart, 'MMM d')}
                {' '}
                -
                {' '}
                {format(weekEnd, 'MMM d')}
              </p>
            </div>
            <div className="motion-surface rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current Streak</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">
                {isAuthenticated ? `${workoutStreak.current} day(s)` : '--'}
              </p>
            </div>
            <div className="motion-surface rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Consistency</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">
                {isAuthenticated ? `${complianceScore}%` : '--'}
              </p>
            </div>
          </div>
        </section>

        {!isAuthenticated ? (
          <section className="motion-surface reveal-up rounded-3xl border border-white/15 bg-white/[0.03] p-6 [animation-delay:90ms] sm:p-7">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Sign in required
            </h2>
            <p className="mt-2 max-w-lg text-sm text-zinc-400">
              Log in to access your personal fitness dashboard, update daily logs, and
              track weekly trends.
            </p>
            <Button
              type="button"
              className="mt-5 h-10 bg-zinc-100 px-5 text-zinc-950 hover:bg-zinc-200"
              onClick={() => void navigate({ to: '/auth' })}
            >
              Go to login
            </Button>
          </section>
        ) : null}

        {!isAuthenticated ? null : (
          <>
            <section className="reveal-up scroll-mt-28 [animation-delay:80ms]" id="week">
              <WeekNavigation
                weekStart={weekStart}
                weekEnd={weekEnd}
                canGoNext={canNavigateToNextWeek(weekStart)}
                onPreviousWeek={() => setWeekStart((current) => addWeeks(current, -1))}
                onNextWeek={() => setWeekStart((current) => addWeeks(current, 1))}
              />
            </section>

            {authStatusQuery.isError ? (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {authStatusQuery.error instanceof Error
                  ? authStatusQuery.error.message
                  : 'Failed to load auth status.'}
              </p>
            ) : null}

            {weeklyLogsQuery.isError ? (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {weeklyLogsQuery.error instanceof Error
                  ? weeklyLogsQuery.error.message
                  : 'Failed to load weekly logs.'}
              </p>
            ) : null}

            {saveLogMutation.isError ? (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {saveLogMutation.error instanceof Error
                  ? saveLogMutation.error.message
                  : 'Failed to save log.'}
              </p>
            ) : null}

            {todayPlanQuery.isError ? (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {todayPlanQuery.error instanceof Error
                  ? todayPlanQuery.error.message
                  : "Failed to load today's plan."}
              </p>
            ) : null}

            {markWorkoutDoneMutation.isError ? (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {markWorkoutDoneMutation.error instanceof Error
                  ? markWorkoutDoneMutation.error.message
                  : 'Failed to mark workout done.'}
              </p>
            ) : null}

            <section className="reveal-up scroll-mt-28 [animation-delay:120ms]" id="plan">
              <TodayPlanSection
                plan={todayPlan}
                isLoading={todayPlanQuery.isLoading}
                isWorkoutCompleted={isTodayWorkoutDone}
                isMarkingWorkout={markWorkoutDoneMutation.isPending}
                isWriteEnabled={isWriteEnabled}
                onMarkWorkoutDone={() => void markWorkoutDoneMutation.mutateAsync()}
              />
            </section>

            <section className="reveal-up scroll-mt-28 [animation-delay:170ms]" id="check-in">
              <DailyCheckIn
                weekStart={weekStart}
                selectedDate={selectedDate}
                logs={weeklyLogs}
                isSaving={savingDate === selectedDate}
                isWriteEnabled={isWriteEnabled}
                onSelectDate={setSelectedDate}
                onAutoSave={handleSaveLog}
              />
            </section>

            <section className="reveal-up scroll-mt-28 [animation-delay:210ms]" id="progress">
              <WeeklySummaryCards
                summary={weeklySummary}
                complianceScore={complianceScore}
                currentStreak={workoutStreak.current}
              />
            </section>

            {allLogsQuery.isError ? (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {allLogsQuery.error instanceof Error
                  ? allLogsQuery.error.message
                  : 'Failed to load progress charts.'}
              </p>
            ) : null}

            <div className="reveal-up [animation-delay:250ms]">
              <ProgressCharts logs={allLogs} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
