import { z } from "zod"

export const updateAgentPromptSchema = z.object({
  id: z.uuid(),
  identity: z.string().nullable().optional(),
  qualification_methodology: z.string().nullable().optional(),
  emojis: z.string().nullable().optional(),
})

export type UpdateAgentPromptSchemaInput = z.infer<typeof updateAgentPromptSchema>
