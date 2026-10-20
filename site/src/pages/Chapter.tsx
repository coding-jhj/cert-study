import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked } from 'marked'
import { db } from '../lib/db'
import { useToc } from '../lib/toc'

export default function Chapter() {
  const { chapter = '' } = useParams()
  const toc = useToc()
  const [html, setHtml] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    setHtml(null)
    setMissing(false)
    fetch(`${import.meta.env.BASE_URL}content/${chapter}.md`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => {
        setHtml(marked.parse(t, { async: false }) as string)
        db.reads.put({ chapter, at: Date.now() })
      })
      .catch(() => setMissing(true))
  }, [chapter])
  const list = toc?.chapters ?? []
  const me = list.find((c) => c.id === chapter)
  const sibs = list.filter((c) => c.cert === me?.cert)
  const idx = sibs.findIndex((c) => c.id === chapter)
  return (
    <div className="page">
      <p><Link to="/study">← 학습 목록</Link></p>
      {missing && <div className="empty">이 장의 내용은 아직 없습니다.</div>}
      {html && <article className="md" dangerouslySetInnerHTML={{ __html: html }} />}
      <h2>이 장의 기출</h2>
      <Link className="btn block" to={`/run/${me?.cert ?? 'lm'}/chapter/${chapter}`}>관련 기출 풀기</Link>
      <div className="nav-bar">
        {idx > 0 ? <Link className="btn" to={`/study/${sibs[idx - 1].id}`}>이전 장</Link> : <span className="btn" style={{ visibility: 'hidden' }} />}
        {idx >= 0 && idx < sibs.length - 1 ? <Link className="btn primary" to={`/study/${sibs[idx + 1].id}`}>다음 장</Link> : <span className="btn" style={{ visibility: 'hidden' }} />}
      </div>
    </div>
  )
}
