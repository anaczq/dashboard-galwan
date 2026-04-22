import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"

type AuthCardProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md overflow-hidden rounded-xl border-0 p-0 shadow">
      <div className="bg-gradient-to-r from-primary to-secondary px-6 py-6">
        <h1 className="text-center text-xl font-bold text-primary-foreground">
          {title}
        </h1>
        <p className="mt-1 text-center text-sm text-primary-foreground/80">
          {subtitle}
        </p>
      </div>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  )
}
