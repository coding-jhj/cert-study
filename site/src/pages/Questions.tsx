import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { examLabel } from '../lib/data'
import { useToc } from '../lib/toc'
import { useCertData } from '../lib/useCertData'
import { useCertChoice } from '../lib/store'
import { CertSwitch } from '../components/CertSwitch'

export default function Questions() {
  const [cert, setCert] = useCertChoice()
  const { data } = useCertData(cert)
  const toc = useToc()
  const bm = useLiveQuery(() => db.bookmarks.where('cert').equals(cert).count(), [cert]) ?? 0
  const due = useLiveQuery(() => db.srs.where('cert').equals(cert).and((r) => r.due <= Date.now()).count(), [cert]) ?? 0
  const attempts = useLiveQuery(() => db.attempts.where('cert').equals(cert).toArray(), [cert]) ?? []
  const solved = new Map<string, boolean>()
  for (const a of attempts) solved.set(a.qid, a.ok)
  return (
    <div className="page">
      <h1>문제</h1>
      <CertSwitch value={cert} onChange={setCert} />
      <div className="grid2">
        <Link className="btn" to={`/run/${cert}/bookmark`}>북마크 {bm}개</Link>
        <Link className="btn" to={`/run/${cert}/due`}>복습할 오답 {due}개</Link>
      </div>
      <h2>과목별</h2>
      <div className="seg">
        {Object.entries(data?.subjects ?? {}).map(([s, name]) => (
          <Link key={s} className="chip" to={`/run/${cert}/subject/${s}`}>{s}과목 {name}</Link>
        ))}
      </div>
      <h2>장별</h2>
      <div className="seg">
        {(toc?.chapters ?? []).filter((c) => c.cert === cert).map((c) => (
          <Link key={c.id} className="chip" to={`/run/${cert}/chapter/${c.id}`}>{c.title}</Link>
        ))}
      </div>
      <h2>회차별 기출</h2>
      {[...(data?.exams ?? [])].reverse().map((e) => {
        const done = e.q.filter((q) => solved.has(`${e.id}#${q.n}`))
        const right = done.filter((q) => solved.get(`${e.id}#${q.n}`)).length
        return (
          <Link key={e.id} className="card link" to={`/run/${cert}/exam/${e.id}`}>
            <div className="row between">
              <span>{examLabel(e.date)} 시행</span>
              <span className="muted">{done.length ? `${done.length}/${e.count} 풀이 · 정답 ${right}` : `${e.count}문제`}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
