import { describe, it, expect } from "vitest"

import { validateImageFile, getStoragePathFromUrl } from "../storage"
import { AppError } from "@/lib/errors"

describe("validateImageFile", () => {
  const createFile = (name: string, type: string, sizeBytes: number): File => {
    const content = new Uint8Array(sizeBytes)
    return new File([content], name, { type })
  }

  it("accepts valid JPEG", () => {
    const file = createFile("photo.jpg", "image/jpeg", 1024)
    expect(() => validateImageFile(file)).not.toThrow()
  })

  it("accepts valid PNG", () => {
    const file = createFile("photo.png", "image/png", 1024)
    expect(() => validateImageFile(file)).not.toThrow()
  })

  it("accepts valid WebP", () => {
    const file = createFile("photo.webp", "image/webp", 1024)
    expect(() => validateImageFile(file)).not.toThrow()
  })

  it("accepts valid GIF", () => {
    const file = createFile("anim.gif", "image/gif", 1024)
    expect(() => validateImageFile(file)).not.toThrow()
  })

  it("rejects invalid file type", () => {
    const file = createFile("doc.pdf", "application/pdf", 1024)
    expect(() => validateImageFile(file)).toThrow(AppError)
    expect(() => validateImageFile(file)).toThrow(/Tipo de arquivo não permitido/)
  })

  it("sets INVALID_FILE_TYPE code for wrong type", () => {
    const file = createFile("doc.pdf", "application/pdf", 1024)
    try {
      validateImageFile(file)
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).code).toBe("INVALID_FILE_TYPE")
    }
  })

  it("rejects file over 5 MB", () => {
    const file = createFile("large.jpg", "image/jpeg", 6 * 1024 * 1024)
    expect(() => validateImageFile(file)).toThrow(AppError)
    expect(() => validateImageFile(file)).toThrow(/Arquivo muito grande/)
  })

  it("sets FILE_TOO_LARGE code for oversized file", () => {
    const file = createFile("large.jpg", "image/jpeg", 6 * 1024 * 1024)
    try {
      validateImageFile(file)
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).code).toBe("FILE_TOO_LARGE")
    }
  })

  it("accepts file exactly at 5 MB", () => {
    const file = createFile("exact.jpg", "image/jpeg", 5 * 1024 * 1024)
    expect(() => validateImageFile(file)).not.toThrow()
  })
})

describe("getStoragePathFromUrl", () => {
  const bucket = "imagens-projetos"

  it("extracts path from valid Supabase storage URL", () => {
    const url = "https://abc.supabase.co/storage/v1/object/public/imagens-projetos/proj-123/image.jpg"
    expect(getStoragePathFromUrl(url, bucket)).toBe("proj-123/image.jpg")
  })

  it("returns null for URL without storage marker", () => {
    const url = "https://example.com/some/other/path.jpg"
    expect(getStoragePathFromUrl(url, bucket)).toBeNull()
  })

  it("returns null for URL with different bucket", () => {
    const url = "https://abc.supabase.co/storage/v1/object/public/other-bucket/file.jpg"
    expect(getStoragePathFromUrl(url, bucket)).toBeNull()
  })

  it("decodes URL-encoded characters", () => {
    const url = "https://abc.supabase.co/storage/v1/object/public/imagens-projetos/proj%20123/image%20file.jpg"
    expect(getStoragePathFromUrl(url, bucket)).toBe("proj 123/image file.jpg")
  })

  it("handles nested paths", () => {
    const url = "https://abc.supabase.co/storage/v1/object/public/imagens-projetos/a/b/c/d.png"
    expect(getStoragePathFromUrl(url, bucket)).toBe("a/b/c/d.png")
  })
})
