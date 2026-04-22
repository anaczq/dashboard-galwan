import { useQuery } from "@tanstack/react-query"

import { fetchCurrentUserProfile } from "@/services/users"
import type { UserProfile } from "@/services/users"
import { useAuth } from "@/hooks/useAuth"

export const CURRENT_USER_KEY = ["currentUser"] as const

export const useCurrentUser = () => {
  const { session, isLoading: isAuthLoading } = useAuth()

  return useQuery<UserProfile | null>({
    queryKey: CURRENT_USER_KEY,
    queryFn: fetchCurrentUserProfile,
    enabled: !isAuthLoading && Boolean(session),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
