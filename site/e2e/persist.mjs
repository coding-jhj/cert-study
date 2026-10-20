import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const dir = mkdtempSync(join(tmpdir(), 'pw-'))
const url = pathToFileURL('C:/certificate/자격증공부.html').href
async function run(fn) { const c = await chromium.launchPersistentContext(dir, {}); const p = c.pages()[0] ?? (await c.newPage()); await fn(p); await c.close() }
await run(async (p) => { await p.goto(url + '#/run/lm/exam/LM-20210313'); await p.waitForSelector('.q-stem'); await p.locator('.opt').nth(0).click(); await p.waitForTimeout(800) })
await run(async (p) => { await p.goto(url + '#/me'); await p.waitForTimeout(1500); const t = await p.locator('body').innerText(); console.log(/1/.test(t) ? 'PASS record kept after reopen' : 'FAIL'); console.log(t.replace(/\n+/g, ' | ').slice(0, 200)) })
