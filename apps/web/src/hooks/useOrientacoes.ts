import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { fetchOrientacoes, updateOrientacao, deleteOrientacao } from "@/services/orientacoes"
import type { UpdateOrientacaoInput } from "@/services/orientacoes"

export type { Orientacao, UpdateOrientacaoInput } from "@/services/orientacoes"

const ORIENTACOES_KEY = ["orientacoes"] as const

export function useOrientacoes(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient()

  const { data: orientacoes = [], isLoading, error, isError, refetch } = useQuery({
    queryKey: ORIENTACOES_KEY,
    queryFn: fetchOrientacoes,
    staleTime: 1000 * 60 * 2,
    enabled: options?.enabled ?? true,
  })

  const updateOrientacaoMutation = useMutation({
    mutationFn: (input: UpdateOrientacaoInput) => updateOrientacao(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORIENTACOES_KEY })
      toast.success("Orientação atualizada com sucesso!")
    },
    onError: () => {
      toast.error("Não foi possível atualizar a orientação. Tente novamente.")
    },
  })

  const deleteOrientacaoMutation = useMutation({
    mutationFn: (id: string) => deleteOrientacao({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORIENTACOES_KEY })
      toast.success("Orientação deletada com sucesso!")
    },
    onError: () => {
      toast.error("Não foi possível remover a orientação. Tente novamente.")
    },
  })

  return { orientacoes, isLoading, error, isError, refetch, updateOrientacao: updateOrientacaoMutation, deleteOrientacao: deleteOrientacaoMutation }
}
