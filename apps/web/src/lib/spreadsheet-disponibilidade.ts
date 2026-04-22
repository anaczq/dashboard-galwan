/** Parse DD/MM/YYYY or yyyy-mm-dd → yyyy-mm-dd (calendar, no TZ shift). */
export function parseAvailabilityDateString(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number)
    if (!isValidYmd(y, m, d)) return null
    return s
  }

  if (s.includes("/")) {
    const parts = s.split("/")
    if (parts.length !== 3) return null
    const [as, bs, ysRaw] = parts.map((p) => p.trim())
    let y = Number(ysRaw)
    if (!Number.isFinite(y)) return null
    if (ysRaw.length === 2) y += y >= 70 ? 1900 : 2000
    if (ysRaw.length !== 2 && ysRaw.length !== 4) return null

    const a = Number(as)
    const b = Number(bs)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null

    const isoDdMm = (d: number, m: number) =>
      isValidYmd(y, m, d)
        ? `${String(y)}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        : null

    const ddmm = isoDdMm(a, b)
    const mmdd = isoDdMm(b, a)

    if (ddmm && !mmdd) return ddmm
    if (mmdd && !ddmm) return mmdd
    if (ddmm && mmdd) {
      if (a === b) return ddmm
      if (a > b) return ddmm
      return mmdd
    }
    return null
  }

  return null
}

function isValidYmd(y: number, m: number, d: number): boolean {
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/**
 * Excel 1900 date system: serial 25569 = 1970-01-01 UTC.
 * Uses UTC to avoid local timezone shifting the calendar day.
 */
export function excelSerialToIsoDate(serial: number): string | null {
  const n = Math.floor(serial)
  if (!Number.isFinite(n) || n < 1 || n > 2958465) return null
  const utcDays = n - 25569
  const ms = utcDays * 86400 * 1000
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  if (y < 1900 || y > 2100) return null
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** Date column: string (DD/MM or ISO), Excel serial, or datetime serial (uses date part). */
export function parseAvailabilityDateCell(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number" && Number.isFinite(value)) {
    const whole = Math.floor(value)
    const frac = value - whole
    if (whole >= 1 && whole < 1000000 && (frac === 0 || (frac > 0 && frac < 1))) {
      return excelSerialToIsoDate(whole)
    }
    return null
  }
  if (typeof value === "string") return parseAvailabilityDateString(value)
  return parseAvailabilityDateString(String(value))
}

const TIME_REGEX = /^\d{2}:\d{2}$/

export function parseSpreadsheetTimeString(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  if (TIME_REGEX.test(s)) return s
  const match = s.match(/^(\d{1,2}):(\d{2})/)
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`
  return null
}

/** Time cell: "HH:MM" or Excel fraction of day (e.g. 0.375 → 09:00). */
export function parseSpreadsheetTimeCell(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 1) {
    const totalMinutes = Math.round(value * 24 * 60)
    const h = Math.floor(totalMinutes / 60) % 24
    const m = totalMinutes % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }
  return parseSpreadsheetTimeString(String(value))
}

export interface ExtractedTimes {
  start: string | null
  end: string | null
  error: string | null
}

/**
 * Reads up to two times from columns C–E (indices 2–4) so a value in column F
 * still pairs correctly when D is empty (common Excel paste glitch).
 */
export function extractTimesFromRowSlice(row: unknown[]): ExtractedTimes {
  const slots: string[] = []
  for (let c = 2; c <= 4; c++) {
    const raw = row[c]
    if (raw === null || raw === undefined || raw === "") continue
    const isEmptyString = typeof raw === "string" && raw.trim() === ""
    if (isEmptyString) continue

    const t = parseSpreadsheetTimeCell(raw)
    if (!t) {
      return {
        start: null,
        end: null,
        error: `Coluna ${c + 1}: horário inválido (${String(raw).trim()}). Use HH:MM.`,
      }
    }
    slots.push(t)
  }

  if (slots.length === 0) return { start: null, end: null, error: null }
  if (slots.length === 1) {
    return {
      start: null,
      end: null,
      error: "Informe dois horários (início e fim) ou deixe as três colunas de horário vazias.",
    }
  }
  if (slots.length === 2) return { start: slots[0], end: slots[1], error: null }
  return {
    start: null,
    end: null,
    error: "Há mais de dois horários nas colunas C–E; use apenas início e fim (ou duplique a linha).",
  }
}
