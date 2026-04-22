import { z } from "zod"

import { AREA_SLUGS } from "@/lib/permissions"

export const areaSlugSchema = z.enum(AREA_SLUGS as [string, ...string[]])

export const userRoleSchema = z.enum(["admin", "colaborador"])

export const updateUserPermissionsSchema = z.object({
  userId: z.uuid(),
  permittedAreas: z.array(areaSlugSchema),
})

export const toggleUserActiveSchema = z.object({
  userId: z.uuid(),
  isActive: z.boolean(),
})

export const updateUserRoleSchema = z.object({
  userId: z.uuid(),
  role: userRoleSchema,
})

export const createUserSchema = z
  .object({
    email: z.email("E-mail inválido"),
    role: userRoleSchema,
    permittedAreas: z.array(areaSlugSchema),
  })
  .refine(
    (value) => value.role === "admin" || value.permittedAreas.length > 0,
    { message: "Selecione ao menos uma área para o colaborador", path: ["permittedAreas"] },
  )

export type UpdateUserPermissionsInput = z.infer<typeof updateUserPermissionsSchema>
export type ToggleUserActiveInput = z.infer<typeof toggleUserActiveSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
