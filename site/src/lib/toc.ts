import { useEffect, useState } from 'react'
import { inlinedData } from './offline'
import type { Cert } from './types'

export interface Chapter {
  id: string
  cert: Cert
  subject: number
  title: string
}
export interface Toc {
  chapters: Chapter[]
}

let cache: Promise<Toc> | null = null
export const loadToc = () =>
  (cache ??= inlinedData('toc')
    ? Promise.resolve(inlinedData('toc') as Toc)
    : fetch(`${import.meta.env.BASE_URL}data/toc.json`).then((r) => r.json() as Promise<Toc>))

export function useToc() {
  const [toc, setToc] = useState<Toc | null>(null)
  useEffect(() => {
    loadToc().then(setToc, () => setToc({ chapters: [] }))
  }, [])
  return toc
}
