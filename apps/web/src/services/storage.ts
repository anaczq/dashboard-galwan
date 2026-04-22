import { supabase } from "@/integrations/supabase/client"
import { AppError } from "@/lib/errors"

const BUCKET = "imagens-projetos"

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export const validateImageFile = (file: File): void => {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new AppError(
      `Tipo de arquivo não permitido: ${file.type}. Use JPEG, PNG, WebP ou GIF.`,
      { code: "INVALID_FILE_TYPE" },
    )
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new AppError(
      `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: 5 MB.`,
      { code: "FILE_TOO_LARGE" },
    )
  }
}

export const getStoragePathFromUrl = (url: string, bucket: string): string | null => {
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

export const uploadProjectImage = async (
  file: File,
  projectId: string,
  index: number,
): Promise<string> => {
  validateImageFile(file)

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const path = `${projectId}/${Date.now()}_${index}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })
  if (error) throw new AppError("Falha ao fazer upload da imagem", { cause: error })

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return publicUrl
}

export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new AppError("Falha ao deletar arquivo", { cause: error })
}

export const deleteProjectImageRecords = async (projectId: string): Promise<void> => {
  const { error } = await supabase
    .from("project_images")
    .delete()
    .eq("project_id", projectId)
  if (error) throw new AppError("Falha ao remover registros de imagens", { cause: error })
}

export const generateProjectEmbedding = async (projectId: string): Promise<void> => {
  const { error } = await supabase.functions.invoke("generate-embedding", {
    body: { projectId },
  })
  if (error) throw new AppError("Falha ao gerar embedding do projeto", { cause: error })
}

export const deleteProjectFiles = async (projectId: string): Promise<void> => {
  const { data: files, error } = await supabase.storage.from(BUCKET).list(projectId)
  if (error) throw new AppError("Falha ao listar arquivos do projeto", { cause: error })
  if (!files || files.length === 0) return

  const paths = files.map((f) => `${projectId}/${f.name}`)
  const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths)
  if (removeError) throw new AppError("Falha ao remover arquivos do projeto", { cause: removeError })
}
