import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, exportAll, importAll } from '../lib/db'
import { examLabel } from '../lib/data'
import { useCertData } from '../lib/useCertData'
import { useCertChoice, useTheme } from '../lib/store'
import { CertSwitch } from '../components/CertSwitch'
import type { Question } from '../lib/types'

type Tab = 'wrong' | 'stats' | 'freq' | 'search' | 'settings'
const TABS: [Tab, string][] = [
  ['wrong', '오답노트'],
  ['stats', '통계'],
  ['freq', '자주 나오는 문제'],
  ['search', '검색'],
  ['settings', '설정'],
]

export default function Me() {
  const [tab, setTab] = useState<Tab>('wrong')
  const [cert, setCert] = useCertChoice()
  return (
    <div className="page">
      <h1>내 기록</h1>
      <CertSwitch value={cert} onChange={setCert} />
      <div className="seg">
        {TABS.map(([k, label]) => (
          <button key={k} className="chip" aria-pressed={tab === k} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'wrong' && <Wrong cert={cert} />}
      {tab === 'stats' && <Stats cert={cert} />}
      {tab === 'freq' && <Freq cert={cert} />}
      {tab === 'search' && <Search cert={cert} />}
      {tab === 'settings' && <Settings />}
    </div>
  )
}

function Wrong({ cert }: { cert: 'lm' | 'nw' }) {
  const { questions } = useCertData(cert)
  const srs = useLiveQuery(() => db.srs.where('cert').equals(cert).sortBy('due'), [cert]) ?? []
  const map = new Map((questions ?? []).map((q) => [q.id, q]))
  const now = Date.now()
  const dueCount = srs.filter((s) => s.due <= now).length
  if (!srs.length) return <div className="empty">틀린 문제가 아직 없습니다.</div>
  return (
    <div>
      <Link className="btn primary block" to={`/run/${cert}/due`}>
        지금 복습할 {dueCount}문제 풀기
      </Link>
      {srs.map((s) => {
        const q = map.get(s.qid)
        if (!q) return null
        const due = s.due <= now
        return (
          <Link key={s.qid} className="card link" to={`/run/${cert}/exam/${q.examId}`}>
            <div className="row between muted">
              <span>
                {examLabel(q.date)} {q.n}번
              </span>
              <span>{due ? '복습할 차례' : `${Math.ceil((s.due - now) / 86400000)}일 뒤`}</span>
            </div>
            <div>{q.t}</div>
          </Link>
        )
      })}
    </div>
  )
}

function Stats({ cert }: { cert: 'lm' | 'nw' }) {
  const { data } = useCertData(cert)
  const attempts = useLiveQuery(() => db.attempts.where('cert').equals(cert).toArray(), [cert]) ?? []
  const days = useMemo(() => {
    const m = new Map<string, { n: number; ok: number }>()
    for (const a of attempts) {
      const d = new Date(a.at).toLocaleDateString('ko-KR')
      const x = m.get(d) ?? { n: 0, ok: 0 }
      x.n++
      if (a.ok) x.ok++
      m.set(d, x)
    }
    return [...m.entries()].reverse().slice(0, 14)
  }, [attempts])
  const bySub: Record<number, { n: number; ok: number }> = {}
  for (const a of attempts) {
    const x = (bySub[a.s] ??= { n: 0, ok: 0 })
    x.n++
    if (a.ok) x.ok++
  }
  if (!attempts.length) return <div className="empty">아직 푼 문제가 없습니다.</div>
  return (
    <div>
      <h2>과목별 정답률</h2>
      {Object.entries(data?.subjects ?? {}).map(([s, name]) => {
        const x = bySub[Number(s)]
        const pct = x ? Math.round((x.ok / x.n) * 100) : 0
        return (
          <div key={s} style={{ margin: '10px 0' }}>
            <div className="row between muted">
              <span>
                {s}과목 {name}
              </span>
              <span>{x ? `${pct}% (${x.ok}/${x.n})` : '풀이 없음'}</span>
            </div>
            <div className={`bar ${x && pct < 60 ? 'bad' : ''}`}>
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
      <h2>최근 14일</h2>
      {days.map(([d, x]) => (
        <div key={d} className="row between card">
          <span>{d}</span>
          <span className="muted">
            {x.n}문제 · 정답 {Math.round((x.ok / x.n) * 100)}%
          </span>
        </div>
      ))}
    </div>
  )
}

function Freq({ cert }: { cert: 'lm' | 'nw' }) {
  const { questions } = useCertData(cert)
  const groups = useMemo(() => {
    const m = new Map<string, Question[]>()
    for (const q of questions ?? []) if (q.g) m.set(q.g, [...(m.get(q.g) ?? []), q])
    return [...m.values()].sort((a, b) => b.length - a.length)
  }, [questions])
  return (
    <div>
      <p className="muted">같은 문제가 여러 회차에 반복 출제된 횟수입니다. 많이 나온 순서입니다.</p>
      {groups.slice(0, 60).map((g) => (
        <Link key={g[0].id} className="card link" to={`/run/${cert}/exam/${g[0].examId}`}>
          <div className="row between muted">
            <span>{g.length}회 출제</span>
            <span>{g.map((q) => q.date.slice(2, 7).replace('-', '.')).join(' · ')}</span>
          </div>
          <div>{g[0].t}</div>
        </Link>
      ))}
    </div>
  )
}

function Search({ cert }: { cert: 'lm' | 'nw' }) {
  const { questions } = useCertData(cert)
  const [text, setText] = useState('')
  const hits = useMemo(() => {
    const k = text.trim().toLowerCase()
    if (k.length < 2) return []
    return (questions ?? [])
      .filter((q) => [q.t, q.box, q.fig, q.e, ...q.o].some((s) => s?.toLowerCase().includes(k)))
      .slice(0, 50)
  }, [questions, text])
  return (
    <div>
      <input className="field" placeholder="문제·보기·해설에서 검색 (두 글자 이상)" value={text} onChange={(e) => setText(e.target.value)} />
      {hits.map((q) => (
        <Link key={q.id} className="card link" to={`/run/${cert}/exam/${q.examId}`}>
          <div className="muted">
            {examLabel(q.date)} {q.n}번
          </div>
          <div>{q.t}</div>
        </Link>
      ))}
      {text.trim().length >= 2 && hits.length === 0 && <div className="empty">결과가 없습니다.</div>}
    </div>
  )
}

function Settings() {
  const [theme, setTheme] = useTheme()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const doExport = async () => {
    const blob = new Blob([await exportAll()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `study-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg('내보냈습니다.')
  }
  const doImport = async (f: File) => {
    try {
      await importAll(await f.text())
      setMsg('가져왔습니다. 기존 기록은 파일의 기록으로 바뀌었습니다.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '가져오지 못했습니다.')
    }
  }
  return (
    <div>
      <h2>화면</h2>
      <div className="seg">
        {(
          [
            ['auto', '기기 설정'],
            ['light', '밝게'],
            ['dark', '어둡게'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} className="chip" aria-pressed={theme === k} onClick={() => setTheme(k)}>
            {label}
          </button>
        ))}
      </div>
      <h2>기록 옮기기</h2>
      <p className="muted">풀이 기록은 이 기기 안에만 저장됩니다. 폰과 PC 사이에서 옮기려면 파일로 내보내고 가져옵니다.</p>
      <div className="grid2">
        <button className="btn" onClick={doExport}>
          기록 내보내기
        </button>
        <button className="btn" onClick={() => file.current?.click()}>
          기록 가져오기
        </button>
      </div>
      <input
        ref={file}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])}
      />
      {msg && <p className="verdict">{msg}</p>}
    </div>
  )
}
