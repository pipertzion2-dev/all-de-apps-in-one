import { Color } from 'three'

export function cssVarColor(varName, fallback = '#2563eb') {
  if (typeof document === 'undefined') return new Color(fallback)
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  if (!raw) return new Color(fallback)
  try {
    return new Color(raw)
  } catch {
    return new Color(fallback)
  }
}
