import { Flame, Footprints, ShieldCheck, TrendingDown } from 'lucide-react'

import type { WeeklySummary } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type WeeklySummaryProps = {
  summary: WeeklySummary
  complianceScore: number
  currentStreak: number
}

const formatValue = (
  value: number | null,
  suffix: string,
  fallback = 'N/A',
) => {
  if (value === null) {
    return fallback
  }

  return `${value.toFixed(1)}${suffix}`
}

export function WeeklySummaryCards({
  summary,
  complianceScore,
  currentStreak,
}: WeeklySummaryProps) {
  const weightChange =
    summary.startWeight !== null && summary.endWeight !== null
      ? `${(summary.endWeight - summary.startWeight).toFixed(1)} kg`
      : 'N/A'

  const statusLabel =
    complianceScore >= 80 ? 'On Track' : complianceScore >= 60 ? 'Building' : 'Needs Focus'

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Weekly Summary</h2>
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-200">
          {statusLabel}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="motion-surface rounded-2xl border-white/12 bg-white/[0.03] py-4 text-zinc-100">
          <CardHeader className="pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-zinc-400">
              <TrendingDown className="size-4" />
              Weight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{weightChange}</p>
            <p className="text-xs text-zinc-400">
              {summary.startWeight !== null ? `${summary.startWeight.toFixed(1)} kg` : 'N/A'}
              {' '}
              {'->'}
              {' '}
              {summary.endWeight !== null ? `${summary.endWeight.toFixed(1)} kg` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className="motion-surface rounded-2xl border-white/12 bg-white/[0.03] py-4 text-zinc-100">
          <CardHeader className="pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-zinc-400">
              <Flame className="size-4" />
              Nutrition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">
              Avg calories: {formatValue(summary.averageCalories, '', 'N/A')}
            </p>
            <p className="font-medium">
              Avg protein: {formatValue(summary.averageProtein, ' g', 'N/A')}
            </p>
          </CardContent>
        </Card>

        <Card className="motion-surface rounded-2xl border-white/12 bg-white/[0.03] py-4 text-zinc-100">
          <CardHeader className="pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-zinc-400">
              <Footprints className="size-4" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">Workouts: {summary.totalWorkouts}</p>
            <p className="font-medium">
              Avg steps: {formatValue(summary.averageSteps, '', 'N/A')}
            </p>
          </CardContent>
        </Card>

        <Card className="motion-surface rounded-2xl border-white/12 bg-white/[0.03] py-4 text-zinc-100">
          <CardHeader className="pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-zinc-400">
              <ShieldCheck className="size-4" />
              Consistency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">Compliance: {complianceScore}%</p>
            <p className="font-medium">Workout streak: {currentStreak} day(s)</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
