import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPasswordForEmail } from "@/services/auth"

function mapResetPasswordError(error: { message: string }): string {
  const msg = error.message.toLowerCase()
  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("email rate limit")) {
    return "Muitas solicitações. Aguarde alguns minutos e tente novamente."
  }
  if (msg.includes("invalid email")) {
    return "E-mail com formato inválido."
  }
  return "Sistema temporariamente indisponível. Tente novamente em instantes."
}

export function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")

    if (!email.trim()) {
      setErrorMessage("Informe seu e-mail para continuar.")
      return
    }

    setIsPending(true)

    const { error } = await resetPasswordForEmail(
      email.trim(),
      `${window.location.origin}/update-password`,
    )

    setIsPending(false)

    if (error) {
      setErrorMessage(mapResetPasswordError(error))
      return
    }

    setEmailSent(true)
  }

  if (emailSent) {
    return (
      <div className="space-y-5 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <div className="space-y-2">
          <p className="text-sm font-medium">E-mail enviado com sucesso!</p>
          <p className="text-sm text-muted-foreground">
            Verifique sua caixa de entrada em <strong>{email}</strong> e siga as instruções para
            redefinir sua senha.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <p className="text-sm text-muted-foreground">
        Informe o e-mail da sua conta e enviaremos um link para redefinir sua senha.
      </p>

      <div className="space-y-2">
        <Label htmlFor="reset-email">E-mail</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="voce@empresa.com"
          autoComplete="email"
          value={email}
          disabled={isPending}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
        />
      </div>

      <Button type="submit" size="lg" disabled={isPending} className="w-full font-semibold">
        {isPending ? "Enviando..." : "Enviar link de redefinição"}
      </Button>

      {errorMessage ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    </form>
  )
}
