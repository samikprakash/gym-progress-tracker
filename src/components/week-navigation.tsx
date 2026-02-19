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
    <div className="sticky top-0 z-10 rounded-xl border bg-card/95 p-3 shadow-sm backdrop-blur md:static md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
      <div className="mb-2 text-center md:hidden">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Active Week
        </p>
        <h2 className="text-base font-semibold">{formatWeekRange(weekStart, weekEnd)}</h2>
      </div>

      <div className="flex items-center justify-between gap-2 md:justify-end">
        <p className="hidden text-sm font-medium text-muted-foreground md:block md:mr-auto">
          {formatWeekRange(weekStart, weekEnd)}
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPreviousWeek}
          aria-label="Go to previous week"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNextWeek}
          disabled={!canGoNext}
          aria-label="Go to next week"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
