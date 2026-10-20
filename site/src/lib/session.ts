import type { Cert } from './types'

export interface MockSession {
  cert: Cert
  label: string
  qids: string[]
  answers: Record<string, number>
  flags: string[]
  startedAt: number
  minutes: number
}
const KEY = 'mockSession'
export const loadSession = (): MockSession | null => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as MockSession) : null
  } catch {
    return null
  }
}
export const saveSession = (s: MockSession) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}
export const clearSession = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
