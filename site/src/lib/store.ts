import { useEffect, useState } from 'react'
import type { Cert } from './types'

export function useLocal<T>(key: string, init: T): [T, (v: T) => void] {
  const [v, set] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : init
    } catch {
      return init
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* storage blocked: keep in memory */
    }
  }, [key, v])
  return [v, set]
}

export const useTheme = () => {
  const [theme, setTheme] = useLocal<'auto' | 'light' | 'dark'>('theme', 'auto')
  useEffect(() => {
    const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [theme])
  return [theme, setTheme] as const
}

export const useCertChoice = () => useLocal<Cert>('cert', 'lm')
