import type { LucideIcon } from "lucide-react"

import { Card } from "@/components/ui/card"

interface KpiCardProps {
  label: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
}

export function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: KpiCardProps) {
  return (
    <Card className="flex flex-col gap-2 rounded-xl border-0 p-4 shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`flex size-8 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className={`size-4 ${iconColor}`} />
        </div>
      </div>
      <span className="text-3xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </Card>
  )
}
