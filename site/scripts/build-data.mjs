// Build public site data from ../data (private working files).
// Strips working fields (fix, note, ex), merges own explanations (../content/expl) and chapter mapping.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const out = join(root, 'site', 'public', 'data')
mkdirSync(out, { recursive: true })

const norm = (s) => (s ?? '').replace(/[\s'"`.,;:!?()\[\]{}<>*_-]/g, '').toLowerCase()
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8)

const chapterMap = existsSync(join(root, 'content', 'chapter-map.json'))
  ? JSON.parse(readFileSync(join(root, 'content', 'chapter-map.json'), 'utf8'))
  : {}

const index = {}
for (const cert of ['lm', 'nw']) {
  const dir = join(root, 'data', cert)
  const exams = []
  let subjects = {}
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const d = JSON.parse(readFileSync(join(dir, f), 'utf8'))
    subjects = d.subjects
    const explFile = join(root, 'content', 'expl', `${d.id}.json`)
    const expl = existsSync(explFile) ? JSON.parse(readFileSync(explFile, 'utf8')) : {}
    const q = d.q.map((x) => {
      const id = `${d.id}#${x.n}`
      const r = { n: x.n, s: x.s, t: x.t }
      if (x.box) r.box = x.box
      if (x.fig) r.fig = x.fig
      r.o = x.o
      r.a = x.a
      if (x.ok) r.ok = x.ok
      if (expl[x.n]) r.e = expl[x.n]
      if (chapterMap[id]) r.c = chapterMap[id]
      r.g = hash(norm(x.t) + '|' + [...x.o].map(norm).sort().join('|'))
      return r
    })
    exams.push({ id: d.id, date: d.date, count: d.count, q })
  }
  // keep group tag only where the same question appears more than once
  const cnt = {}
  for (const e of exams) for (const x of e.q) cnt[x.g] = (cnt[x.g] || 0) + 1
  for (const e of exams) for (const x of e.q) if (cnt[x.g] < 2) delete x.g
  writeFileSync(join(out, `${cert}.json`), JSON.stringify({ cert, subjects, exams }))
  index[cert] = { subjects, exams: exams.map((e) => ({ id: e.id, date: e.date, count: e.count })) }
  console.log(cert, exams.length, 'exams', exams.reduce((a, e) => a + e.q.length, 0), 'questions', Object.values(cnt).filter((v) => v > 1).length, 'repeat groups')
}
writeFileSync(join(out, 'index.json'), JSON.stringify(index))

// chapter table of contents + chapter texts
import { copyFileSync } from 'node:fs'
copyFileSync(join(root, 'content', 'toc.json'), join(out, 'toc.json'))
const cdir = join(root, 'site', 'public', 'content')
mkdirSync(cdir, { recursive: true })
for (const cert of ['lm', 'nw']) {
  const d = join(root, 'content', cert)
  if (!existsSync(d)) continue
  for (const f of readdirSync(d).filter((x) => x.endsWith('.md'))) copyFileSync(join(d, f), join(cdir, `${cert}-${f}`))
}
