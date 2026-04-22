import { supabase } from "@/integrations/supabase/client"
import { AppError } from "@/lib/errors"
import { formatLogDateTime, logEvent } from "@/services/logs"

function shortOrientacaoDescription(desc: string | null | undefined, max = 80): string {
  const t = (desc ?? "—").trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export interface Orientacao {
  id: string
  category: string | null
  problem_description: string | null
  reason: string | null
  solution: string | null
  is_resolved: boolean | null
  created_at: string | null
}

export interface UpdateOrientacaoInput {
  id: string
  is_resolved: boolean
}

export async function fetchOrientacoes(): Promise<Orientacao[]> {
  const { data, error } = await supabase
    .from("improvement_suggestions")
    .select("id, category, problem_description, reason, solution, is_resolved, created_at")
    .order("created_at", { ascending: false })

  if (error) throw new AppError("Falha ao buscar orientações", { cause: error })
  return data ?? []
}

export async function updateOrientacao(input: UpdateOrientacaoInput): Promise<void> {
  const { data: before } = await supabase
    .from("improvement_suggestions")
    .select("problem_description, is_resolved")
    .eq("id", input.id)
    .maybeSingle()
  const descResumida = shortOrientacaoDescription(before?.problem_description)

  const { error } = await supabase
    .from("improvement_suggestions")
    .update({ is_resolved: input.is_resolved })
    .eq("id", input.id)
  if (error) throw new AppError("Falha ao atualizar orientação", { cause: error })

  if (before && before.is_resolved === input.is_resolved) return

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  void logEvent({
    action: "UPDATE",
    feature: "metricas",
    description: `O usuário ${email} atualizou o campo "resolvido" do alerta "${descResumida}" em ${when}.`,
  })
}

export async function deleteOrientacao(input: { id: string }): Promise<void> {
  const { data: row } = await supabase
    .from("improvement_suggestions")
    .select("problem_description")
    .eq("id", input.id)
    .maybeSingle()
  const descResumida = shortOrientacaoDescription(row?.problem_description)

  const { error } = await supabase.from("improvement_suggestions").delete().eq("id", input.id)
  if (error) throw new AppError("Falha ao remover orientação", { cause: error })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  void logEvent({
    action: "DELETE",
    feature: "metricas",
    description: `O usuário ${email} excluiu o alerta "${descResumida}" em ${when}.`,
  })
}
