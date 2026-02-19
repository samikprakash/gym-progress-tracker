import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeeklySummary } from '@/lib/types'

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
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Weight Change</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {summary.startWeight !== null && summary.endWeight !== null
              ? `${(summary.endWeight - summary.startWeight).toFixed(1)} kg`
              : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.startWeight !== null ? `${summary.startWeight.toFixed(1)} kg` : 'N/A'}
            {' '}
            {'->'}
            {' '}
            {summary.endWeight !== null ? `${summary.endWeight.toFixed(1)} kg` : 'N/A'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nutrition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-medium">
            Avg calories: {formatValue(summary.averageCalories, '', 'N/A')}
          </p>
          <p className="font-medium">
            Avg protein: {formatValue(summary.averageProtein, ' g', 'N/A')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-medium">Workouts: {summary.totalWorkouts}</p>
          <p className="font-medium">
            Avg steps: {formatValue(summary.averageSteps, '', 'N/A')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consistency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-medium">Compliance: {complianceScore}%</p>
          <p className="font-medium">Workout streak: {currentStreak} day(s)</p>
        </CardContent>
      </Card>
    </section>
  )
}
