import { z } from "zod"

const projectStatusSchema = z.enum(["Ativo", "Inativo", "Disponível em breve"])

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  launch_date: z.iso.date().nullable(),
  delivery_date: z.iso.date().nullable(),
  neighborhood: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  reference_points: z.string().nullable(),
  description: z.string().nullable(),
  project_website: z.url("URL inválida").nullable(),
  status: projectStatusSchema,
  project_images_urls: z.array(z.url()).nullable(),
})

export type CreateProjectSchemaInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).optional(),
  launch_date: z.iso.date().nullable().optional(),
  delivery_date: z.iso.date().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  reference_points: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  project_website: z.url().nullable().optional(),
  status: projectStatusSchema.optional(),
  created_at: z.iso.datetime().nullable().optional(),
  project_images_urls: z.array(z.url()).nullable().optional(),
})

export type UpdateProjectSchemaInput = z.infer<typeof updateProjectSchema>
