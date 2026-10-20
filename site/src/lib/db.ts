import Dexie, { type EntityTable } from 'dexie'
import type { Cert } from './types'

export interface Attempt {
  id?: number
  qid: string
  cert: Cert
  s: number
  ok: boolean
  at: number
  mode: 'study' | 'mock'
}
export interface Srs {
  qid: string
  cert: Cert
  box: number
  due: number
}
export interface Bookmark {
  qid: string
  cert: Cert
}
export interface MockResult {
  id?: number
  cert: Cert
  label: string
  at: number
  correct: number
  total: number
  score: number
  pass: boolean
  subjects: Record<number, { correct: number; total: number }>
  failedSubjects: number[]
  wrong: string[]
}
export interface ChapterRead {
  chapter: string
  at: number
}

class StudyDB extends Dexie {
  attempts!: EntityTable<Attempt, 'id'>
  srs!: EntityTable<Srs, 'qid'>
  bookmarks!: EntityTable<Bookmark, 'qid'>
  mocks!: EntityTable<MockResult, 'id'>
  reads!: EntityTable<ChapterRead, 'chapter'>

  constructor() {
    super('study')
    this.version(1).stores({
      attempts: '++id, qid, cert, at',
      srs: 'qid, cert, due',
      bookmarks: 'qid, cert',
      mocks: '++id, cert, at',
      reads: 'chapter',
    })
  }
}
export const db = new StudyDB()

const DAY = 86400000
const INTERVALS = [0, 1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY]

/** Leitner: a wrong answer sends the card back to box 0 (due now), a right answer on a due card moves it up. */
export async function recordAnswer(
  q: { id: string; cert: Cert; s: number },
  ok: boolean,
  mode: 'study' | 'mock',
) {
  const now = Date.now()
  await db.attempts.add({ qid: q.id, cert: q.cert, s: q.s, ok, at: now, mode })
  const cur = await db.srs.get(q.id)
  if (!ok) {
    await db.srs.put({ qid: q.id, cert: q.cert, box: 0, due: now })
  } else if (cur && cur.due <= now) {
    const box = Math.min(cur.box + 1, INTERVALS.length - 1)
    await db.srs.put({ ...cur, box, due: now + INTERVALS[box] })
  }
}

export async function toggleBookmark(qid: string, cert: Cert) {
  if (await db.bookmarks.get(qid)) await db.bookmarks.delete(qid)
  else await db.bookmarks.put({ qid, cert })
}

export async function exportAll() {
  const [attempts, srs, bookmarks, mocks, reads] = await Promise.all([
    db.attempts.toArray(),
    db.srs.toArray(),
    db.bookmarks.toArray(),
    db.mocks.toArray(),
    db.reads.toArray(),
  ])
  return JSON.stringify({ v: 1, at: Date.now(), attempts, srs, bookmarks, mocks, reads })
}

export async function importAll(text: string) {
  const d = JSON.parse(text)
  if (d?.v !== 1) throw new Error('지원하지 않는 파일입니다.')
  await db.transaction('rw', [db.attempts, db.srs, db.bookmarks, db.mocks, db.reads], async () => {
    await Promise.all([db.attempts.clear(), db.srs.clear(), db.bookmarks.clear(), db.mocks.clear(), db.reads.clear()])
    await db.attempts.bulkAdd(d.attempts ?? [])
    await db.srs.bulkPut(d.srs ?? [])
    await db.bookmarks.bulkPut(d.bookmarks ?? [])
    await db.mocks.bulkAdd(d.mocks ?? [])
    await db.reads.bulkPut(d.reads ?? [])
  })
}
