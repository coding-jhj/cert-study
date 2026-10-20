import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const srv = spawn('npx', ['vite', 'preview', '--port', '4175', '--strictPort'], { shell: true, stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 4000))
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 1 })
const p = await ctx.newPage()
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
p.on('pageerror', (e) => errs.push(String(e)))
const base = 'http://localhost:4175/'
await p.goto(base + '#/study'); await p.waitForTimeout(1500)
await p.screenshot({ path: '../_src/shot_study.png' })
const toc = await (await fetch(base + 'data/toc.json')).json()
const links = toc.chapters.map((c) => '#/study/' + c.id)
console.log('chapter links', links.length)
let bad = 0
for (const h of links) {
  await p.goto(base + h.replace(/^.*#/, '#')); await p.waitForTimeout(700)
  const text = await p.locator('body').innerText()
  const h1 = await p.locator('h1').count()
  const tables = await p.locator('table').count()
  const raw = /\*\*|<div|<strong|\|---/.test(text)
  if (!h1 || text.length < 800 || raw) { bad++; console.log('CHECK', h, 'h1', h1, 'len', text.length, 'raw', raw, 'tables', tables) }
}
console.log('bad chapters', bad, 'errors', errs.length)
await p.goto(base + links[0].replace(/^.*#/, '#')); await p.waitForTimeout(800)
await p.screenshot({ path: '../_src/shot_chapter.png', fullPage: false })
await b.close(); srv.kill(); process.exit(0)
