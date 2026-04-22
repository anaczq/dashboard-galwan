import { describe, it, expect } from "vitest"

import { formatIsoDateToBr } from "../utils"

describe("formatIsoDateToBr", () => {
  it("converte yyyy-MM-dd para dd/MM/yyyy sem depender de fuso", () => {
    expect(formatIsoDateToBr("2026-04-09")).toBe("09/04/2026")
  })

  it("retorna vazio para null ou string vazia", () => {
    expect(formatIsoDateToBr(null)).toBe("")
    expect(formatIsoDateToBr("")).toBe("")
  })

  it("repassa valor não-ISO sem alterar", () => {
    expect(formatIsoDateToBr("invalid")).toBe("invalid")
  })
})
