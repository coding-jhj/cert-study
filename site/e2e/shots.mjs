import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const srv = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { shell: true, stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 4000))
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 1 })).newPage()
const base = 'http://localhost:4174/'
await p.goto(base + '#/run/lm/exam/LM-20210313'); await p.waitForSelector('.q-stem')
for (let i = 0; i < 4; i++) { await p.locator('.nav-bar .btn.primary').click() }
await p.locator('.opt').nth(1).click()
await p.screenshot({ path: '../_src/shot_run.png' })
await p.goto(base + '#/'); await p.waitForSelector('.dday'); await p.screenshot({ path: '../_src/shot_home.png' })
await b.close(); srv.kill(); process.exit(0)
