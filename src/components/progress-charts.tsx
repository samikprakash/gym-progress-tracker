import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDayName, parseDateKey } from '@/lib/date-utils'
import type { DailyLog } from '@/lib/types'

type ProgressChartsProps = {
  logs: DailyLog[]
}

export function ProgressCharts({ logs }: ProgressChartsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = useMemo(
    () =>
      logs
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((log) => {
          const date = parseDateKey(log.date)
          return {
            dateLabel: `${formatDayName(date)} ${date.getDate()}`,
            weight: log.weight,
            steps: log.steps,
          }
        }),
    [logs],
  )

  const hasWeightData = chartData.some((point) => point.weight !== null)
  const hasStepsData = chartData.some((point) => point.steps !== null)

  return (
    <section className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Weight Trend (kg)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {!mounted || !hasWeightData ? (
            <p className="text-sm text-muted-foreground">
              Add weight logs to see your trend.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dateLabel" minTickGap={24} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#0f766e"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Steps Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {!mounted || !hasStepsData ? (
            <p className="text-sm text-muted-foreground">
              Add step logs to see your trend.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dateLabel" minTickGap={24} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="steps"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
