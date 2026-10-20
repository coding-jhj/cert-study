import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { CERTS, type Cert } from '../lib/types'
import { daysLeft } from '../lib/data'
import { useCertData } from '../lib/useCertData'

function CertCard({ cert }: { cert: Cert }) {
  const info = CERTS[cert]
  const { data } = useCertData(cert)
  const left = daysLeft(info.examDate)
  const due = useLiveQuery(() => db.srs.where('cert').equals(cert).and((r) => r.due <= Date.now()).count(), [cert]) ?? 0
  const attempts = useLiveQuery(() => db.attempts.where('cert').equals(cert).toArray(), [cert]) ?? []
  const bySubject: Record<number, { ok: number; all: number }> = {}
  for (const a of attempts) {
    const s = (bySubject[a.s] ??= { ok: 0, all: 0 })
    s.all++
    if (a.ok) s.ok++
  }
  const rows = Object.entries(data?.subjects ?? {}).map(([k, name]) => {
    const s = bySubject[Number(k)]
    return { k: Number(k), name, pct: s && s.all ? Math.round((s.ok / s.all) * 100) : null, all: s?.all ?? 0 }
  })
  const weak = rows.filter((r) => r.all >= 5 && r.pct !== null).sort((a, b) => a.pct! - b.pct!)[0]
  return (
    <div className="card">
      <div className="row between">
        <div>
          <div className="muted">{info.name}</div>
          <div className="dday">{left > 0 ? `D-${left}` : left === 0 ? 'D-DAY' : `D+${-left}`}</div>
        </div>
        <div className="muted">{info.examDate.replaceAll('-', '.')} 시험</div>
      </div>
      <div style={{ margin: '12px 0' }}>
        {rows.map((r) => (
          <div key={r.k} style={{ margin: '8px 0' }}>
            <div className="row between muted">
              <span>{r.k}과목 {r.name}</span>
              <span>{r.pct === null ? '아직 풀이 없음' : `${r.pct}% (${r.all}문제)`}</span>
            </div>
            <div className={`bar ${r.pct !== null && r.pct < 60 ? 'bad' : ''}`}>
              <i style={{ width: `${r.pct ?? 0}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid2">
        <Link className="btn primary" to={`/run/${cert}/due`}>오늘 복습 {due}개</Link>
        <Link className="btn" to={`/mock/${cert}`}>모의고사</Link>
      </div>
      {weak && (
        <p className="muted">
          약점: {weak.k}과목 {weak.name} ({weak.pct}%) ·{' '}
          <Link to={`/run/${cert}/subject/${weak.k}`}>이 과목 풀기</Link>
        </p>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <div className="page">
      <h1>오늘의 공부</h1>
      <CertCard cert="lm" />
      <CertCard cert="nw" />
    </div>
  )
}
