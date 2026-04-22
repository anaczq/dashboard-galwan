import { supabase } from "@/integrations/supabase/client"
import { getChangedUpdateKeys } from "@/lib/changed-update-keys"
import { AppError } from "@/lib/errors"
import { formatLogDateTime, logEvent } from "@/services/logs"

const LEAD_FIELD_LABEL: Record<string, string> = {
  agreed_terms: "aceite de termos",
  is_active: "ativo",
  request_notes: "observações",
}

export interface Lead {
  id: string
  name: string
  whatsapp: string | null
  agreed_terms: boolean | null
  is_active: boolean | null
  request_notes: string | null
  created_at: string
  updated_at: string | null
}

export interface CreateLeadInput {
  name: string
  whatsapp: string
  agreed_terms?: boolean
  is_active?: boolean
  request_notes?: string | null
}

export interface UpdateLeadInput {
  id: string
  agreed_terms?: boolean
  is_active?: boolean
  request_notes?: string | null
}

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, whatsapp, agreed_terms, is_active, request_notes, created_at, updated_at")
    .order("created_at", { ascending: false })

  if (error) throw new AppError("Falha ao buscar leads", { cause: error })
  return data ?? []
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("whatsapp", input.whatsapp)
    .limit(1)

  if (existing && existing.length > 0) {
    throw new AppError("Já existe um lead com este WhatsApp", { code: "DUPLICATE_WHATSAPP" })
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: input.name,
      whatsapp: input.whatsapp,
      agreed_terms: input.agreed_terms ?? false,
      is_active: input.is_active ?? true,
      request_notes: input.request_notes ?? null,
    })
    .select()
    .single()

  if (error) throw new AppError("Falha ao criar lead", { cause: error })
  return data
}

export async function deleteLead(input: { id: string }): Promise<void> {
  const { data: lead } = await supabase.from("leads").select("name").eq("id", input.id).maybeSingle()
  const nome = lead?.name ?? "—"

  const { error } = await supabase.from("leads").delete().eq("id", input.id)
  if (error) throw new AppError("Falha ao remover lead", { cause: error })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  void logEvent({
    action: "DELETE",
    feature: "leads",
    description: `O usuário ${email} excluiu o lead "${nome}" em ${when}.`,
  })
}

export async function updateLead(input: UpdateLeadInput): Promise<void> {
  const { id, ...updates } = input
  const { data: before } = await supabase
    .from("leads")
    .select("agreed_terms, is_active, request_notes, name")
    .eq("id", id)
    .maybeSingle()

  const { error } = await supabase.from("leads").update(updates).eq("id", id)
  if (error) throw new AppError("Falha ao atualizar lead", { cause: error })

  const changed = getChangedUpdateKeys(updates as Record<string, unknown>, (before ?? {}) as Record<string, unknown>)
  if (changed.length === 0) return

  const nome = before?.name ?? "—"
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  for (const key of changed) {
    const label = LEAD_FIELD_LABEL[key] ?? key
    void logEvent({
      action: "UPDATE",
      feature: "leads",
      description: `O usuário ${email} alterou o campo "${label}" no lead "${nome}" em ${when}.`,
    })
  }
}
