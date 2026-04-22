import { LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/LoadingState"
import { useAuth } from "@/hooks/useAuth"

export function Perfil() {
  const navigate = useNavigate()
  const { user, isLoading, signOut } = useAuth()

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.user_name ||
    null

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success("Logout realizado. Até logo!")
      navigate("/login", { replace: true })
    } catch {
      toast.error("Erro ao sair. Tente novamente.")
    }
  }

  if (isLoading) {
    return <LoadingState message="Carregando perfil..." />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="overflow-hidden rounded-xl border-0 shadow">
        <div className="bg-gradient-to-r from-primary to-secondary p-4">
          <CardTitle className="p-0 text-xl text-primary-foreground">
            Informações do Perfil
          </CardTitle>
        </div>
        <CardContent className="space-y-6 p-6 pt-4">
          {displayName && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="mt-1 text-lg font-semibold">{displayName}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">E-mail</p>
            <p className="mt-1 text-lg font-semibold">{user?.email || "N/A"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border-0 shadow">
        <div className="bg-gradient-to-r from-primary to-secondary p-4">
          <CardTitle className="p-0 text-xl text-primary-foreground">Ações</CardTitle>
        </div>
        <CardContent className="space-y-4 p-6 pt-4">
          <Button
            onClick={handleLogout}
            className="w-full justify-start gap-3"
            variant="destructive"
          >
            <LogOut className="h-5 w-5" />
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Perfil
