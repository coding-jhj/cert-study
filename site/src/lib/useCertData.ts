import { useEffect, useState } from 'react'
import { loadCert } from './data'
import type { Cert, CertData, Question } from './types'

export function useCertData(cert: Cert) {
  const [state, setState] = useState<{ data: CertData; questions: Question[] } | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    setState(null)
    loadCert(cert).then(
      (r) => alive && setState(r),
      () => alive && setError(true),
    )
    return () => {
      alive = false
    }
  }, [cert])
  return { ...state, error, loading: !state && !error }
}
