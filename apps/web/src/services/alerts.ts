import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"
import { getChangedUpdateKeys } from "@/lib/changed-update-keys"
import { AppError } from "@/lib/errors"
import { formatLogDateTime, logEvent } from "@/services/logs"

const ALERT_UPDATE_FIELD_LABEL: Record<string, string> = {
  severity: "gravidade",
}

export type AlertSeverity = Database["public"]["Enums"]["alert_severity"]

export interface Alert {
  id: string
  alert_type: string | null
  alert_date: string | null
  description: string | null
  severity: AlertSeverity
  guidance: string | null
  created_at: string
}

export interface UpdateAlertInput {
  id: string
  severity?: AlertSeverity
}

export async function fetchAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("id, alert_type, alert_date, description, severity, guidance, created_at")
    .order("alert_date", { ascending: false })

  if (error) throw new AppError("Falha ao buscar alertas", { cause: error })
  return data ?? []
}

function shortAlertDescription(desc: string | null | undefined, max = 80): string {
  const t = (desc ?? "—").trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export async function updateAlert(input: UpdateAlertInput): Promise<void> {
  const { id, ...updates } = input
  const { data: before } = await supabase
    .from("alerts")
    .select("description, severity")
    .eq("id", id)
    .maybeSingle()
  const descResumida = shortAlertDescription(before?.description)

  const { error } = await supabase
    .from("alerts")
    .update(updates)
    .eq("id", id)
  if (error) throw new AppError("Falha ao atualizar alerta", { cause: error })

  const changed = getChangedUpdateKeys(
    updates as Record<string, unknown>,
    (before ?? {}) as Record<string, unknown>,
  )
  if (changed.length === 0) return

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  for (const key of changed) {
    const label = ALERT_UPDATE_FIELD_LABEL[key] ?? key
    void logEvent({
      action: "UPDATE",
      feature: "metricas",
      description: `O usuário ${email} atualizou o campo "${label}" do alerta "${descResumida}" em ${when}.`,
    })
  }
}

export async function deleteAlert(input: { id: string }): Promise<void> {
  const { data: row } = await supabase.from("alerts").select("description").eq("id", input.id).maybeSingle()
  const descResumida = shortAlertDescription(row?.description)

  const { error } = await supabase.from("alerts").delete().eq("id", input.id)
  if (error) throw new AppError("Falha ao remover alerta", { cause: error })

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
