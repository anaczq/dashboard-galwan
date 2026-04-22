export interface Periodo {
  horarioInicio: string
  horarioFim: string
}

export const formatPeriodosToHorarios = (periodos: Periodo[]): string => {
  return periodos
    .filter((p) => p.horarioInicio && p.horarioFim)
    .map((p) => `${p.horarioInicio}-${p.horarioFim}`)
    .join(", ")
}

export const parseHorariosToPeríodos = (horarios: string): Periodo[] => {
  if (!horarios) return [{ horarioInicio: "", horarioFim: "" }]
  const parts = horarios.split(",").map((s) => s.trim())
  return parts.map((part) => {
    const [inicio, fim] = part.split("-").map((s) => s.trim())
    return { horarioInicio: inicio || "", horarioFim: fim || "" }
  })
}

export const formatWhatsApp = (value: string): string => {
  const digits = value.replace(/\D/g, "")
  if (digits.length <= 2) return `+${digits}`
  if (digits.length <= 4) return `+${digits.slice(0, 2)} ${digits.slice(2)}`
  if (digits.length <= 9)
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`
  return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9, 13)}`
}

export const BROKER_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#6366f1",
] as const
