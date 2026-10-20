import { CERTS, type Cert, type Question } from './types'
import { isCorrect } from './data'
import type { MockResult } from './db'

export function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

/** Random mock: subject counts match the real exam; unseen / wrong questions first; no repeats of the same question. */
export function buildRandomMock(
  cert: Cert,
  all: Question[],
  seen: Set<string>,
  wrong: Set<string>,
): Question[] {
  const { perSubject } = CERTS[cert].mock
  const picked: Question[] = []
  const usedGroups = new Set<string>()
  for (const [sub, need] of Object.entries(perSubject)) {
    const pool = shuffle(all.filter((q) => q.s === Number(sub)))
    const rank = (q: Question) => (wrong.has(q.id) ? 0 : seen.has(q.id) ? 2 : 1)
    pool.sort((a, b) => rank(a) - rank(b))
    let got = 0
    for (const q of pool) {
      if (got >= need) break
      if (q.g && usedGroups.has(q.g)) continue
      if (q.g) usedGroups.add(q.g)
      picked.push(q)
      got++
    }
  }
  return picked
}

export function gradeMock(
  cert: Cert,
  questions: Question[],
  answers: Record<string, number>,
  label: string,
): Omit<MockResult, 'id'> {
  const info = CERTS[cert]
  const subjects: Record<number, { correct: number; total: number }> = {}
  let correct = 0
  const wrong: string[] = []
  for (const q of questions) {
    const s = (subjects[q.s] ??= { correct: 0, total: 0 })
    s.total++
    if (answers[q.id] !== undefined && isCorrect(q, answers[q.id])) {
      s.correct++
      correct++
    } else wrong.push(q.id)
  }
  const total = questions.length
  const score = Math.round((correct / total) * 1000) / 10
  const failedSubjects = info.mock.subjectFail
    ? Object.entries(subjects)
        .filter(([, v]) => v.correct / v.total < 0.4)
        .map(([k]) => Number(k))
    : []
  return {
    cert,
    label,
    at: Date.now(),
    correct,
    total,
    score,
    pass: score >= 60 && failedSubjects.length === 0,
    subjects,
    failedSubjects,
    wrong,
  }
}
