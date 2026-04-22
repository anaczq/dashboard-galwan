import { useQuery, useQueryClient } from "@tanstack/react-query"

import { fetchChatHistory } from "@/services/chat-history"

export const CHAT_HISTORY_KEY = (email: string | undefined) =>
  ["chat-history", email ?? null] as const

export const useChatHistory = (email: string | undefined) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: CHAT_HISTORY_KEY(email),
    queryFn: () => fetchChatHistory(email!),
    enabled: Boolean(email),
    staleTime: 1000 * 30,
  })

  const refetchHistory = () =>
    queryClient.invalidateQueries({ queryKey: CHAT_HISTORY_KEY(email) })

  return { ...query, refetchHistory }
}
