import { z } from "zod"

export const upsertDisponibilidadeSchema = z.object({
  broker_id: z.uuid(),
  available_date: z.iso.date(),
  is_available: z.boolean().default(true),
})

export type UpsertDisponibilidadeSchemaInput = z.infer<typeof upsertDisponibilidadeSchema>
