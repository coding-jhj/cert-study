export type Cert = 'lm' | 'nw'

export interface RawQuestion {
  n: number
  s: number
  t: string
  box?: string
  fig?: string
  o: string[]
  a: number
  ok?: number[]
  e?: string
  g?: string
  c?: string
}

export interface Exam {
  id: string
  date: string
  count: number
  q: RawQuestion[]
}

export interface CertData {
  cert: Cert
  subjects: Record<string, string>
  exams: Exam[]
}

export interface Question extends RawQuestion {
  id: string
  cert: Cert
  examId: string
  date: string
}

export interface CertInfo {
  cert: Cert
  name: string
  short: string
  examDate: string
  mock: { count: number; minutes: number; perSubject: Record<number, number>; subjectFail: boolean }
}

export const CERTS: Record<Cert, CertInfo> = {
  lm: {
    cert: 'lm',
    name: '리눅스마스터 2급',
    short: '리눅스마스터',
    examDate: '2026-10-31',
    mock: { count: 80, minutes: 100, perSubject: { 1: 48, 2: 32 }, subjectFail: true },
  },
  nw: {
    cert: 'nw',
    name: '네트워크관리사 2급',
    short: '네트워크관리사',
    examDate: '2026-11-01',
    mock: { count: 50, minutes: 50, perSubject: { 1: 17, 2: 10, 3: 18, 4: 5 }, subjectFail: false },
  },
}
