import { useState } from 'react'
import DiagnosisCard from '../components/DiagnosisCard'
import PhotoInput from '../components/PhotoInput'
import { ApiKeyGate, ErrorBox, Notice, Spinner } from '../components/Status'
import { useI18n } from '../i18n'
import { diagnosePlant } from '../lib/gemini'
import { addHistory, loadSettings } from '../lib/storage'
import type { CapturedPhoto, Diagnosis } from '../types'

export default function Health() {
  const { t } = useI18n()
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [result, setResult] = useState<Diagnosis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    if (!photo) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const r = await diagnosePlant(loadSettings(), photo)
      setResult(r)
      addHistory({ kind: 'diagnose', title: r.plantName || t('kind.diagnose'), thumbnail: photo.thumbnail, payload: r })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setPhoto(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="page">
      <h1>{t('health.title')}</h1>
      <p className="muted">{t('health.desc')}</p>
      <ApiKeyGate />

      {!photo && <PhotoInput onPhoto={setPhoto} />}

      {photo && (
        <>
          <img className="preview" src={photo.dataUrl} alt="" />
          <div className="btn-row">
            <button className="btn primary" onClick={analyze} disabled={loading}>
              {loading ? t('health.analyzing') : t('health.btn')}
            </button>
            <button className="btn" onClick={reset} disabled={loading}>
              {t('photo.chooseAnother')}
            </button>
          </div>
        </>
      )}

      {loading && <Spinner label={t('health.examining')} />}
      {error && <ErrorBox message={error} />}
      {result && <DiagnosisCard dx={result} />}
      {result && (
        <>
          <Notice>{t('health.disclaimer')}</Notice>
          <button className="btn" onClick={reset}>{t('health.another')}</button>
        </>
      )}
    </div>
  )
}
