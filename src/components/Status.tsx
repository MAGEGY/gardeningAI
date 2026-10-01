import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { builtinQuotaLeft } from '../lib/builtinKey'
import { loadSettings } from '../lib/storage'

export function Spinner({ label }: { label: string }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <svg className="hourglass" viewBox="0 0 48 72" aria-hidden="true">
        <path
          className="hg-glass"
          d="M8 6 H40 C40 20 34 28 24 34 C14 28 8 20 8 6 Z
             M8 66 H40 C40 52 34 44 24 38 C14 44 8 52 8 66 Z"
        />
        <path className="hg-cap" d="M5 6 H43 M5 66 H43" />
        <path
          className="hg-sand hg-top"
          d="M13 11 H35 C35 18 31 26 24 31 C17 26 13 18 13 11 Z"
        />
        <path
          className="hg-sand hg-bot"
          d="M11 62 H37 C37 55 32 47 24 41 C16 47 11 55 11 62 Z"
        />
      </svg>
      <p>{label}</p>
    </div>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="notice error">{message}</div>
}

export function EmptyState({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="empty">
      {icon}
      <p>{text}</p>
    </div>
  )
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return <div className={`notice ${tone}`}>{children}</div>
}

export function ApiKeyGate() {
  const { t } = useI18n()
  if (loadSettings().apiKey.trim()) return null
  const left = builtinQuotaLeft()
  return (
    <div className="notice warn key-gate">
      <strong>
        {left > 0
          ? t('gate.trial').replace('{n}', String(left))
          : t('gate.exhausted')}
      </strong>
      <p className="small">{t('key.intro')}</p>
      <details>
        <summary>{t('gate.how')}</summary>
        <ol className="steps">
          <li>{t('key.s1')}</li>
          <li>{t('key.s2')}</li>
          <li>{t('key.s3')}</li>
        </ol>
      </details>
      <div className="btn-row">
        <a
          className="btn small"
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
        >
          {t('key.get')}
        </a>
        <Link className="btn small primary" to="/settings">
          {t('gate.open')}
        </Link>
      </div>
    </div>
  )
}
