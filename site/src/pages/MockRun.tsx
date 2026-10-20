import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, recordAnswer } from '../lib/db'
import { gradeMock } from '../lib/mock'
import { isCorrect } from '../lib/data'
import { useCertData } from '../lib/useCertData'
import { clearSession, loadSession, saveSession, type MockSession } from '../lib/session'
import { QuestionView } from '../components/QuestionView'

export default function MockRun() {
  const nav = useNavigate()
  const [sess, setSess] = useState<MockSession | null>(() => loadSession())
  const [idx, setIdx] = useState(0)
  const [now, setNow] = useState(Date.now())
  const { data, questions } = useCertData(sess?.cert ?? 'lm')

  const list = useMemo(() => {
    if (!sess || !questions) return null
    const m = new Map(questions.map((q) => [q.id, q]))
    return sess.qids.map((id) => m.get(id)!).filter(Boolean)
  }, [sess, questions])

  const endAt = sess ? sess.startedAt + sess.minutes * 60000 : 0
  const left = Math.max(0, endAt - now)

  const finish = async (s: MockSession) => {
    if (!list) return
    const res = gradeMock(s.cert, list, s.answers, s.label)
    const id = await db.mocks.add(res)
    for (const q of list) {
      const a = s.answers[q.id]
      await recordAnswer(q, a !== undefined && isCorrect(q, a), 'mock')
    }
    clearSession()
    nav(`/mock/result/${id}`, { replace: true })
  }

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (sess && list && left === 0) void finish(sess)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left === 0, list])

  if (!sess)
    return (
      <div className="page">
        <div className="empty">진행 중인 모의고사가 없습니다.</div>
        <Link className="btn block" to="/mock">
          모의고사 시작하기
        </Link>
      </div>
    )
  if (!list) return <div className="page empty">불러오는 중</div>

  const q = list[idx]
  const update = (next: MockSession) => {
    setSess(next)
    saveSession(next)
  }
  const mm = String(Math.floor(left / 60000)).padStart(2, '0')
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0')
  const answered = Object.keys(sess.answers).length
  const flagged = sess.flags.includes(q.id)
  return (
    <div className="page">
      <div className="row between">
        <span className="muted">{sess.label}</span>
        <span className={`timer ${left < 300000 ? 'low' : ''}`}>
          {mm}:{ss}
        </span>
      </div>
      <div className="palette">
        {list.map((x, i) => (
          <button
            key={x.id}
            className={[
              sess.answers[x.id] !== undefined ? 'done' : '',
              sess.flags.includes(x.id) ? 'flag' : '',
              i === idx ? 'cur' : '',
            ].join(' ')}
            onClick={() => setIdx(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <QuestionView
        q={q}
        picked={sess.answers[q.id]}
        reveal={false}
        onPick={(n) => update({ ...sess, answers: { ...sess.answers, [q.id]: n } })}
        subjectName={data?.subjects[String(q.s)]}
      />
      <div className="row wrap">
        <button
          className="chip"
          aria-pressed={flagged}
          onClick={() =>
            update({
              ...sess,
              flags: flagged ? sess.flags.filter((f) => f !== q.id) : [...sess.flags, q.id],
            })
          }
        >
          {flagged ? '⚑ 나중에 볼 문제' : '⚐ 나중에 볼 문제로 표시'}
        </button>
        <span className="muted">
          {answered} / {list.length} 답함
        </span>
      </div>
      <div className="nav-bar">
        <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          이전
        </button>
        {idx < list.length - 1 ? (
          <button className="btn primary" onClick={() => setIdx(idx + 1)}>
            다음
          </button>
        ) : (
          <button
            className="btn primary"
            onClick={() => {
              if (
                answered === list.length ||
                window.confirm(`안 푼 문제가 ${list.length - answered}개 있습니다. 제출할까요?`)
              )
                void finish(sess)
            }}
          >
            제출
          </button>
        )}
      </div>
      <button
        className="btn block"
        onClick={() => {
          if (window.confirm('지금까지의 답으로 제출합니다.')) void finish(sess)
        }}
      >
        지금 제출하기
      </button>
    </div>
  )
}
