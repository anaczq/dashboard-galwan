import { describe, it, expect } from "vitest"

import { AppError, getUserFriendlyMessage } from "../errors"

describe("AppError", () => {
  it("sets name to AppError", () => {
    const err = new AppError("test")
    expect(err.name).toBe("AppError")
  })

  it("sets message", () => {
    const err = new AppError("something went wrong")
    expect(err.message).toBe("something went wrong")
  })

  it("defaults code to APP_ERROR", () => {
    const err = new AppError("test")
    expect(err.code).toBe("APP_ERROR")
  })

  it("accepts custom code", () => {
    const err = new AppError("test", { code: "NOT_FOUND" })
    expect(err.code).toBe("NOT_FOUND")
  })

  it("accepts cause", () => {
    const cause = new Error("original")
    const err = new AppError("wrapped", { cause })
    expect(err.cause).toBe(cause)
  })

  it("is instanceof Error", () => {
    const err = new AppError("test")
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(AppError)
  })
})

describe("getUserFriendlyMessage", () => {
  it("returns AppError message directly", () => {
    const err = new AppError("Falha ao buscar leads")
    expect(getUserFriendlyMessage(err)).toBe("Falha ao buscar leads")
  })

  it("returns network error message for Failed to fetch", () => {
    const err = new Error("Failed to fetch")
    expect(getUserFriendlyMessage(err)).toBe("Sem conexão com o servidor. Verifique sua internet.")
  })

  it("returns network error message for NetworkError", () => {
    const err = new Error("NetworkError when attempting to fetch resource")
    expect(getUserFriendlyMessage(err)).toBe("Sem conexão com o servidor. Verifique sua internet.")
  })

  it("returns session expired for JWT expired", () => {
    const err = new Error("JWT expired")
    expect(getUserFriendlyMessage(err)).toBe("Sua sessão expirou. Faça login novamente.")
  })

  it("returns session expired for invalid claim", () => {
    const err = new Error("invalid claim: something")
    expect(getUserFriendlyMessage(err)).toBe("Sua sessão expirou. Faça login novamente.")
  })

  it("returns generic message for unknown Error", () => {
    const err = new Error("something random")
    expect(getUserFriendlyMessage(err)).toBe("Ocorreu um erro inesperado. Tente novamente.")
  })

  it("returns generic message for non-Error values", () => {
    expect(getUserFriendlyMessage("string error")).toBe("Ocorreu um erro inesperado. Tente novamente.")
    expect(getUserFriendlyMessage(null)).toBe("Ocorreu um erro inesperado. Tente novamente.")
    expect(getUserFriendlyMessage(42)).toBe("Ocorreu um erro inesperado. Tente novamente.")
  })
})
