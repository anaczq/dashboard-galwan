import { supabase } from "@/integrations/supabase/client"
import { AppError } from "@/lib/errors"

export interface HallucinationRate {
  totalMessages: number
  totalIncorrect: number
  rate: number
}

export interface FetchHallucinationRateParams {
  startDate?: Date
  endDate?: Date
}

export async function fetchHallucinationRate(
  params: FetchHallucinationRateParams = {},
): Promise<HallucinationRate> {
  const { data, error } = await supabase.rpc("get_hallucination_rate", {
    p_start: params.startDate ? params.startDate.toISOString() : null,
    p_end: params.endDate ? params.endDate.toISOString() : null,
  })

  if (error) throw new AppError("Falha ao calcular taxa de alucinação", { cause: error })

  const row = Array.isArray(data) ? data[0] : data
  return {
    totalMessages: Number(row?.total_messages ?? 0),
    totalIncorrect: Number(row?.total_incorrect ?? 0),
    rate: Number(row?.rate ?? 0),
  }
}
