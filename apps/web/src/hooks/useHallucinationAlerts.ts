import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  deleteHallucinationAlert,
  fetchHallucinationAlerts,
  updateHallucinationAlert,
} from "@/services/hallucination-alerts"
import type { UpdateHallucinationAlertInput } from "@/services/hallucination-alerts"

export type {
  HallucinationAlert,
  HallucinationAlertSeverity,
  HallucinationAlertStatus,
  UpdateHallucinationAlertInput,
} from "@/services/hallucination-alerts"

const HALLUCINATION_ALERTS_KEY = ["hallucination_alerts"] as const

export function useHallucinationAlerts(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient()

  const { data: alerts = [], isLoading, error, isError, refetch } = useQuery({
    queryKey: HALLUCINATION_ALERTS_KEY,
    queryFn: fetchHallucinationAlerts,
    staleTime: 1000 * 60 * 2,
    enabled: options?.enabled ?? true,
  })

  const updateHallucinationAlertMutation = useMutation({
    mutationFn: (input: UpdateHallucinationAlertInput) => updateHallucinationAlert(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HALLUCINATION_ALERTS_KEY })
      toast.success("Alerta atualizado com sucesso!")
    },
    onError: () => {
      toast.error("Não foi possível atualizar o alerta. Tente novamente.")
    },
  })

  const deleteHallucinationAlertMutation = useMutation({
    mutationFn: (id: string) => deleteHallucinationAlert({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HALLUCINATION_ALERTS_KEY })
      toast.success("Alerta deletado com sucesso!")
    },
    onError: () => {
      toast.error("Não foi possível remover o alerta. Tente novamente.")
    },
  })

  return {
    alerts,
    isLoading,
    error,
    isError,
    refetch,
    updateHallucinationAlert: updateHallucinationAlertMutation,
    deleteHallucinationAlert: deleteHallucinationAlertMutation,
  }
}
