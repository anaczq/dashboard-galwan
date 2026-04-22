import { ShieldAlert } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"

export function AcessoNegado() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md overflow-hidden rounded-xl border border-border shadow">
        <div className="flex items-center gap-3 bg-gradient-to-r from-primary to-secondary p-4">
          <ShieldAlert className="size-6 text-primary-foreground" />
          <CardTitle className="p-0 text-xl text-primary-foreground">
            Acesso negado
          </CardTitle>
        </div>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            Sua conta está inativa ou não possui permissão para acessar a plataforma.
            Entre em contato com um administrador para solicitar acesso.
          </p>
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default AcessoNegado
