import { useState } from 'react'
import { ErrorBox } from '../Status'
import { useI18n } from '../../i18n'
import {
  detectLocation,
  fetchWeather,
  geocode,
  reverseGeocode,
  saveLocation,
  weatherKey,
} from '../../lib/weather'
import type { StoredLocation, WeatherNow } from '../../types'

export default function LocationCard({
  loc,
  weather,
  onLocChange,
  onWeather,
}: {
  loc: StoredLocation | null
  weather: WeatherNow | null
  onLocChange: (l: StoredLocation | null) => void
  onWeather: (w: WeatherNow | null) => void
}) {
  const { t, lang } = useI18n()
  const [city, setCity] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const detectMyLocation = async () => {
    setBusy(true)
    setErr(null)
    try {
      const c = await detectLocation()
      const label = await reverseGeocode(c.latitude, c.longitude, lang)
      const l = { lat: c.latitude, lon: c.longitude, label }
      onLocChange(l)
      saveLocation(l)
    } catch {
      setErr(t('cal.loc.error'))
    } finally {
      setBusy(false)
    }
  }

  const applyCity = async () => {
    if (!city.trim()) return
    setBusy(true)
    setErr(null)
    try {
      const hit = await geocode(city.trim(), lang)
      if (hit) {
        onLocChange(hit)
        saveLocation(hit)
      } else {
        setErr(t('cal.loc.error'))
      }
    } catch {
      setErr(t('cal.loc.error'))
    } finally {
      setBusy(false)
    }
  }

  const refreshWeather = () => {
    if (!loc) return
    fetchWeather(loc.lat, loc.lon).then((w) => w && onWeather(w))
  }

  return (
    <div className="card loc-card">
      {loc ? (
        <div className="loc-row">
          <div>
            <strong>{loc.label}</strong>
            {weather && (
              <span className="muted">
                {' '}
                · {Math.round(weather.temperature)}°C · {t(weatherKey(weather.code))} ·{' '}
                {weather.windspeed} km/h
              </span>
            )}
          </div>
          <div className="btn-row">
            <button className="btn small" onClick={refreshWeather}>{t('cal.refresh')}</button>
            <button
              className="btn small ghost"
              onClick={() => {
                onLocChange(null)
                saveLocation(null)
              }}
            >
              {t('cal.loc.change')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="muted small">{t('cal.loc.none')}</p>
          <div className="btn-row">
            <button className="btn primary" onClick={detectMyLocation} disabled={busy}>
              {busy ? t('photo.starting') : t('cal.loc.use')}
            </button>
          </div>
          <form
            className="search-bar"
            onSubmit={(e) => {
              e.preventDefault()
              void applyCity()
            }}
          >
            <input
              placeholder={t('cal.loc.placeholder')}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button className="btn" type="submit" disabled={busy || !city.trim()}>
              {t('cal.loc.set')}
            </button>
          </form>
        </>
      )}
      {err && <ErrorBox message={err} />}
    </div>
  )
}
