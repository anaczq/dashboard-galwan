import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  inviteUser,
  listUsers,
  toggleUserActive,
  updateUserPermissions,
  updateUserRole,
} from "@/services/users"
import type { UserProfile } from "@/services/users"
import type {
  CreateUserInput,
  ToggleUserActiveInput,
  UpdateUserPermissionsInput,
  UpdateUserRoleInput,
} from "@/schemas/user"
import type { AreaSlug } from "@/lib/permissions"
import { CURRENT_USER_KEY } from "@/hooks/useCurrentUser"
import { ForbiddenError } from "@/lib/errors"

export const USERS_KEY = ["users"] as const

export const useUsers = () => {
  const queryClient = useQueryClient()

  const { data: users = [], isLoading, error, isError } = useQuery<UserProfile[]>({
    queryKey: USERS_KEY,
    queryFn: listUsers,
    staleTime: 1000 * 60 * 2,
  })

  const handleError = (err: unknown, fallback: string) => {
    if (err instanceof ForbiddenError) {
      toast.error("Acesso negado")
      return
    }
    const message = err instanceof Error ? err.message : fallback
    toast.error(message)
  }

  const updatePermissionsMutation = useMutation({
    mutationFn: (input: UpdateUserPermissionsInput) =>
      updateUserPermissions({
        userId: input.userId,
        permittedAreas: input.permittedAreas as AreaSlug[],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY })
      toast.success("Permissões atualizadas")
    },
    onError: (err) => handleError(err, "Não foi possível atualizar as permissões"),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (input: ToggleUserActiveInput) =>
      toggleUserActive({ userId: input.userId, isActive: input.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY })
      toast.success("Status atualizado")
    },
    onError: (err) => handleError(err, "Não foi possível alterar o status"),
  })

  const updateRoleMutation = useMutation({
    mutationFn: (input: UpdateUserRoleInput) =>
      updateUserRole({ userId: input.userId, role: input.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY })
      toast.success("Perfil atualizado")
    },
    onError: (err) => handleError(err, "Não foi possível alterar o perfil"),
  })

  const inviteUserMutation = useMutation({
    mutationFn: (input: CreateUserInput) =>
      inviteUser({
        email: input.email,
        role: input.role,
        permittedAreas: input.permittedAreas as AreaSlug[],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      toast.success("Convite enviado por e-mail")
    },
    onError: (err) => handleError(err, "Não foi possível enviar o convite"),
  })

  return {
    users,
    isLoading,
    error,
    isError,
    updatePermissions: updatePermissionsMutation,
    toggleActive: toggleActiveMutation,
    updateRole: updateRoleMutation,
    inviteUser: inviteUserMutation,
  }
}
