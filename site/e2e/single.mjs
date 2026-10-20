import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1000, height: 800 } })).newPage()
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
p.on('pageerror', (e) => errs.push(String(e)))
const url = pathToFileURL('C:/certificate/자격증공부.html').href
const ok = (n, c) => console.log(c ? 'PASS' : 'FAIL', n)
await p.goto(url); await p.waitForSelector('.dday', { timeout: 8000 })
ok('home', true)
await p.goto(url + '#/study/nw-ip'); await p.waitForSelector('article.md h1', { timeout: 8000 })
ok('chapter renders', (await p.locator('article.md table').count()) > 3)
await p.goto(url + '#/run/lm/exam/LM-20210313'); await p.waitForSelector('.q-stem', { timeout: 8000 })
await p.locator('.opt').nth(1).click()
ok('explanation shows', (await p.locator('.explain').count()) === 1)
await p.goto(url + '#/mock'); await p.waitForTimeout(800)
ok('mock page', (await p.locator('body').innerText()).length > 50)
await p.goto(url + '#/me'); await p.waitForTimeout(800)
ok('no errors', errs.length === 0); if (errs.length) console.log(errs.slice(0, 3))
await b.close()
