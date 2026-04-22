import { z } from "zod"

export const createLeadSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  whatsapp: z.string().min(10, "WhatsApp inválido").max(15),
  agreed_terms: z.boolean().default(false),
  is_active: z.boolean().default(true),
  request_notes: z.string().nullable().optional(),
})

export type CreateLeadSchemaInput = z.infer<typeof createLeadSchema>

export const updateLeadSchema = z.object({
  id: z.uuid(),
  agreed_terms: z.boolean().optional(),
  is_active: z.boolean().optional(),
  request_notes: z.string().nullable().optional(),
})

export type UpdateLeadSchemaInput = z.infer<typeof updateLeadSchema>
