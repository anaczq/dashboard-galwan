import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getUserFriendlyMessage } from "@/lib/errors"

interface ErrorStateProps {
  error: unknown
  title?: string
  onRetry?: () => void
}

export function ErrorState({
  error,
  title = "Erro ao carregar dados",
  onRetry,
}: ErrorStateProps) {
  const message = getUserFriendlyMessage(error)

  return (
    <Card className="rounded-xl border-0 shadow">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 rounded-full bg-destructive/10 p-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
