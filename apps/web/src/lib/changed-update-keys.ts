/**
 * Retorna chaves de `updates` cujo valor difere de `previous`.
 * Evita várias linhas de auditoria quando o UI envia o objeto inteiro sem mudanças reais.
 */
export function getChangedUpdateKeys(
  updates: Record<string, unknown>,
  previous: Record<string, unknown> | null | undefined,
): string[] {
  if (!previous) return Object.keys(updates)
  const keys: string[] = []
  for (const key of Object.keys(updates)) {
    if (!Object.prototype.hasOwnProperty.call(updates, key)) continue
    if (valuesDiffer(updates[key], previous[key])) keys.push(key)
  }
  return keys
}

function valuesDiffer(a: unknown, b: unknown): boolean {
  if (a === b) return false
  if (a == null && b == null) return false
  if (a == null || b == null) return true
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)
  }
  if (typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) !== JSON.stringify(b)
  }
  return String(a) !== String(b)
}
