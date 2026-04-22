import { supabase } from "@/integrations/supabase/client"
import { getChangedUpdateKeys } from "@/lib/changed-update-keys"
import { AppError, ForbiddenError, isForbiddenSupabaseError } from "@/lib/errors"
import { formatLogDateTime, logEvent } from "@/services/logs"

export interface AgentPrompt {
  id: string
  identity: string | null
  qualification_methodology: string | null
  emojis: string | null
  created_at: string | null
  updated_at: string | null
}

export interface UpdateAgentPromptInput {
  id: string
  updates: Partial<Omit<AgentPrompt, "id" | "created_at" | "updated_at">>
}

const COLUMNS = "id, identity, qualification_methodology, emojis, created_at, updated_at"

export async function fetchAgentPrompt(): Promise<AgentPrompt | null> {
  const { data, error } = await supabase.from("prompt").select(COLUMNS).maybeSingle()

  if (error) {
    if (isForbiddenSupabaseError(error)) {
      throw new ForbiddenError("Você não tem permissão para acessar o prompt", { cause: error })
    }
    throw new AppError("Falha ao buscar configurações do prompt", { cause: error })
  }
  return data
}

const PROMPT_FIELD_LABEL: Record<string, string> = {
  identity: "Identidade",
  qualification_methodology: "Metodologia de Qualificação",
  emojis: "Emojis",
}

export async function updateAgentPrompt(input: UpdateAgentPromptInput): Promise<void> {
  const { data: before } = await supabase
    .from("prompt")
    .select("identity, qualification_methodology, emojis")
    .eq("id", input.id)
    .maybeSingle()

  const { error } = await supabase.from("prompt").update(input.updates).eq("id", input.id)
  if (error) {
    if (isForbiddenSupabaseError(error)) {
      throw new ForbiddenError("Você não tem permissão para atualizar o prompt", { cause: error })
    }
    throw new AppError("Falha ao atualizar prompt", { cause: error })
  }

  const changed = getChangedUpdateKeys(
    input.updates as Record<string, unknown>,
    (before ?? {}) as Record<string, unknown>,
  )
  if (changed.length === 0) return

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  for (const key of changed) {
    const label = PROMPT_FIELD_LABEL[key] ?? key
    void logEvent({
      action: "UPDATE",
      feature: "prompts",
      description: `O usuário ${email} alterou o campo "${label}" no prompt do agente em ${when}.`,
    })
  }
}
