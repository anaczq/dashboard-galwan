import { AlertTriangle, AlertCircle, AlertOctagon } from "lucide-react"

interface AlertItemProps {
  message: string
  date: string
  severity?: "high" | "medium" | "low"
}

const SEVERITY_CONFIG = {
  high: {
    icon: AlertOctagon,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
  },
  medium: {
    icon: AlertTriangle,
    iconColor: "text-amber-700",
    iconBg: "bg-amber-100",
  },
  low: {
    icon: AlertCircle,
    iconColor: "text-blue-700",
    iconBg: "bg-blue-100",
  },
}

export function AlertItem({ message, date, severity = "high" }: AlertItemProps) {
  const config = SEVERITY_CONFIG[severity]
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}>
        <Icon className={`size-3.5 ${config.iconColor}`} />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm text-foreground">{message}</p>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </div>
  )
}
