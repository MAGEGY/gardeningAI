import { useState } from 'react'
import { useI18n } from '../i18n'
import { setApiKeySecure } from '../lib/secureKey'
import { dismissKeyPrompt } from '../lib/storage'
import GrowingTree from './GrowingTree'
import { LeafIcon } from './icons'

export default function KeyIntro({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()
  const [key, setKey] = useState('')

  const save = async () => {
    if (key.trim()) await setApiKeySecure(key.trim())
    onDone()
  }

  return (
    <div className="onboard">
      <GrowingTree />
      <div className="onboard-card wide">
        <div className="onboard-brand">
          <LeafIcon width={36} height={36} />
          <h1>{t('key.title')}</h1>
        </div>
        <p>{t('key.intro')}</p>

        <ul className="ticks benefits">
          <li>{t('key.b1')}</li>
          <li>{t('key.b2')}</li>
          <li>{t('key.b3')}</li>
          <li>{t('key.b4')}</li>
        </ul>

        <h3>{t('gate.how')}</h3>
        <ol className="steps">
          <li>{t('key.s1')}</li>
          <li>{t('key.s2')}</li>
          <li>{t('key.s3')}</li>
        </ol>

        <a
          className="btn primary key-link"
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
        >
          {t('key.get')}
        </a>

        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t('key.paste')}
          autoComplete="off"
          dir="ltr"
        />

        <div className="btn-row">
          <button className="btn primary" onClick={save}>
            {t('key.save')}
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              dismissKeyPrompt()
              onDone()
            }}
          >
            {t('key.skip')}
          </button>
        </div>
        <p className="muted small">{t('key.note')}</p>
      </div>
    </div>
  )
}
