import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GrowVideo from '../components/GrowVideo'
import { ApiKeyGate, EmptyState, Notice } from '../components/Status'
import { BookIcon, CalendarIcon, CameraIcon, LeafIcon, PulseIcon } from '../components/icons'
import { useI18n } from '../i18n'
import { dueTasks } from '../lib/garden'
import { clearHistory, loadHistory } from '../lib/storage'
import { notifyDueTasks } from '../lib/notify'
import type { HistoryItem } from '../types'

const FEATURES = [
  { to: '/identify', icon: CameraIcon, key: 'f.identify' },
  { to: '/health', icon: PulseIcon, key: 'f.health' },
  { to: '/knowledge', icon: BookIcon, key: 'f.know' },
  { to: '/calendar', icon: CalendarIcon, key: 'f.cal' },
] as const

export default function Home() {
  const { t } = useI18n()
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory)
  const [due, setDue] = useState(0)

  useEffect(() => {
    const n = dueTasks().length
    setDue(n)
    if (n > 0) notifyDueTasks(n, t('cal.notify.due'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page">
      <div className="hero">
        <GrowVideo className="hero-video" />
        <div className="hero-text">
          <h1>Gardening AI</h1>
          <p className="muted">{t('home.tagline')}</p>
        </div>
      </div>

      <ApiKeyGate />

      {due > 0 && (
        <Notice tone="warn">
          {t('home.dueBanner').replace('{n}', String(due))} —{' '}
          <Link to="/calendar">{t('home.viewCal')}</Link>
        </Notice>
      )}

      <div className="feature-grid">
        {FEATURES.map(({ to, icon: Icon, key }) => (
          <Link to={to} className="feature" key={key}>
            <div className="feature-icon">
              <Icon width={30} height={30} />
            </div>
            <h3>{t(`${key}.t`)}</h3>
            <p>{t(`${key}.d`)}</p>
            <ul className="ticks compact">
              <li>{t(`${key}.b1`)}</li>
              <li>{t(`${key}.b2`)}</li>
              <li>{t(`${key}.b3`)}</li>
            </ul>
          </Link>
        ))}
      </div>

      <section>
        <div className="section-head">
          <h2>{t('home.recent')}</h2>
          {history.length > 0 && (
            <button
              className="btn small ghost"
              onClick={() => {
                clearHistory()
                setHistory([])
              }}
            >
              {t('home.clear')}
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <EmptyState icon={<LeafIcon width={26} height={26} />} text={t('home.noHistory')} />
        ) : (
          <div className="history-grid">
            {history.slice(0, 9).map((h) => (
              <div className="history-item" key={h.id}>
                {h.thumbnail ? (
                  <img src={h.thumbnail} alt="" />
                ) : (
                  <div className="history-placeholder">
                    <LeafIcon />
                  </div>
                )}
                <div>
                  <strong>{h.title}</strong>
                  <small className="muted">
                    {t(`kind.${h.kind}`)} · {new Date(h.timestamp).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
