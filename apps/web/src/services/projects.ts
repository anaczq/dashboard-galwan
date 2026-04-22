import { supabase } from "@/integrations/supabase/client"
import { getChangedUpdateKeys } from "@/lib/changed-update-keys"
import { AppError } from "@/lib/errors"
import { formatLogDateTime, logEvent } from "@/services/logs"

export interface Project {
  id: string
  name: string | null
  launch_date: string | null
  delivery_date: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  reference_points: string | null
  description: string | null
  project_website: string | null
  status: "Ativo" | "Inativo" | "Disponível em breve" | null
  project_images_urls: string[] | null
  content: string | null
  metadata: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
}

export type CreateProjectInput = Omit<Project, "id" | "created_at" | "updated_at" | "content" | "metadata">

export interface UpdateProjectInput {
  id: string
  updates: Partial<Omit<Project, "id" | "created_at" | "updated_at">>
}

const PROJECT_COLUMNS = "id, name, launch_date, delivery_date, neighborhood, city, state, reference_points, description, project_website, status, project_images_urls, content, metadata, created_at, updated_at"

const PROJECT_FIELD_LABEL: Record<string, string> = {
  name: "nome",
  launch_date: "data de lançamento",
  delivery_date: "data de entrega",
  neighborhood: "bairro",
  city: "cidade",
  state: "estado",
  reference_points: "pontos de referência",
  description: "descrição",
  project_website: "site do projeto",
  status: "status",
  project_images_urls: "imagens do projeto",
  content: "conteúdo",
  metadata: "metadados",
}

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("created_at", { ascending: false })

  if (error) throw new AppError("Falha ao buscar projetos", { cause: error })
  return data ?? []
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert(input)
    .select(PROJECT_COLUMNS)
    .single()

  if (error) throw new AppError("Falha ao criar projeto", { cause: error })
  const project = data as Project
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  const nome = project.name ?? "—"
  void logEvent({
    action: "CREATE",
    feature: "projetos",
    description: `O usuário ${email} criou um novo projeto "${nome}" em ${when}.`,
  })
  return project
}

export async function updateProject(input: UpdateProjectInput): Promise<void> {
  const { data: before } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("id", input.id)
    .maybeSingle()

  const { error } = await supabase
    .from("projects")
    .update(input.updates)
    .eq("id", input.id)
  if (error) throw new AppError("Falha ao atualizar projeto", { cause: error })

  const changed = getChangedUpdateKeys(
    input.updates as Record<string, unknown>,
    (before ?? {}) as Record<string, unknown>,
  )
  if (changed.length === 0) return

  const { data: row } = await supabase.from("projects").select("name").eq("id", input.id).maybeSingle()
  const nome = row?.name ?? "—"
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  for (const key of changed) {
    const label = PROJECT_FIELD_LABEL[key] ?? key
    void logEvent({
      action: "UPDATE",
      feature: "projetos",
      description: `O usuário ${email} alterou o campo "${label}" no projeto "${nome}" em ${when}.`,
    })
  }
}

export async function deleteProject(input: { id: string }): Promise<void> {
  const { data: row } = await supabase.from("projects").select("name").eq("id", input.id).maybeSingle()
  const nome = row?.name ?? "—"

  const { error } = await supabase.from("projects").delete().eq("id", input.id)
  if (error) throw new AppError("Falha ao remover projeto", { cause: error })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  void logEvent({
    action: "DELETE",
    feature: "projetos",
    description: `O usuário ${email} excluiu o projeto "${nome}" em ${when}.`,
  })
}
