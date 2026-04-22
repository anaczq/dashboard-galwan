import { describe, it, expect } from "vitest"

import { formatWhatsApp, parseHorariosToPeríodos, formatPeriodosToHorarios } from "../corretores"
import type { Periodo } from "../corretores"

describe("formatWhatsApp", () => {
  it("formats country code only", () => {
    expect(formatWhatsApp("55")).toBe("+55")
  })

  it("formats country code + area code", () => {
    expect(formatWhatsApp("5511")).toBe("+55 11")
  })

  it("formats partial number", () => {
    expect(formatWhatsApp("551199999")).toBe("+55 11 99999")
  })

  it("formats full Brazilian mobile number", () => {
    expect(formatWhatsApp("5511999991234")).toBe("+55 11 99999-1234")
  })

  it("strips non-digit characters", () => {
    expect(formatWhatsApp("+55 (11) 99999-1234")).toBe("+55 11 99999-1234")
  })

  it("truncates at 13 digits", () => {
    expect(formatWhatsApp("55119999912345")).toBe("+55 11 99999-1234")
  })

  it("handles empty string", () => {
    expect(formatWhatsApp("")).toBe("+")
  })
})

describe("parseHorariosToPeríodos", () => {
  it("parses single period", () => {
    const result = parseHorariosToPeríodos("09:00-12:00")
    expect(result).toEqual([{ horarioInicio: "09:00", horarioFim: "12:00" }])
  })

  it("parses multiple periods", () => {
    const result = parseHorariosToPeríodos("09:00-12:00, 14:00-18:00")
    expect(result).toEqual([
      { horarioInicio: "09:00", horarioFim: "12:00" },
      { horarioInicio: "14:00", horarioFim: "18:00" },
    ])
  })

  it("returns empty period for empty string", () => {
    const result = parseHorariosToPeríodos("")
    expect(result).toEqual([{ horarioInicio: "", horarioFim: "" }])
  })

  it("trims whitespace", () => {
    const result = parseHorariosToPeríodos("  09:00 - 12:00 , 14:00 - 18:00  ")
    expect(result).toEqual([
      { horarioInicio: "09:00", horarioFim: "12:00" },
      { horarioInicio: "14:00", horarioFim: "18:00" },
    ])
  })

  it("handles malformed input gracefully", () => {
    const result = parseHorariosToPeríodos("09:00")
    expect(result).toEqual([{ horarioInicio: "09:00", horarioFim: "" }])
  })
})

describe("formatPeriodosToHorarios", () => {
  it("formats single period", () => {
    const periodos: Periodo[] = [{ horarioInicio: "09:00", horarioFim: "12:00" }]
    expect(formatPeriodosToHorarios(periodos)).toBe("09:00-12:00")
  })

  it("formats multiple periods", () => {
    const periodos: Periodo[] = [
      { horarioInicio: "09:00", horarioFim: "12:00" },
      { horarioInicio: "14:00", horarioFim: "18:00" },
    ]
    expect(formatPeriodosToHorarios(periodos)).toBe("09:00-12:00, 14:00-18:00")
  })

  it("filters out incomplete periods", () => {
    const periodos: Periodo[] = [
      { horarioInicio: "09:00", horarioFim: "12:00" },
      { horarioInicio: "", horarioFim: "" },
      { horarioInicio: "14:00", horarioFim: "" },
    ]
    expect(formatPeriodosToHorarios(periodos)).toBe("09:00-12:00")
  })

  it("returns empty string for empty array", () => {
    expect(formatPeriodosToHorarios([])).toBe("")
  })

  it("returns empty string for all-incomplete periods", () => {
    const periodos: Periodo[] = [{ horarioInicio: "", horarioFim: "" }]
    expect(formatPeriodosToHorarios(periodos)).toBe("")
  })
})
