import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { Link } from "react-router-dom"

import { AuthCard } from "@/components/auth/AuthCard"
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { completeAuthFromUrl, getSession, hasIncomingAuthSignal } from "@/services/auth"

export function UpdatePassword() {
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
          "Não foi possível validar o link. Ele pode ter expirado — solicite uma nova redefinição em Esqueci minha senha.",
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
        ? "Não encontramos uma sessão válida neste link. Abra o e-mail de redefinição diretamente ou solicite um novo envio."
        : "Esta página é usada a partir do link enviado após Esqueci minha senha. Se você já tem sessão, use o painel ou o login."

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <section className="w-full max-w-md">
          <AuthCard title="Não foi possível redefinir a senha" subtitle={subtitle}>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full font-semibold" size="lg">
                <Link to="/reset-password">Esqueci minha senha</Link>
              </Button>
              <Button asChild variant="outline" className="w-full font-semibold" size="lg">
                <Link to="/login">Ir para o login</Link>
              </Button>
            </div>
          </AuthCard>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md">
        <AuthCard
          title="Nova senha"
          subtitle="Defina uma nova senha para a sua conta."
        >
          <UpdatePasswordForm />
        </AuthCard>
      </section>
    </main>
  )
}
