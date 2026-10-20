import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const srv = spawn('npx', ['vite', 'preview', '--port', '4177', '--strictPort'], { shell: true, stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 4000))
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage()
await p.goto('http://localhost:4177/#/study/nw-ip'); await p.waitForTimeout(1200)
await p.evaluate(() => window.scrollTo(0, 2400)); await p.waitForTimeout(300)
await p.screenshot({ path: '../_src/shot_nwip.png' })
const over = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
console.log('horizontal page overflow', over)
await b.close(); srv.kill(); process.exit(0)
