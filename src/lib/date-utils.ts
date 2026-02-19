import {
  addDays,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns'

export const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd')

export const parseDateKey = (value: string) => parseISO(value)

export const getWeekStart = (date: Date) =>
  startOfWeek(date, { weekStartsOn: 1 })

export const getWeekEnd = (weekStart: Date) =>
  endOfWeek(weekStart, { weekStartsOn: 1 })

export const getWeekDays = (weekStart: Date) =>
  Array.from({ length: 7 }, (_, dayIndex) => addDays(weekStart, dayIndex))

export const formatWeekRange = (weekStart: Date, weekEnd: Date) =>
  `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`

export const formatDayName = (date: Date) => format(date, 'EEE')

export const isPastDateWithoutLog = ({
  date,
  hasLog,
}: {
  date: Date
  hasLog: boolean
}) => {
  const today = startOfDay(new Date())
  return isBefore(startOfDay(date), today) && !hasLog
}

export const isCurrentOrPastDate = (date: Date) => {
  const today = startOfDay(new Date())
  return isSameDay(startOfDay(date), today) || isBefore(startOfDay(date), today)
}

export const canNavigateToNextWeek = (weekStart: Date) => {
  const currentWeekStart = getWeekStart(new Date())
  return isBefore(weekStart, currentWeekStart)
}

export const isInFuture = (date: Date) => {
  const today = startOfDay(new Date())
  return isAfter(startOfDay(date), today)
}
