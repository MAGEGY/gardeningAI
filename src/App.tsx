import { useState } from 'react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import KeyIntro from './components/KeyIntro'
import LanguageScreen from './components/LanguageScreen'
import { BookIcon, CalendarIcon, CameraIcon, GearIcon, HomeIcon, LeafIcon, PulseIcon } from './components/icons'
import { useI18n } from './i18n'
import { needsKeyPrompt } from './lib/storage'
import Calendar from './pages/Calendar'
import Health from './pages/Health'
import Home from './pages/Home'
import Identify from './pages/Identify'
import Knowledge from './pages/Knowledge'
import Settings from './pages/Settings'

export default function App() {
  const { t, chosen } = useI18n()
  const [keyPrompt, setKeyPrompt] = useState(needsKeyPrompt)

  if (!chosen) return <LanguageScreen />
  if (keyPrompt && needsKeyPrompt()) return <KeyIntro onDone={() => setKeyPrompt(false)} />

  return (
    <HashRouter>
      <header className="app-header">
        <NavLink to="/" className="brand">
          <LeafIcon /> Gardening AI
        </NavLink>
        <NavLink to="/settings" className="settings-link" aria-label={t('nav.settings')}>
          <GearIcon />
        </NavLink>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/identify" element={<Identify />} />
          <Route path="/health" element={<Health />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end>
          <HomeIcon />
          <span>{t('nav.home')}</span>
        </NavLink>
        <NavLink to="/identify">
          <CameraIcon />
          <span>{t('nav.identify')}</span>
        </NavLink>
        <NavLink to="/health">
          <PulseIcon />
          <span>{t('nav.health')}</span>
        </NavLink>
        <NavLink to="/knowledge">
          <BookIcon />
          <span>{t('nav.knowledge')}</span>
        </NavLink>
        <NavLink to="/calendar">
          <CalendarIcon />
          <span>{t('nav.calendar')}</span>
        </NavLink>
      </nav>
    </HashRouter>
  )
}
