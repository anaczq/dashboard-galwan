import { Link } from "react-router-dom"
import { Home } from "lucide-react"

import { Button } from "@/components/ui/button"

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-8xl font-extrabold tracking-tight text-primary">
        404
      </h1>
      <p className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Button asChild className="mt-8 gap-2" size="lg">
        <Link to="/home">
          <Home className="h-4 w-4" />
          Voltar ao início
        </Link>
      </Button>
    </main>
  )
}
