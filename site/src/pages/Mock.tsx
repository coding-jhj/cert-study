import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { CERTS, type Cert } from '../lib/types'
import { examLabel } from '../lib/data'
import { buildRandomMock } from '../lib/mock'
import { useCertData } from '../lib/useCertData'
import { useCertChoice } from '../lib/store'
import { CertSwitch } from '../components/CertSwitch'
import { saveSession } from '../lib/session'

export default function Mock() {
  const params = useParams()
  const [stored, setCert] = useCertChoice()
  const cert = (params.cert as Cert) ?? stored
  const info = CERTS[cert]
  const nav = useNavigate()
  const { data, questions } = useCertData(cert)
  const results = useLiveQuery(() => db.mocks.where('cert').equals(cert).reverse().sortBy('at'), [cert]) ?? []

  const start = async (kind: string) => {
    if (!questions || !data) return
    let list
    let label
    if (kind === 'random') {
      const att = await db.attempts.where('cert').equals(cert).toArray()
      const wrong = new Set((await db.srs.where('cert').equals(cert).toArray()).map((r) => r.qid))
      list = buildRandomMock(cert, questions, new Set(att.map((a) => a.qid)), wrong)
      label = '랜덤 모의고사'
    } else {
      list = questions.filter((q) => q.examId === kind)
      label = `${examLabel(list[0].date)} 기출`
    }
    saveSession({
      cert,
      label,
      qids: list.map((q) => q.id),
      answers: {},
      flags: [],
      startedAt: Date.now(),
      minutes: info.mock.minutes,
    })
    nav(`/mock/${cert}/run`)
  }

  return (
    <div className="page">
      <h1>모의고사</h1>
      <CertSwitch
        value={cert}
        onChange={(c) => {
          setCert(c)
          nav(`/mock/${c}`, { replace: true })
        }}
      />
      <div className="card">
        <p>
          <b>{info.name}</b>: {info.mock.count}문제, {info.mock.minutes}분, 60점 이상 합격
          {info.mock.subjectFail && ', 과목별 40% 미만이면 과락'}
        </p>
        <button className="btn primary block" onClick={() => start('random')} disabled={!questions}>
          랜덤 모의고사 시작
        </button>
        <p className="muted">과목별 문항 수는 실제 시험과 같게 맞추고, 안 푼 문제와 틀렸던 문제를 먼저 뽑습니다.</p>
      </div>
      <h2>기출 그대로 풀기</h2>
      {[...(data?.exams ?? [])].reverse().map((e) => (
        <button
          key={e.id}
          className="card link btn block"
          style={{ justifyContent: 'space-between' }}
          onClick={() => start(e.id)}
        >
          <span>{examLabel(e.date)} 시행</span>
          <span className="muted">{e.count}문제</span>
        </button>
      ))}
      <h2>지난 결과</h2>
      {results.length === 0 && <div className="empty">아직 본 모의고사가 없습니다.</div>}
      {results.map((r) => (
        <Link key={r.id} className="card link" to={`/mock/result/${r.id}`}>
          <div className="row between">
            <span>{r.label}</span>
            <span className={r.pass ? 'verdict ok' : 'verdict bad'}>
              {r.score}점 {r.pass ? '합격' : r.failedSubjects.length ? '과락' : '불합격'}
            </span>
          </div>
          <div className="muted">{new Date(r.at).toLocaleString('ko-KR')}</div>
        </Link>
      ))}
    </div>
  )
}
