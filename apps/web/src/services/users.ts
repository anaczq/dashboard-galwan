import { supabase } from "@/integrations/supabase/client"
import { AppError, ForbiddenError, isForbiddenSupabaseError } from "@/lib/errors"
import type { AreaSlug, UserRole } from "@/lib/permissions"
import { isAreaSlug } from "@/lib/permissions"

export interface UserProfile {
  id: string
  email: string | null
  role: UserRole
  isActive: boolean
  permittedAreas: AreaSlug[]
  createdAt: string
  updatedAt: string
}

interface UserRow {
  id: string
  email: string | null
  role: UserRole
  is_active: boolean
  permitted_areas: string[]
  created_at: string
  updated_at: string
}

const COLUMNS = "id, email, role, is_active, permitted_areas, created_at, updated_at"

const mapRow = (row: UserRow): UserProfile => ({
  id: row.id,
  email: row.email,
  role: row.role,
  isActive: row.is_active,
  permittedAreas: (row.permitted_areas ?? []).filter(isAreaSlug),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const fetchCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw new AppError("Falha ao recuperar sessão", { cause: authError })
  if (!authData.user) return null

  const { data, error } = await supabase
    .from("users")
    .select(COLUMNS)
    .eq("id", authData.user.id)
    .maybeSingle()

  if (error) {
    if (isForbiddenSupabaseError(error)) throw new ForbiddenError(undefined, { cause: error })
    throw new AppError("Falha ao buscar perfil do usuário", { cause: error })
  }

  return data ? mapRow(data as UserRow) : null
}

export const listUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from("users")
    .select(COLUMNS)
    .order("created_at", { ascending: false })

  if (error) {
    if (isForbiddenSupabaseError(error)) throw new ForbiddenError(undefined, { cause: error })
    throw new AppError("Falha ao listar usuários", { cause: error })
  }

  return (data ?? []).map((row) => mapRow(row as UserRow))
}

interface UpdateUserPermissionsServiceInput {
  userId: string
  permittedAreas: AreaSlug[]
}

export const updateUserPermissions = async ({
  userId,
  permittedAreas,
}: UpdateUserPermissionsServiceInput): Promise<void> => {
  const { error } = await supabase
    .from("users")
    .update({ permitted_areas: permittedAreas })
    .eq("id", userId)

  if (error) {
    if (isForbiddenSupabaseError(error)) throw new ForbiddenError(undefined, { cause: error })
    throw new AppError("Falha ao atualizar permissões", { cause: error })
  }
}

interface ToggleUserActiveServiceInput {
  userId: string
  isActive: boolean
}

export const toggleUserActive = async ({
  userId,
  isActive,
}: ToggleUserActiveServiceInput): Promise<void> => {
  const { error } = await supabase
    .from("users")
    .update({ is_active: isActive })
    .eq("id", userId)

  if (error) {
    if (isForbiddenSupabaseError(error)) throw new ForbiddenError(undefined, { cause: error })
    throw new AppError("Falha ao alterar status do usuário", { cause: error })
  }
}

interface UpdateUserRoleServiceInput {
  userId: string
  role: UserRole
}

export const updateUserRole = async ({
  userId,
  role,
}: UpdateUserRoleServiceInput): Promise<void> => {
  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId)

  if (error) {
    if (isForbiddenSupabaseError(error)) throw new ForbiddenError(undefined, { cause: error })
    throw new AppError("Falha ao alterar perfil do usuário", { cause: error })
  }
}

export interface InviteUserServiceInput {
  email: string
  role: UserRole
  permittedAreas: AreaSlug[]
}

interface InviteUserFunctionResponse {
  userId?: string
  error?: string
  code?: string
}

export const inviteUser = async ({
  email,
  role,
  permittedAreas,
}: InviteUserServiceInput): Promise<void> => {
  const effectiveAreas = role === "admin" ? [] : permittedAreas

  const { data, error } = await supabase.functions.invoke<InviteUserFunctionResponse>(
    "invite-user",
    {
      body: { email, role, permittedAreas: effectiveAreas },
    },
  )

  if (error) {
    const message = error.message?.toLowerCase() ?? ""
    if (message.includes("forbidden") || message.includes("not admin")) {
      throw new ForbiddenError("Apenas administradores podem convidar usuários", { cause: error })
    }
    throw new AppError("Falha ao enviar convite", { cause: error })
  }

  if (data?.error) {
    if (data.code === "USER_EXISTS") {
      throw new AppError("Já existe um usuário com esse e-mail", { code: "USER_EXISTS" })
    }
    if (data.code === "FORBIDDEN") {
      throw new ForbiddenError("Apenas administradores podem convidar usuários")
    }
    throw new AppError(data.error)
  }
}
