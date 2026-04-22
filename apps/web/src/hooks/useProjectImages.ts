import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { fetchProjectImages, addProjectImage, deleteProjectImage } from "@/services/project-images"

export type { ProjectImage, AddProjectImageInput } from "@/services/project-images"

const imagesKey = (projectId: string) => ["project-images", projectId] as const

export function useProjectImages(projectId: string) {
  const queryClient = useQueryClient()
  const key = imagesKey(projectId)

  const { data: images = [] } = useQuery({
    queryKey: key,
    queryFn: () => fetchProjectImages({ projectId }),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 3,
  })

  const addImage = useMutation({
    mutationFn: (input: { projectId: string; imageUrl: string; orderIndex: number }) =>
      addProjectImage(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
    onError: () => {
      toast.error("Erro ao salvar referência da imagem.")
    },
  })

  const deleteImage = useMutation({
    mutationFn: (imageId: string) => deleteProjectImage({ id: imageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
    onError: () => {
      toast.error("Erro ao remover registro da imagem.")
    },
  })

  return { images, addImage, deleteImage }
}
