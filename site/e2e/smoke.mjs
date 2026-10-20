import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const srv = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { shell: true, stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 4000))
const base = 'http://localhost:4173/'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
const ok = (c, msg) => { console.log(c ? 'PASS' : 'FAIL', msg); if (!c) process.exitCode = 1 }

await page.goto(base)
await page.waitForSelector('text=오늘의 공부')
ok(await page.locator('.dday').count() === 2, 'home shows 2 D-day cards')

// solve first question of a lm exam
await page.goto(base + '#/run/lm/exam/LM-20210313')
await page.waitForSelector('.q-stem')
ok((await page.textContent('.q-meta')).includes('1번'), 'run shows question 1')
await page.locator('.opt').nth(3).click() // answer 4 is correct for Q1
ok((await page.textContent('.verdict')).includes('정답'), 'correct pick marks correct')
await page.getByText('다음', { exact: true }).click()
await page.locator('.opt').nth(0).click() // Q2 answer 3 -> wrong
ok((await page.textContent('.verdict')).includes('오답'), 'wrong pick marks wrong')

// wrong note + due
await page.goto(base + '#/me')
await page.waitForSelector('text=지금 복습할')
ok(await page.locator('.card.link').count() >= 1, 'wrong note has the missed question')

// mock: nw exam run, answer none, submit
await page.goto(base + '#/mock/nw')
await page.waitForSelector('text=랜덤 모의고사 시작')
await page.locator('button.card').first().click()
await page.waitForSelector('.timer')
ok((await page.locator('.palette button').count()) === 50, 'nw mock has 50 numbers')
ok((await page.textContent('.timer')).startsWith('49:') || (await page.textContent('.timer')).startsWith('50:'), 'timer 50 minutes')
page.once('dialog', (d) => d.accept())
await page.getByText('지금 제출하기').click()
await page.waitForSelector('text=결과')
ok((await page.textContent('.dday')).includes('0점'), 'empty mock scores 0')

// random lm mock
await page.goto(base + '#/mock/lm')
await page.getByText('랜덤 모의고사 시작').click()
await page.waitForSelector('.timer')
ok((await page.locator('.palette button').count()) === 80, 'lm random mock has 80 numbers')

// export / import round trip
await page.goto(base + '#/me')
await page.getByText('설정', { exact: true }).click()
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByText('기록 내보내기').click()])
const path = await dl.path()
const fs = await import('node:fs')
const data = JSON.parse(fs.readFileSync(path, 'utf8'))
ok(data.attempts.length >= 2 && data.mocks.length >= 1, 'export has attempts and mock results')

// offline-ish: no console errors
ok(errors.length === 0, 'no console errors ' + errors.join(' | '))
await browser.close()
srv.kill()
process.exit(process.exitCode ?? 0)
