import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildRandomMock, gradeMock } from './mock'
import { isCorrect } from './data'
import type { CertData, Question } from './types'

const load = (c: 'lm' | 'nw'): Question[] => {
  const d = JSON.parse(readFileSync(`public/data/${c}.json`, 'utf8')) as CertData
  return d.exams.flatMap((e) => e.q.map((q) => ({ ...q, id: `${e.id}#${q.n}`, cert: c, examId: e.id, date: e.date })))
}

describe('data', () => {
  it('has all questions', () => {
    expect(load('lm')).toHaveLength(720)
    expect(load('nw')).toHaveLength(550)
  })
  it('accepts alternative answers', () => {
    const q = load('lm').find((x) => x.ok)!
    for (const n of q.ok!) expect(isCorrect(q, n)).toBe(true)
  })
  it('has no working fields in public data', () => {
    for (const c of ['lm', 'nw'] as const)
      for (const q of load(c)) {
        expect(q).not.toHaveProperty('fix')
        expect(q).not.toHaveProperty('note')
        expect(q).not.toHaveProperty('ex')
      }
  })
})

describe('random mock', () => {
  it('lm: 48 + 32, no repeated question groups', () => {
    const qs = load('lm')
    const m = buildRandomMock('lm', qs, new Set(), new Set())
    expect(m).toHaveLength(80)
    expect(m.filter((q) => q.s === 1)).toHaveLength(48)
    expect(m.filter((q) => q.s === 2)).toHaveLength(32)
    const g = m.map((q) => q.g).filter(Boolean)
    expect(new Set(g).size).toBe(g.length)
  })
  it('nw: 17/10/18/5', () => {
    const m = buildRandomMock('nw', load('nw'), new Set(), new Set())
    expect([1, 2, 3, 4].map((s) => m.filter((q) => q.s === s).length)).toEqual([17, 10, 18, 5])
  })
  it('prefers wrong questions', () => {
    const qs = load('lm')
    const wrong = new Set(qs.filter((q) => q.s === 1).slice(0, 48).map((q) => q.id))
    const m = buildRandomMock('lm', qs, new Set(), wrong)
    const pickedWrong = m.filter((q) => wrong.has(q.id)).length
    expect(pickedWrong).toBeGreaterThan(30)
  })
})

describe('grading', () => {
  const qs = load('lm')
  const set = qs.filter((q) => q.s === 1).slice(0, 48).concat(qs.filter((q) => q.s === 2).slice(0, 32))
  it('subject fail below 40 percent even if total passes', () => {
    const ans: Record<string, number> = {}
    set.filter((q) => q.s === 1).slice(0, 19).forEach((q) => (ans[q.id] = q.a))
    set.filter((q) => q.s === 2).forEach((q) => (ans[q.id] = q.a))
    const r = gradeMock('lm', set, ans, 't')
    expect(r.score).toBe(63.8)
    expect(r.failedSubjects).toEqual([1])
    expect(r.pass).toBe(false)
  })
  it('passes at 20 correct in subject 1', () => {
    const ans: Record<string, number> = {}
    set.filter((q) => q.s === 1).slice(0, 20).forEach((q) => (ans[q.id] = q.a))
    set.filter((q) => q.s === 2).forEach((q) => (ans[q.id] = q.a))
    const r = gradeMock('lm', set, ans, 't')
    expect(r.pass).toBe(true)
  })
  it('nw has no subject fail but needs 60', () => {
    const nq = load('nw').slice(0, 50)
    const ans: Record<string, number> = {}
    nq.slice(0, 29).forEach((q) => (ans[q.id] = q.a))
    expect(gradeMock('nw', nq, ans, 't').pass).toBe(false)
    nq.slice(0, 30).forEach((q) => (ans[q.id] = q.a))
    expect(gradeMock('nw', nq, ans, 't').pass).toBe(true)
  })
})
