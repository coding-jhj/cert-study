import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { CERTS, type Cert } from '../lib/types'
import { useCertData } from '../lib/useCertData'

export default function MockResult() {
  const id = Number(useParams().id)
  const r = useLiveQuery(() => db.mocks.get(id), [id])
  const { data } = useCertData(r?.cert ?? 'lm')
  const [open, setOpen] = useState(false)
  const wrongs = r?.wrong ?? []
  if (!r) return <div className="page empty">불러오는 중</div>
  const info = CERTS[r.cert]
  return (
    <div className="page">
      <h1>{r.label} 결과</h1>
      <div className="card">
        <div className="dday" style={{ color: r.pass ? 'var(--ok)' : 'var(--bad)' }}>
          {r.score}점
        </div>
        <p className={r.pass ? 'verdict ok' : 'verdict bad'}>
          {r.pass
            ? '합격'
            : r.failedSubjects.length
              ? `과락 (${r.failedSubjects.map((s) => `${s}과목`).join(', ')})`
              : '불합격 (60점 미만)'}
        </p>
        <p className="muted">
          {r.correct} / {r.total} 정답 · 합격선 60점{info.mock.subjectFail ? ', 과목별 40% 이상' : ''}
        </p>
        {Object.entries(r.subjects).map(([s, v]) => (
          <div key={s} style={{ margin: '8px 0' }}>
            <div className="row between muted">
              <span>
                {s}과목 {data?.subjects[s]}
              </span>
              <span>
                {v.correct} / {v.total} ({Math.round((v.correct / v.total) * 100)}%)
              </span>
            </div>
            <div className={`bar ${r.failedSubjects.includes(Number(s)) ? 'bad' : ''}`}>
              <i style={{ width: `${(v.correct / v.total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="muted">틀린 {wrongs.length}문제는 오답노트에 자동으로 저장되었습니다.</p>
      <button className="btn block" onClick={() => setOpen(!open)}>
        {open ? '틀린 문제 접기' : '틀린 문제 보기'}
      </button>
      {open && <WrongList qids={wrongs} cert={r.cert} />}
      <div className="grid2" style={{ marginTop: 12 }}>
        <Link className="btn primary" to={`/run/${r.cert}/due`}>
          오답 복습
        </Link>
        <Link className="btn" to={`/mock/${r.cert}`}>
          모의고사 목록
        </Link>
      </div>
    </div>
  )
}

function WrongList({ qids, cert }: { qids: string[]; cert: Cert }) {
  const { questions } = useCertData(cert)
  const set = new Set(qids)
  return (
    <div>
      {(questions ?? [])
        .filter((q) => set.has(q.id))
        .map((q) => (
          <div key={q.id} className="card">
            <div className="muted">
              {q.date} {q.n}번
            </div>
            <div className="q-stem">{q.t}</div>
            <div>
              정답: {'①②③④'[q.a - 1]} {q.o[q.a - 1]}
            </div>
            {q.e && <div className="explain">{q.e}</div>}
          </div>
        ))}
    </div>
  )
}
