import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { fetchLeads, createLead, deleteLead, updateLead } from "@/services/leads"
import type { CreateLeadInput, UpdateLeadInput } from "@/services/leads"

export type { Lead, CreateLeadInput, UpdateLeadInput } from "@/services/leads"

const LEADS_KEY = ["leads"] as const

export function useLeads() {
  const queryClient = useQueryClient()

  const { data: leads = [], isLoading, error, isError, refetch } = useQuery({
    queryKey: LEADS_KEY,
    queryFn: fetchLeads,
    staleTime: 1000 * 60 * 2,
  })

  const createLeadMutation = useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_KEY })
      toast.success("Lead criado com sucesso!")
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Não foi possível criar o lead. Tente novamente."
      toast.error(message)
    },
  })

  const deleteLeadMutation = useMutation({
    mutationFn: (id: string) => deleteLead({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_KEY })
    },
    onError: () => {
      toast.error("Não foi possível remover o lead. Tente novamente.")
    },
  })

  const updateLeadMutation = useMutation({
    mutationFn: (input: UpdateLeadInput) => updateLead(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_KEY })
      toast.success("Lead atualizado com sucesso!")
    },
    onError: () => {
      toast.error("Não foi possível atualizar o lead. Tente novamente.")
    },
  })

  return {
    leads,
    isLoading,
    error,
    isError,
    refetch,
    createLead: createLeadMutation,
    deleteLead: deleteLeadMutation,
    updateLead: updateLeadMutation,
  }
}
