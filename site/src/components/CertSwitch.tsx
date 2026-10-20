import { CERTS, type Cert } from '../lib/types'

export function CertSwitch({ value, onChange }: { value: Cert; onChange: (c: Cert) => void }) {
  return (
    <div className="seg" role="group" aria-label="시험 선택">
      {(Object.keys(CERTS) as Cert[]).map((c) => (
        <button key={c} className="chip" aria-pressed={value === c} onClick={() => onChange(c)}>
          {CERTS[c].short}
        </button>
      ))}
    </div>
  )
}
