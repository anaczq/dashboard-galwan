// Edge Function: assistant-chat
//
// Recebe { message, userEmail } do frontend e proxia para o webhook do n8n
// configurado na secret WEBHOOK_CHAT_APP. Retorna { response: string } com o
// texto gerado pelo agente.
//
// Envs obrigatórias (Project Settings → Edge Functions → Secrets):
//   - SUPABASE_URL
//   - SUPABASE_ANON_KEY
//   - WEBHOOK_CHAT_APP   (URL do webhook n8n)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  })

interface ChatPayload {
  message: string
  userEmail: string
}

const extractResponseText = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === "string") return parsed
    if (parsed && typeof parsed === "object") {
      const candidate =
        (parsed as Record<string, unknown>).response ??
        (parsed as Record<string, unknown>).output ??
        (parsed as Record<string, unknown>).text ??
        (parsed as Record<string, unknown>).message
      if (typeof candidate === "string") return candidate
    }
    return raw
  } catch {
    return raw
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS })
  if (req.method !== "POST") return json(405, { error: "Method not allowed" })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const webhookUrl = Deno.env.get("WEBHOOK_CHAT_APP")

  if (!supabaseUrl || !anonKey) {
    return json(500, { error: "Missing Supabase env vars" })
  }
  if (!webhookUrl) {
    return json(500, { error: "WEBHOOK_CHAT_APP não configurado" })
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json(401, { error: "Missing bearer token", code: "UNAUTHENTICATED" })
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: callerData, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !callerData.user) {
    return json(401, { error: "Invalid session", code: "UNAUTHENTICATED" })
  }

  let payload: ChatPayload
  try {
    const body = await req.json()
    const message = typeof body.message === "string" ? body.message.trim() : ""
    const userEmail =
      typeof body.userEmail === "string" && body.userEmail.trim()
        ? body.userEmail.trim()
        : (callerData.user.email ?? "")

    if (!message) return json(400, { error: "message obrigatório" })
    if (!userEmail) return json(400, { error: "userEmail obrigatório" })

    payload = { message, userEmail }
  } catch {
    return json(400, { error: "Payload inválido" })
  }

  const webhookRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const raw = await webhookRes.text()

  if (!webhookRes.ok) {
    return json(502, { error: "Webhook retornou erro", status: webhookRes.status })
  }

  return json(200, { response: extractResponseText(raw) })
})
