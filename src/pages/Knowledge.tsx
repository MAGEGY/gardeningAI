import { useState } from 'react'
import PhotoInput from '../components/PhotoInput'
import PlantCard from '../components/PlantCard'
import { ApiKeyGate, ErrorBox, Spinner } from '../components/Status'
import { SearchIcon } from '../components/icons'
import { useI18n } from '../i18n'
import { identifyPlant, searchPlant } from '../lib/gemini'
import { addPlant } from '../lib/garden'
import { addHistory, loadSettings } from '../lib/storage'
import type { CapturedPhoto, PlantProfile } from '../types'

export default function Knowledge() {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [photoMode, setPhotoMode] = useState(false)
  const [result, setResult] = useState<PlantProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<PlantProfile>, title: string, thumb?: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const r = await fn()
      setResult(r)
      addHistory({ kind: 'search', title: r.commonName || title, thumbnail: thumb, payload: r })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const search = (q: string) => {
    const term = q.trim()
    if (!term || loading) return
    setQuery(term)
    void run(() => searchPlant(loadSettings(), term), term)
  }

  const onPhoto = (photo: CapturedPhoto) => {
    setPhotoMode(false)
    void run(() => identifyPlant(loadSettings(), photo), 'Photo', photo.thumbnail)
  }

  return (
    <div className="page">
      <h1>{t('know.title')}</h1>
      <p className="muted">{t('know.desc')}</p>
      <ApiKeyGate />

      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault()
          search(query)
        }}
      >
        <input
          type="search"
          placeholder={t('know.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn primary" type="submit" disabled={loading || !query.trim()}>
          <SearchIcon /> {t('know.search')}
        </button>
      </form>

      <button className="btn" onClick={() => setPhotoMode((v) => !v)} disabled={loading}>
        {photoMode ? t('know.hideCam') : t('know.byPhoto')}
      </button>

      {photoMode && <PhotoInput onPhoto={onPhoto} />}

      {loading && <Spinner label={t('know.looking')} />}
      {error && <ErrorBox message={error} />}
      {result && <PlantCard plant={result} onSelectRelated={search} />}
      {result?.identified && (
        <button
          className="btn"
          onClick={() => {
            addPlant({
              name: result.commonName || result.scientificName,
              species: result.scientificName || undefined,
            })
          }}
        >
          {t('garden.add')}
        </button>
      )}
    </div>
  )
}
