import type { Cert, CertData, Question } from './types'

const cache: Partial<Record<Cert, Promise<{ data: CertData; questions: Question[] }>>> = {}

export function loadCert(cert: Cert) {
  cache[cert] ??= fetch(`${import.meta.env.BASE_URL}data/${cert}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`data load failed: ${cert}`)
      return r.json() as Promise<CertData>
    })
    .then((data) => ({
      data,
      questions: data.exams.flatMap((e) =>
        e.q.map((q): Question => ({ ...q, id: `${e.id}#${q.n}`, cert, examId: e.id, date: e.date })),
      ),
    }))
  return cache[cert]!
}

export const isCorrect = (q: Pick<Question, 'a' | 'ok'>, pick: number) =>
  pick === q.a || (q.ok?.includes(pick) ?? false)

export const examLabel = (date: string) => {
  const [y, m, d] = date.split('-')
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}

export function daysLeft(date: string, now = new Date()) {
  const t = new Date(`${date}T00:00:00`)
  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((t.getTime() - n.getTime()) / 86400000)
}
