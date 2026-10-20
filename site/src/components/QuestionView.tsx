import type { Question } from '../lib/types'
import { isCorrect } from '../lib/data'

interface Props {
  q: Question
  picked?: number
  reveal: boolean
  onPick: (n: number) => void
  subjectName?: string
  dateLabel?: string
}

export function QuestionView({ q, picked, reveal, onPick, subjectName, dateLabel }: Props) {
  return (
    <div>
      <div className="q-meta">
        {dateLabel && <span>{dateLabel}</span>}
        <span>{q.n}번</span>
        {subjectName && <span>{subjectName}</span>}
      </div>
      <div className="q-stem">{q.t}</div>
      {q.box && <div className="q-box">{q.box}</div>}
      {q.fig && <div className="q-fig">{q.fig}</div>}
      {q.o.map((text, i) => {
        const n = i + 1
        let cls = 'opt'
        if (reveal) {
          if (isCorrect(q, n)) cls += ' right'
          else if (picked === n) cls += ' wrong'
        } else if (picked === n) cls += ' picked'
        return (
          <button key={n} className={cls} onClick={() => onPick(n)} disabled={reveal}>
            <span className="no">{'①②③④'[i]}</span>
            <span className="tx">{text}</span>
          </button>
        )
      })}
      {reveal && picked !== undefined && (
        <p className={`verdict ${isCorrect(q, picked) ? 'ok' : 'bad'}`}>
          {isCorrect(q, picked) ? '정답입니다.' : `오답입니다. 정답은 ${'①②③④'[q.a - 1]}번입니다.`}
        </p>
      )}
      {reveal && q.e && <Explain text={q.e} />}
    </div>
  )
}

function Explain({ text }: { text: string }) {
  const [head, ...rest] = text.split('\n')
  const items = rest.map((l) => l.replace(/^-\s*/, '')).filter(Boolean)
  return (
    <div className="explain">
      <p className="ex-head">{head}</p>
      {items.length > 0 && (
        <ul>
          {items.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
