import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { fetchProjects, createProject, updateProject, deleteProject } from "@/services/projects"
import type { CreateProjectInput } from "@/services/projects"

export type { Project, CreateProjectInput, UpdateProjectInput } from "@/services/projects"

const PROJECTS_KEY = ["projetos"] as const

export function useProjects() {
  const queryClient = useQueryClient()

  const { data: projects = [], isLoading, error, isError, refetch } = useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: fetchProjects,
    staleTime: 1000 * 60 * 5,
  })

  const createProjectMutation = useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
    onError: () => {
      toast.error("Não foi possível criar o projeto. Tente novamente.")
    },
  })

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Omit<CreateProjectInput, never>>) =>
      updateProject({ id, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
    onError: () => {
      toast.error("Não foi possível atualizar o projeto. Tente novamente.")
    },
  })

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => deleteProject({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
      toast.success("Projeto removido com sucesso!")
    },
    onError: () => {
      toast.error("Não foi possível remover o projeto. Tente novamente.")
    },
  })

  return { projects, isLoading, error, isError, refetch, createProject: createProjectMutation, updateProject: updateProjectMutation, deleteProject: deleteProjectMutation }
}
