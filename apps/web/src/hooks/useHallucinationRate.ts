import { useQuery } from "@tanstack/react-query"

import { fetchHallucinationRate } from "@/services/hallucination-rate"

const HALLUCINATION_RATE_KEY = (start?: Date, end?: Date) =>
  ["hallucination-rate", start?.toISOString() ?? null, end?.toISOString() ?? null] as const

export function useHallucinationRate(
  startDate?: Date,
  endDate?: Date,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: HALLUCINATION_RATE_KEY(startDate, endDate),
    queryFn: () => fetchHallucinationRate({ startDate, endDate }),
    staleTime: 1000 * 60 * 2,
    enabled: options?.enabled ?? true,
  })
}
