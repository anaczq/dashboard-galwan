import { useQuery } from "@tanstack/react-query"

import { fetchLogs } from "@/services/logs"
import type { LogAction, LogFeature } from "@/services/logs"

export type { LogAction, LogFeature } from "@/services/logs"

export const LOGS_KEY = (filters: { feature?: LogFeature; action?: LogAction }) =>
  ["logs", filters] as const

export const useLogs = (filters: { feature?: LogFeature; action?: LogAction } = {}) =>
  useQuery({
    queryKey: LOGS_KEY(filters),
    queryFn: () => fetchLogs(filters),
    staleTime: 1000 * 30,
  })
