// Builds one self-contained HTML file (no server, works from file://) from dist/ and public/.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(site, 'dist')
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029)
const safe = (s) => s.replace(/<\/(script)/gi, '<\\/$1').split(LS).join('\\u2028').split(PS).join('\\u2029')

let html = readFileSync(join(dist, 'index.html'), 'utf8')
const js = readFileSync(join(dist, html.match(/src="\.\/(assets\/[^"]+\.js)"/)[1]), 'utf8')
const css = readFileSync(join(dist, html.match(/href="\.\/(assets\/[^"]+\.css)"/)[1]), 'utf8')

const data = {}
for (const n of ['lm', 'nw', 'toc']) data[n] = JSON.parse(readFileSync(join(site, 'public', 'data', `${n}.json`), 'utf8'))
const content = {}
const cd = join(site, 'public', 'content')
for (const f of readdirSync(cd).filter((x) => x.endsWith('.md'))) content[f.replace(/\.md$/, '')] = readFileSync(join(cd, f), 'utf8')

html = html
  .replace(/<script type="module"[^>]*><\/script>/, '')
  .replace(/<link rel="stylesheet"[^>]*>/, '')
  .replace(/<link rel="manifest"[^>]*>/, '')
  .replace(/<script id="vite-plugin-pwa:register-sw"[^>]*><\/script>/, '')
  .replace(/<link rel="icon"[^>]*>/, '')
  .replace('</head>', () => `<style>${css}</style></head>`)
  .replace('</body>', () => `<script>window.__DATA__=${safe(JSON.stringify({ data, content }))}</script><script type="module">${safe(js)}</script></body>`)

const out = join(site, '..', '자격증공부.html')
writeFileSync(out, html)
console.log('wrote', out, (html.length / 1024 / 1024).toFixed(2), 'MB')
