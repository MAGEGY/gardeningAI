import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { builtinQuotaLeft } from '../lib/builtinKey'
import { loadSettings } from '../lib/storage'

export function Spinner({ label }: { label: string }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="notice error">{message}</div>
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
