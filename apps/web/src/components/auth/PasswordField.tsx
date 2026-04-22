import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PasswordFieldProps = {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function PasswordField({
  id,
  label = "Senha",
  value,
  onChange,
  disabled = false,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Digite sua senha"
          className="h-11 pr-11"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setIsVisible((current) => !current)}
          className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    </div>
  )
}
