import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { useToc } from '../lib/toc'
import { useCertData } from '../lib/useCertData'
import { useCertChoice } from '../lib/store'
import { CertSwitch } from '../components/CertSwitch'

export default function Study() {
  const [cert, setCert] = useCertChoice()
  const toc = useToc()
  const { data, questions } = useCertData(cert)
  const reads = useLiveQuery(() => db.reads.toArray(), []) ?? []
  const done = new Set(reads.map((r) => r.chapter))
  const count: Record<string, number> = {}
  for (const q of questions ?? []) if (q.c) count[q.c] = (count[q.c] ?? 0) + 1
  const chapters = (toc?.chapters ?? []).filter((c) => c.cert === cert)
  return (
    <div className="page">
      <h1>학습</h1>
      <CertSwitch value={cert} onChange={setCert} />
      {Object.entries(data?.subjects ?? {}).map(([s, name]) => (
        <section key={s}>
          <h2>{s}과목 {name}</h2>
          {chapters
            .filter((c) => c.subject === Number(s))
            .map((c) => (
              <Link key={c.id} className="card link" to={`/study/${c.id}`}>
                <div className="row between">
                  <span>{done.has(c.id) ? '✓ ' : ''}{c.title}</span>
                  <span className="muted">기출 {count[c.id] ?? 0}문제</span>
                </div>
              </Link>
            ))}
        </section>
      ))}
    </div>
  )
}
