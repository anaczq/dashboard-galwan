import { Navigate } from "react-router-dom"

import { AuthCard } from "@/components/auth/AuthCard"
import { LoginForm } from "@/components/auth/LoginForm"
import { useAuth } from "@/hooks/useAuth"

export function Login() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    )
  }

  if (session) {
    return <Navigate to="/home" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md">
        <AuthCard
          title="Bem-vindo ao seu Dashboard"
          subtitle="Acesse sua conta para gerenciar os dados do seu Agente SDR"
        >
          <LoginForm />
        </AuthCard>
      </section>
    </main>
  )
}
