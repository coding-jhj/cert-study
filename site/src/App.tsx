import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useToc } from './lib/toc'
import { useTheme } from './lib/store'
import Home from './pages/Home'
import Study from './pages/Study'
import Chapter from './pages/Chapter'
import Questions from './pages/Questions'
import Run from './pages/Run'
import Mock from './pages/Mock'
import MockRun from './pages/MockRun'
import MockResult from './pages/MockResult'
import Me from './pages/Me'

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

const TABS = [
  { to: '/', label: '홈', end: true, d: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z' },
  { to: '/study', label: '학습', end: false, d: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13' },
  { to: '/q', label: '문제', end: false, d: 'M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.1-1.5 2.4M12 17.5v.5M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z' },
  { to: '/mock', label: '모의고사', end: false, d: 'M12 7v5l3 2M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 2h6' },
  { to: '/me', label: '내 기록', end: false, d: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
]

function Side() {
  const { pathname } = useLocation()
  const toc = useToc()
  const showChapters = pathname.startsWith('/study')
  const groups = [
    { cert: 'lm', title: '리눅스마스터' },
    { cert: 'nw', title: '네트워크관리사' },
  ]
  return (
    <aside className="side" aria-label="사이드 메뉴">
      <div className="brand">자격증 공부</div>
      {TABS.map((t) => (
        <div key={t.to}>
          <NavLink to={t.to} end={t.end || t.to === '/study'}>
            {icon(t.d)}
            {t.label}
          </NavLink>
          {t.to === '/study' &&
            showChapters &&
            groups.map((g) => (
              <div key={g.cert}>
                <div className="grp">{g.title}</div>
                {(toc?.chapters ?? [])
                  .filter((c) => c.cert === g.cert)
                  .map((c) => (
                    <NavLink key={c.id} className="ch" to={`/study/${c.id}`}>
                      {c.title}
                    </NavLink>
                  ))}
              </div>
            ))}
        </div>
      ))}
    </aside>
  )
}

export default function App() {
  useTheme()
  return (
    <HashRouter>
      <div className="app">
        <Side />
        <div className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<Study />} />
          <Route path="/study/:chapter" element={<Chapter />} />
          <Route path="/q" element={<Questions />} />
          <Route path="/run/:cert/:kind/:key?" element={<Run />} />
          <Route path="/mock" element={<Mock />} />
          <Route path="/mock/result/:id" element={<MockResult />} />
          <Route path="/mock/:cert" element={<Mock />} />
          <Route path="/mock/:cert/run" element={<MockRun />} />
          <Route path="/me" element={<Me />} />
          <Route path="*" element={<Home />} />
        </Routes>
        </div>
        <nav className="tabs" aria-label="메뉴">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end}>
              {icon(t.d)}
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </HashRouter>
  )
}
