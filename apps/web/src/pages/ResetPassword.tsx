import { Navigate } from "react-router-dom"

import { AuthCard } from "@/components/auth/AuthCard"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"
import { useAuth } from "@/hooks/useAuth"

export function ResetPassword() {
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
          title="Redefinir senha"
          subtitle="Enviaremos um link de redefinição para o seu e-mail."
        >
          <ResetPasswordForm />
        </AuthCard>
      </section>
    </main>
  )
}
