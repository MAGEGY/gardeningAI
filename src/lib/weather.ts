import type { StoredLocation, WeatherNow } from '../types'

const LOC_KEY = 'gardening.location.v1'

export function loadLocation(): StoredLocation | null {
  try {
    const raw = localStorage.getItem(LOC_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveLocation(loc: StoredLocation | null): void {
  if (loc) localStorage.setItem(LOC_KEY, JSON.stringify(loc))
  else localStorage.removeItem(LOC_KEY)
}

export function detectLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('no-geolocation'))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      reject,
      { timeout: 12000, maximumAge: 10 * 60 * 1000 },
    )
  })
}

/** Friendly place name for coordinates — free, no key. */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    )
    const data = await res.json()
    return data.city || data.locality || data.principalSubdivision || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  }
}

/** Name -> coordinates via Open-Meteo geocoding (free, no key). */
export async function geocode(name: string): Promise<StoredLocation | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`,
  )
  const data = await res.json()
  const hit = data?.results?.[0]
  if (!hit) return null
  return {
    lat: hit.latitude,
    lon: hit.longitude,
    label: [hit.name, hit.admin1, hit.country].filter(Boolean).join(', '),
  }
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherNow | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,is_day`,
    )
    const data = await res.json()
    const c = data?.current
    if (!c) return null
    return {
      temperature: c.temperature_2m,
      windspeed: c.wind_speed_10m,
      code: c.weather_code,
      isDay: c.is_day === 1,
    }
  } catch {
    return null
  }
}

/** WMO weather code -> translation key suffix */
export function weatherKey(code: number): string {
  if (code === 0 || code === 1) return 'w.clear'
  if (code <= 3) return 'w.cloudy'
  if (code === 45 || code === 48) return 'w.fog'
  if (code >= 51 && code <= 57) return 'w.drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'w.rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'w.snow'
  return 'w.storm'
}
