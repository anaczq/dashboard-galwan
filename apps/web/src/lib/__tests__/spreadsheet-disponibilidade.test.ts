import { describe, it, expect } from "vitest"
import { differenceInCalendarDays, parseISO } from "date-fns"

import {
  excelSerialToIsoDate,
  extractTimesFromRowSlice,
  parseAvailabilityDateCell,
  parseAvailabilityDateString,
  parseSpreadsheetTimeCell,
} from "../spreadsheet-disponibilidade"

describe("parseAvailabilityDateString", () => {
  it("parses DD/MM/YYYY (BR)", () => {
    expect(parseAvailabilityDateString("09/04/2026")).toBe("2026-04-09")
  })

  it("parses M/D/Y ambíguo no estilo Excel EUA (mês antes do dia quando 1º < 2º)", () => {
    expect(parseAvailabilityDateString("04/09/2026")).toBe("2026-04-09")
  })

  it("força dia/mês quando o dia > 12", () => {
    expect(parseAvailabilityDateString("25/04/2026")).toBe("2026-04-25")
  })

  it("parses ISO date", () => {
    expect(parseAvailabilityDateString("2026-04-09")).toBe("2026-04-09")
  })

  it("rejects invalid calendar date", () => {
    expect(parseAvailabilityDateString("31/02/2026")).toBeNull()
  })
})

describe("excelSerialToIsoDate", () => {
  it("maps serial 25569 to 1970-01-01", () => {
    expect(excelSerialToIsoDate(25569)).toBe("1970-01-01")
  })

  it("round-trips with calendar days from epoch", () => {
    const iso = "2026-04-09"
    const serial =
      25569 + differenceInCalendarDays(parseISO(iso), parseISO("1970-01-01"))
    expect(excelSerialToIsoDate(serial)).toBe(iso)
  })
})

describe("parseAvailabilityDateCell", () => {
  it("accepts Excel serial number", () => {
    const serial =
      25569 + differenceInCalendarDays(parseISO("2026-04-09"), parseISO("1970-01-01"))
    expect(parseAvailabilityDateCell(serial)).toBe("2026-04-09")
  })

  it("uses date part of datetime serial", () => {
    const serial =
      25569 +
      differenceInCalendarDays(parseISO("2026-04-09"), parseISO("1970-01-01")) +
      0.375
    expect(parseAvailabilityDateCell(serial)).toBe("2026-04-09")
  })
})

describe("parseSpreadsheetTimeCell", () => {
  it("parses Excel time fraction to HH:MM", () => {
    expect(parseSpreadsheetTimeCell(0.375)).toBe("09:00")
  })
})

describe("extractTimesFromRowSlice", () => {
  it("reads start and end from C and D", () => {
    const row = ["a@b.com", "09/04/2026", "09:00", "12:00"]
    expect(extractTimesFromRowSlice(row)).toEqual({
      start: "09:00",
      end: "12:00",
      error: null,
    })
  })

  it("reads start and end from C and E when D is empty", () => {
    const row = ["a@b.com", "09/04/2026", "08:00", "", "11:00"]
    expect(extractTimesFromRowSlice(row)).toEqual({
      start: "08:00",
      end: "11:00",
      error: null,
    })
  })

  it("reads from D and E when C is empty", () => {
    const row = ["a@b.com", "09/04/2026", "", "12:00", "19:00"]
    expect(extractTimesFromRowSlice(row)).toEqual({
      start: "12:00",
      end: "19:00",
      error: null,
    })
  })

  it("errors on three time values", () => {
    const row = ["a@b.com", "09/04/2026", "08:00", "12:00", "14:00"]
    const r = extractTimesFromRowSlice(row)
    expect(r.error).toBeTruthy()
    expect(r.start).toBeNull()
  })
})
