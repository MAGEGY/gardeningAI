import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhotoInput from '../components/PhotoInput'
import PlantCard from '../components/PlantCard'
import { ApiKeyGate, ErrorBox, Spinner } from '../components/Status'
import { useI18n } from '../i18n'
import { identifyPlant } from '../lib/gemini'
import { addPlant } from '../lib/garden'
import { addHistory, loadSettings } from '../lib/storage'
import type { CapturedPhoto, PlantProfile } from '../types'

export default function Identify() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [result, setResult] = useState<PlantProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    if (!photo) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const r = await identifyPlant(loadSettings(), photo)
      setResult(r)
      addHistory({ kind: 'identify', title: r.commonName || t('plant.notId'), thumbnail: photo.thumbnail, payload: r })
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
      <h1>{t('identify.title')}</h1>
      <p className="muted">{t('identify.desc')}</p>
      <ApiKeyGate />

      {!photo && <PhotoInput onPhoto={setPhoto} />}

      {photo && (
        <>
          <img className="preview" src={photo.dataUrl} alt="" />
          <div className="btn-row">
            <button className="btn primary" onClick={analyze} disabled={loading}>
              {loading ? t('identify.analyzing') : t('identify.btn')}
            </button>
            <button className="btn" onClick={reset} disabled={loading}>
              {t('photo.chooseAnother')}
            </button>
          </div>
        </>
      )}

      {loading && <Spinner label={t('status.analyzing')} />}
      {error && <ErrorBox message={error} />}
      {result && <PlantCard plant={result} />}
      {result && (
        <div className="btn-row">
          {result.identified && (
            <button
              className="btn"
              onClick={() => {
                addPlant({
                  name: result.commonName || result.scientificName,
                  species: result.scientificName || undefined,
                  thumbnail: photo?.thumbnail,
                })
                navigate('/calendar')
              }}
            >
              {t('garden.add')}
            </button>
          )}
          <button className="btn" onClick={reset}>{t('identify.another')}</button>
        </div>
      )}
    </div>
  )
}
