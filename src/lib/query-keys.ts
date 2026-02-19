export const logsQueryKeys = {
  all: ['logs'] as const,
  week: (startDate: string, endDate: string) =>
    [...logsQueryKeys.all, 'week', startDate, endDate] as const,
  allLogs: () => [...logsQueryKeys.all, 'all'] as const,
  todayPlan: () => [...logsQueryKeys.all, 'today-plan'] as const,
  authStatus: () => [...logsQueryKeys.all, 'auth-status'] as const,
}
