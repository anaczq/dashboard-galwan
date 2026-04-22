import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { Link } from "react-router-dom"

import { AuthCard } from "@/components/auth/AuthCard"
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { completeAuthFromUrl, getSession, hasIncomingAuthSignal } from "@/services/auth"

export function DefinirSenha() {
  const { session: contextSession, isLoading } = useAuth()
  const [handlingUrl, setHandlingUrl] = useState(true)
  const [urlExchangeError, setUrlExchangeError] = useState<string | null>(null)
  const [bootstrappedSession, setBootstrappedSession] = useState<Session | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { error } = await completeAuthFromUrl()
      const { session: latest } = await getSession()
      if (cancelled) return
      if (error) {
        setUrlExchangeError(
          "Não foi possível validar o link. Ele pode ter expirado — peça um novo convite ao administrador.",
        )
      }
      setBootstrappedSession(latest)
      setHandlingUrl(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const session = contextSession ?? bootstrappedSession

  if (isLoading || handlingUrl) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    )
  }

  if (!session) {
    const subtitle = urlExchangeError
      ? urlExchangeError
      : hasIncomingAuthSignal()
        ? "Não encontramos uma sessão válida neste link. Abra o convite diretamente do e-mail ou solicite um novo acesso."
        : "Esta página é usada a partir do link enviado no convite. Se você já tem conta, use o login."

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <section className="w-full max-w-md">
          <AuthCard title="Não foi possível definir a senha" subtitle={subtitle}>
            <Button asChild className="w-full font-semibold" size="lg">
              <Link to="/login">Ir para o login</Link>
            </Button>
          </AuthCard>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md">
        <AuthCard
          title="Definir senha"
          subtitle="Complete seu cadastro escolhendo uma senha de acesso."
        >
          <UpdatePasswordForm />
        </AuthCard>
      </section>
    </main>
  )
}
