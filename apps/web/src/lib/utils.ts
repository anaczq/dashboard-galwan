import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata `yyyy-MM-dd` (data de calendário do banco) como dd/MM/yyyy sem usar `Date` — evita troca de dia/mês por fuso. */
export function formatIsoDateToBr(iso: string | null | undefined): string {
  if (iso == null) return ""
  const s = iso.trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return s
  return `${m[3]}/${m[2]}/${m[1]}`
}
