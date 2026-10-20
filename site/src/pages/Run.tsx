import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, recordAnswer, toggleBookmark } from '../lib/db'
import { examLabel, isCorrect } from '../lib/data'
import { shuffle } from '../lib/mock'
import { useCertData } from '../lib/useCertData'
import type { Cert, Question } from '../lib/types'
import { QuestionView } from '../components/QuestionView'

export default function Run() {
  const { cert = 'lm', kind = 'exam', key = '' } = useParams()
  const c = cert as Cert
  const nav = useNavigate()
  const { data, questions, loading } = useCertData(c)
  const srs = useLiveQuery(() => db.srs.where('cert').equals(c).toArray(), [c])
  const marks = useLiveQuery(() => db.bookmarks.where('cert').equals(c).toArray(), [c])
  const [seed] = useState(() => Math.random())
  const [idx, setIdx] = useState(0)
  const [picks, setPicks] = useState<Record<string, number>>({})

  const list = useMemo<Question[] | null>(() => {
    if (!questions || srs === undefined || marks === undefined) return null
    let r: Question[]
    if (kind === 'exam') r = questions.filter((q) => q.examId === key)
    else if (kind === 'subject') r = shuffle(questions.filter((q) => q.s === Number(key)))
    else if (kind === 'chapter') r = questions.filter((q) => q.c === key)
    else if (kind === 'bookmark') {
      const s = new Set(marks.map((m) => m.qid))
      r = questions.filter((q) => s.has(q.id))
    } else if (kind === 'due') {
      const due = new Set(srs.filter((x) => x.due <= Date.now()).map((x) => x.qid))
      r = shuffle(questions.filter((q) => due.has(q.id)))
    } else r = questions
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, kind, key, seed, srs === undefined, marks === undefined])

  useEffect(() => {
    setIdx(0)
    setPicks({})
  }, [kind, key, cert])

  if (loading || !list) return <div className="page empty">불러오는 중</div>
  if (!list.length)
    return (
      <div className="page">
        <div className="empty">풀 문제가 없습니다.</div>
        <Link className="btn block" to="/q">문제 목록으로</Link>
      </div>
    )
  const q = list[Math.min(idx, list.length - 1)]
  const picked = picks[q.id]
  const revealed = picked !== undefined
  const marked = marks?.some((m) => m.qid === q.id) ?? false
  const pick = (n: number) => {
    if (revealed) return
    setPicks({ ...picks, [q.id]: n })
    recordAnswer(q, isCorrect(q, n), 'study')
  }
  return (
    <div className="page">
      <div className="row between">
        <Link to="/q">← 목록</Link>
        <span className="muted">{idx + 1} / {list.length}</span>
        <button className="chip" aria-pressed={marked} onClick={() => toggleBookmark(q.id, c)}>
          {marked ? '★ 북마크' : '☆ 북마크'}
        </button>
      </div>
      <div className="bar" style={{ margin: '8px 0 12px' }}><i style={{ width: `${((idx + 1) / list.length) * 100}%` }} /></div>
      <QuestionView
        q={q}
        picked={picked}
        reveal={revealed}
        onPick={pick}
        subjectName={data?.subjects[String(q.s)]}
        dateLabel={examLabel(q.date)}
      />
      <div className="nav-bar">
        <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>이전</button>
        {idx < list.length - 1 ? (
          <button className="btn primary" onClick={() => setIdx(idx + 1)}>{revealed ? '다음' : '건너뛰기'}</button>
        ) : (
          <button className="btn primary" onClick={() => nav('/q')}>끝내기</button>
        )}
      </div>
    </div>
  )
}
