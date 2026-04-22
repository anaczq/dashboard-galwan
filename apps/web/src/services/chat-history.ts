import { supabase } from "@/integrations/supabase/client"

export type ChatRole = "user" | "assistant"

export interface ChatHistoryMessage {
  id: number
  role: ChatRole
  content: string
}

interface RawMessage {
  type?: string
  content?: unknown
}

const ROLE_BY_TYPE: Record<string, ChatRole> = {
  human: "user",
  ai: "assistant",
}

export async function fetchChatHistory(
  email: string,
): Promise<ChatHistoryMessage[]> {
  const { data, error } = await supabase
    .from("n8n_assistant_dash_history")
    .select("id, message")
    .eq("session_id", email)
    .order("id", { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as Array<{ id: number; message: RawMessage | string | null }>

  return rows.flatMap((row) => {
    const raw = typeof row.message === "string"
      ? safeParse(row.message)
      : row.message
    if (!raw || typeof raw !== "object") return []

    const role = ROLE_BY_TYPE[raw.type ?? ""]
    if (!role) return []

    const content = typeof raw.content === "string" ? raw.content : ""
    if (!content) return []

    return [{ id: row.id, role, content }]
  })
}

const safeParse = (value: string): RawMessage | null => {
  try {
    return JSON.parse(value) as RawMessage
  } catch {
    return null
  }
}

export async function deleteChatHistory(email: string): Promise<void> {
  const { error } = await supabase
    .from("n8n_assistant_dash_history")
    .delete()
    .eq("session_id", email)

  if (error) throw error
}
