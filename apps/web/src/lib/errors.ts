export class AppError extends Error {
  public readonly code: string

  constructor(message: string, options?: { cause?: unknown; code?: string }) {
    super(message, { cause: options?.cause })
    this.name = "AppError"
    this.code = options?.code ?? "APP_ERROR"
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado", options?: { cause?: unknown }) {
    super(message, { cause: options?.cause, code: "FORBIDDEN" })
    this.name = "ForbiddenError"
  }
}

interface PostgrestLikeError {
  code?: string
  message?: string
  status?: number
}

export const isForbiddenSupabaseError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false
  const e = error as PostgrestLikeError
  if (e.code === "42501" || e.code === "PGRST301") return true
  if (e.status === 401 || e.status === 403) return true
  if (typeof e.message === "string") {
    const m = e.message.toLowerCase()
    if (m.includes("permission denied") || m.includes("row-level security")) return true
  }
  return false
}

export const getUserFriendlyMessage = (error: unknown): string => {
  if (error instanceof AppError) return error.message

  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return "Sem conexão com o servidor. Verifique sua internet."
    }
    if (error.message.includes("JWT expired") || error.message.includes("invalid claim")) {
      return "Sua sessão expirou. Faça login novamente."
    }
  }

  return "Ocorreu um erro inesperado. Tente novamente."
}
