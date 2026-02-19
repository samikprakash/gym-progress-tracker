import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatWeekRange } from '@/lib/date-utils'

type WeekNavigationProps = {
  weekStart: Date
  weekEnd: Date
  canGoNext: boolean
  onPreviousWeek: () => void
  onNextWeek: () => void
}

export function WeekNavigation({
  weekStart,
  weekEnd,
  canGoNext,
  onPreviousWeek,
  onNextWeek,
}: WeekNavigationProps) {
  return (
    <div className="motion-surface rounded-3xl border border-white/15 bg-white/[0.03] p-4 shadow-[0_22px_50px_rgba(0,0,0,0.28)] sm:p-5">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Weekly Consistency
      </p>

      <div className="mt-3 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 rounded-full border-white/20 bg-white/5 text-zinc-100 hover:border-white/35 hover:bg-white/15"
          onClick={onPreviousWeek}
          aria-label="Go to previous week"
        >
          <ChevronLeft className="size-5" />
        </Button>

        <div className="motion-surface flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Active Week
          </p>
          <h2 className="mt-1 text-base font-semibold text-zinc-100 sm:text-lg">
            {formatWeekRange(weekStart, weekEnd)}
          </h2>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 rounded-full border-white/20 bg-white/5 text-zinc-100 hover:border-white/35 hover:bg-white/15"
          onClick={onNextWeek}
          disabled={!canGoNext}
          aria-label="Go to next week"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
    </div>
  )
}
