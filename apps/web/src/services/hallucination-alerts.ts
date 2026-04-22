import { supabase } from "@/integrations/supabase/client"
import type { Database, Tables } from "@/integrations/supabase/types"
import { getChangedUpdateKeys } from "@/lib/changed-update-keys"
import { AppError } from "@/lib/errors"
import { formatLogDateTime, logEvent } from "@/services/logs"

export type HallucinationAlert = Tables<"hallucination_alerts">
export type HallucinationAlertSeverity = Database["public"]["Enums"]["alert_severity"]
export type HallucinationAlertStatus = Database["public"]["Enums"]["alert_status"]

const HALLUCINATION_ALERT_UPDATE_FIELD_LABEL: Record<string, string> = {
  severity: "gravidade",
  status: "status",
  title: "título",
  description: "descrição",
  number_incorrect_messages: "mensagens incorretas",
}

export interface UpdateHallucinationAlertInput {
  id: string
  severity?: HallucinationAlertSeverity | null
  status?: HallucinationAlertStatus | null
  title?: string | null
  description?: string | null
  number_incorrect_messages?: number | null
}

export async function fetchHallucinationAlerts(): Promise<HallucinationAlert[]> {
  const { data, error } = await supabase
    .from("hallucination_alerts")
    .select(
      "id, title, description, status, severity, number_incorrect_messages, created_at, updated_at",
    )
    .order("created_at", { ascending: false })

  if (error) throw new AppError("Falha ao buscar alertas de alucinação", { cause: error })
  return data ?? []
}

function shortHallucinationLabel(alert: Pick<HallucinationAlert, "title" | "description">, max = 80): string {
  const t = (alert.title?.trim() || alert.description?.trim() || "—").trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export async function updateHallucinationAlert(input: UpdateHallucinationAlertInput): Promise<void> {
  const { id, ...fields } = input
  const updates = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined),
  ) as Record<string, unknown>
  if (Object.keys(updates).length === 0) return

  const { data: before } = await supabase
    .from("hallucination_alerts")
    .select("title, description, severity, status, number_incorrect_messages")
    .eq("id", id)
    .maybeSingle()

  const labelResumido = shortHallucinationLabel({
    title: before?.title ?? null,
    description: before?.description ?? null,
  })

  const { error } = await supabase.from("hallucination_alerts").update(updates).eq("id", id)
  if (error) throw new AppError("Falha ao atualizar alerta", { cause: error })

  const changed = getChangedUpdateKeys(updates, (before ?? {}) as Record<string, unknown>)
  if (changed.length === 0) return

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  for (const key of changed) {
    const label = HALLUCINATION_ALERT_UPDATE_FIELD_LABEL[key] ?? key
    void logEvent({
      action: "UPDATE",
      feature: "metricas",
      description: `O usuário ${email} atualizou o campo "${label}" do alerta "${labelResumido}" em ${when}.`,
    })
  }
}

export async function deleteHallucinationAlert(input: { id: string }): Promise<void> {
  const { data: row } = await supabase
    .from("hallucination_alerts")
    .select("title, description")
    .eq("id", input.id)
    .maybeSingle()

  const labelResumido = shortHallucinationLabel({
    title: row?.title ?? null,
    description: row?.description ?? null,
  })

  const { error } = await supabase.from("hallucination_alerts").delete().eq("id", input.id)
  if (error) throw new AppError("Falha ao remover alerta", { cause: error })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  void logEvent({
    action: "DELETE",
    feature: "metricas",
    description: `O usuário ${email} excluiu o alerta "${labelResumido}" em ${when}.`,
  })
}
