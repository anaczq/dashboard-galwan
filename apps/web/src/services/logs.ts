import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { supabase } from "@/integrations/supabase/client"
import { AppError } from "@/lib/errors"

/** Data/hora legível para textos de log (pt-BR, fuso local). */
export function formatLogDateTime(date: Date = new Date()): string {
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export type LogAction = "CREATE" | "UPDATE" | "DELETE"
export type LogFeature = "prompts" | "projetos" | "corretores" | "chat" | "leads" | "metricas"

export interface LogEntry {
  id: string
  user_email: string
  action: LogAction
  feature: LogFeature
  description: string
  created_at: string
}

export interface LogFilters {
  feature?: LogFeature
  action?: LogAction
  limit?: number
}

export async function fetchLogs(filters: LogFilters = {}): Promise<LogEntry[]> {
  let query = supabase
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 200)

  if (filters.feature) query = query.eq("feature", filters.feature)
  if (filters.action) query = query.eq("action", filters.action)

  const { data, error } = await query
  if (error) throw new AppError("Falha ao buscar logs", { cause: error })
  return (data ?? []) as LogEntry[]
}

interface LogEventInput {
  action: LogAction
  feature: LogFeature
  description: string
}

export async function logEvent(input: LogEventInput): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return

  await supabase.from("logs").insert({
    user_email: user.email,
    action: input.action,
    feature: input.feature,
    description: input.description,
  })
}
