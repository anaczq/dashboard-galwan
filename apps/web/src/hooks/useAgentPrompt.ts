import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { fetchAgentPrompt, updateAgentPrompt } from "@/services/agent-prompt"
import { useAuth } from "@/hooks/useAuth"
import { AppError, ForbiddenError } from "@/lib/errors"

export type { AgentPrompt, UpdateAgentPromptInput } from "@/services/agent-prompt"

const PROMPT_KEY = ["agent-prompt"] as const

export function useAgentPrompt() {
  const queryClient = useQueryClient()
  const { session, isLoading: isAuthLoading } = useAuth()

  const {
    data: prompt = null,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: PROMPT_KEY,
    queryFn: fetchAgentPrompt,
    enabled: !isAuthLoading && Boolean(session),
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, err) => {
      if (err instanceof ForbiddenError) return false
      return failureCount < 1
    },
  })

  const updatePrompt = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!prompt) throw new AppError("Prompt não encontrado", { code: "PROMPT_NOT_FOUND" })
      return updateAgentPrompt({ id: prompt.id, updates })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROMPT_KEY })
      toast.success("Prompt atualizado com sucesso!")
    },
    onError: (err) => {
      if (err instanceof ForbiddenError) {
        toast.error("Acesso negado")
        return
      }
      toast.error("Não foi possível atualizar o prompt. Tente novamente.")
    },
  })

  return {
    prompt,
    isLoading: isAuthLoading || isLoading,
    error,
    isError,
    refetch,
    updatePrompt,
  }
}
