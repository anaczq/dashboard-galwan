import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface SectionCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  onViewAll?: () => void
}

export function SectionCard({ title, subtitle, children, onViewAll }: SectionCardProps) {
  return (
    <Card className="overflow-hidden rounded-xl border-0 p-0 shadow">
      <div className="flex items-center justify-between bg-gradient-to-r from-primary to-secondary px-4 py-4 lg:px-6">
        <div>
          <h2 className="text-lg font-semibold text-primary-foreground">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-primary-foreground/80">{subtitle}</p>
          ) : null}
        </div>
        {onViewAll ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            className="h-7 border-white/30 bg-transparent text-xs text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            Ver todos
          </Button>
        ) : null}
      </div>
      <CardContent className="p-4 lg:p-6">{children}</CardContent>
    </Card>
  )
}
