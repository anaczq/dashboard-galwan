import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Check, CheckCircle2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { updateUserPassword } from "@/services/auth"

import { PasswordField } from "./PasswordField"

type Rule = {
  label: string
  test: (value: string) => boolean
}

const PASSWORD_RULES: Rule[] = [
  { label: "Mínimo de 10 caracteres", test: (v) => v.length >= 10 },
  { label: "Pelo menos uma letra", test: (v) => /[a-zA-Z]/.test(v) },
  { label: "Pelo menos um caractere especial", test: (v) => /[^a-zA-Z0-9]/.test(v) },
]

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [updated, setUpdated] = useState(false)
  const navigate = useNavigate()

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, valid: rule.test(password) })),
    [password],
  )
  const allRulesValid = ruleResults.every((r) => r.valid)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")

    if (!password.trim() || !confirmPassword.trim()) {
      setErrorMessage("Preencha os dois campos de senha.")
      return
    }

    if (!allRulesValid) {
      setErrorMessage("A senha não atende aos requisitos abaixo.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.")
      return
    }

    setIsPending(true)

    const { error } = await updateUserPassword(password)

    setIsPending(false)

    if (error) {
      setErrorMessage("Não foi possível atualizar a senha. Tente novamente.")
      return
    }

    setUpdated(true)
    toast.success("Senha atualizada com sucesso!")
    setTimeout(() => navigate("/home", { replace: true }), 2000)
  }

  if (updated) {
    return (
      <div className="space-y-5 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <div className="space-y-2">
          <p className="text-sm font-medium">Senha atualizada!</p>
          <p className="text-sm text-muted-foreground">
            Redirecionando para o painel...
          </p>
        </div>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <p className="text-sm text-muted-foreground">
        Escolha uma nova senha para sua conta.
      </p>

      <PasswordField
        id="new-password"
        label="Nova senha"
        value={password}
        disabled={isPending}
        onChange={setPassword}
      />

      <ul className="space-y-1 rounded-md bg-muted/40 p-3 text-xs">
        {ruleResults.map((rule) => (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-2",
              rule.valid ? "text-green-600" : "text-muted-foreground",
            )}
          >
            {rule.valid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>

      <PasswordField
        id="confirm-password"
        label="Confirmar nova senha"
        value={confirmPassword}
        disabled={isPending}
        onChange={setConfirmPassword}
      />

      <Button type="submit" size="lg" disabled={isPending} className="w-full font-semibold">
        {isPending ? "Atualizando..." : "Atualizar senha"}
      </Button>

      {errorMessage ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </form>
  )
}
