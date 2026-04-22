import { supabase } from "@/integrations/supabase/client"
import { AppError } from "@/lib/errors"

export interface ProjectImage {
  id: string
  project_id: string
  image_url: string
  index_order: number
}

export interface AddProjectImageInput {
  projectId: string
  imageUrl: string
  orderIndex: number
}

export async function fetchProjectImages(input: { projectId: string }): Promise<ProjectImage[]> {
  if (!input.projectId) return []

  const { data, error } = await supabase
    .from("project_images")
    .select("id, project_id, image_url, index_order")
    .eq("project_id", input.projectId)
    .order("index_order", { ascending: true })

  if (error) throw new AppError("Falha ao buscar imagens do projeto", { cause: error })
  return data ?? []
}

export async function addProjectImage(input: AddProjectImageInput): Promise<void> {
  const { error } = await supabase.from("project_images").insert({
    project_id: input.projectId,
    image_url: input.imageUrl,
    index_order: input.orderIndex,
  })
  if (error) throw new AppError("Falha ao salvar referência da imagem", { cause: error })
}

export async function deleteProjectImage(input: { id: string }): Promise<void> {
  const { error } = await supabase.from("project_images").delete().eq("id", input.id)
  if (error) throw new AppError("Falha ao remover registro da imagem", { cause: error })
}
