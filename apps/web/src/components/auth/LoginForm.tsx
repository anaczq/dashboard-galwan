import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"

import { PasswordField } from "./PasswordField"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Preencha e-mail e senha para continuar.")
      return
    }

    setIsPending(true)

    const { error } = await signIn(email, password)

    if (error) {
      setErrorMessage(error)
      setIsPending(false)
      return
    }

    navigate("/home", { replace: true })
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="voce@empresa.com"
          autoComplete="email"
          value={email}
          disabled={isPending}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11"
        />
      </div>

      <PasswordField
        id="password"
        value={password}
        disabled={isPending}
        onChange={setPassword}
      />

      <div className="flex justify-end">
        <Link
          to="/reset-password"
          className="text-sm text-primary transition-colors hover:text-primary/80"
        >
          Esqueci minha senha
        </Link>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full font-semibold"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </Button>

      {errorMessage ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </form>
  )
}
