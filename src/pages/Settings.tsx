import { useState } from 'react'
import { ErrorBox, Notice } from '../components/Status'
import { UI_LANGS, useI18n } from '../i18n'
import { testConnection } from '../lib/gemini'
import { setApiKeySecure } from '../lib/secureKey'
import { loadSettings, saveSettings } from '../lib/storage'

const ANSWER_LANGS = ['English', 'Arabic', 'French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Russian', 'Turkish', 'Hindi']
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.0-flash']

export default function Settings() {
  const { t, lang, setLang } = useI18n()
  const [settings, setSettings] = useState(loadSettings)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState<string | null>(null)
  const [testOk, setTestOk] = useState<boolean | null>(null)

  const update = (patch: Partial<typeof settings>) => {
    setSettings((s) => ({ ...s, ...patch }))
    setSaved(false)
    setTestMsg(null)
    setTestOk(null)
  }

  const save = async () => {
    saveSettings(settings)
    await setApiKeySecure(settings.apiKey.trim())
    setSaved(true)
  }

  const test = async () => {
    saveSettings(settings)
    await setApiKeySecure(settings.apiKey.trim())
    setTesting(true)
    setTestMsg(null)
    try {
      await testConnection(settings)
      setTestOk(true)
      setTestMsg(t('settings.testOk'))
    } catch (e) {
      setTestOk(false)
      setTestMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="page">
      <h1>{t('settings.title')}</h1>

      <div className="card">
        <label className="field">
          <span>{t('settings.uiLang')}</span>
          <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)}>
            {UI_LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native}{l.native !== l.english ? ` — ${l.english}` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card">
        <label className="field">
          <span>{t('settings.apiKey')}</span>
          <div className="key-row">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
              placeholder="AIza…"
              autoComplete="off"
              dir="ltr"
            />
            <button className="btn small" type="button" onClick={() => setShowKey((v) => !v)}>
              {showKey ? t('settings.hide') : t('settings.show')}
            </button>
          </div>
        </label>

        <ol className="steps">
          <li>{t('key.s1')}</li>
          <li>{t('key.s2')}</li>
          <li>{t('key.s3')}</li>
        </ol>
        <p className="muted small">
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            {t('key.get')}
          </a>{' '}
          · {t('settings.keyHelp')}
        </p>

        <label className="field">
          <span>{t('settings.model')}</span>
          <input
            list="model-list"
            value={settings.model}
            onChange={(e) => update({ model: e.target.value })}
            dir="ltr"
          />
          <datalist id="model-list">
            {MODELS.map((m) => <option key={m} value={m} />)}
          </datalist>
        </label>

        <label className="field">
          <span>{t('settings.answerLang')}</span>
          <select value={settings.language} onChange={(e) => update({ language: e.target.value })}>
            {ANSWER_LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>

        <div className="btn-row">
          <button className="btn primary" onClick={save}>{t('settings.save')}</button>
          <button className="btn" onClick={test} disabled={testing || !settings.apiKey.trim()}>
            {testing ? t('settings.testing') : t('settings.test')}
          </button>
        </div>

        {saved && <Notice>{t('settings.saved')}</Notice>}
        {testMsg && (testOk ? <Notice>{testMsg}</Notice> : <ErrorBox message={testMsg} />)}
      </div>
    </div>
  )
}
