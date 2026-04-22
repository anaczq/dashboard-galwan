import { z } from "zod"

export const createCorretorSchema = z.object({
  first_name: z.string().min(1, "Nome é obrigatório"),
  last_name: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.email("E-mail inválido"),
  whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
  calendar_color: z.string().min(1, "Cor é obrigatória"),
})

export type CreateCorretorSchemaInput = z.infer<typeof createCorretorSchema>

export const updateCorretorSchema = z.object({
  id: z.uuid(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.email().optional(),
  whatsapp: z.string().min(1).optional(),
  calendar_color: z.string().min(1).optional(),
})

export type UpdateCorretorSchemaInput = z.infer<typeof updateCorretorSchema>
