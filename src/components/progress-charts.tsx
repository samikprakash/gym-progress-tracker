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

import type { DailyLog } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDayName, parseDateKey } from '@/lib/date-utils'

type ProgressChartsProps = {
  logs: Array<DailyLog>
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
    <section className="space-y-3">
      <div className="px-1">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Progress Trends</h2>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="motion-surface rounded-2xl border-white/12 bg-white/[0.03] py-4 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-lg">Weight Trend (kg)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {!mounted || !hasWeightData ? (
              <p className="text-sm text-zinc-400">Add weight logs to see your trend.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="dateLabel"
                    minTickGap={24}
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  />
                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(9,9,11,0.96)',
                      color: '#fafafa',
                    }}
                    labelStyle={{ color: '#d4d4d8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#f5f5f5"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: '#0a0a0a', stroke: '#f5f5f5', strokeWidth: 2 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="motion-surface rounded-2xl border-white/12 bg-white/[0.03] py-4 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-lg">Steps Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {!mounted || !hasStepsData ? (
              <p className="text-sm text-zinc-400">Add step logs to see your trend.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="dateLabel"
                    minTickGap={24}
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  />
                  <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(9,9,11,0.96)',
                      color: '#fafafa',
                    }}
                    labelStyle={{ color: '#d4d4d8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="steps"
                    stroke="#d4d4d8"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: '#0a0a0a', stroke: '#d4d4d8', strokeWidth: 2 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
