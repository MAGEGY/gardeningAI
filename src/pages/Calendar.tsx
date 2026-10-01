import { useEffect, useState } from 'react'
import DayPanel from '../components/calendar/DayPanel'
import LocationCard from '../components/calendar/LocationCard'
import MonthGrid from '../components/calendar/MonthGrid'
import MyPlants from '../components/calendar/MyPlants'
import SuggestionsCard from '../components/calendar/SuggestionsCard'
import { useI18n } from '../i18n'
import { loadPlants, loadTasks, todayISO } from '../lib/garden'
import { fetchWeather, loadLocation } from '../lib/weather'
import type { GardenPlant, GardenTask, StoredLocation, WeatherNow } from '../types'

// evaluated once at module load — keeps render pure
const INITIAL_CURSOR = (() => {
  const d = new Date()
  return { y: d.getFullYear(), m: d.getMonth() }
})()

export default function Calendar() {
  const { t, lang } = useI18n()
  const locale = lang === 'ar' ? 'ar' : lang

  const [loc, setLoc] = useState<StoredLocation | null>(loadLocation)
  const [weather, setWeather] = useState<WeatherNow | null>(null)

  const [cursor, setCursor] = useState(INITIAL_CURSOR)
  const [selected, setSelected] = useState<string>(todayISO())
  const [plants, setPlants] = useState<GardenPlant[]>(loadPlants)
  const [tasks, setTasks] = useState<GardenTask[]>(loadTasks)

  const [notif, setNotif] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  )

  useEffect(() => {
    if (loc) fetchWeather(loc.lat, loc.lon).then((w) => w && setWeather(w))
  }, [loc])

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(cursor.y, cursor.m, 1),
  )
  const planKey = loc
    ? `${loc.lat.toFixed(1)},${loc.lon.toFixed(1)}|${cursor.y}-${cursor.m + 1}`
    : null

  const moveMonth = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1)
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
  }

  const goToday = () => {
    const d = new Date()
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
    setSelected(todayISO())
  }

  const reloadTasks = () => setTasks(loadTasks())
  const reloadPlantsAndTasks = () => {
    setPlants(loadPlants())
    setTasks(loadTasks())
  }

  const enableNotif = async () => {
    if (typeof Notification === 'undefined') return
    const p = await Notification.requestPermission()
    setNotif(p)
  }

  return (
    <div className="page">
      <h1>{t('cal.title')}</h1>

      <LocationCard
        loc={loc}
        weather={weather}
        onLocChange={setLoc}
        onWeather={setWeather}
      />

      <MonthGrid
        cursor={cursor}
        locale={locale}
        selected={selected}
        tasks={tasks}
        onMove={moveMonth}
        onSelect={setSelected}
        onToday={goToday}
      />

      {/* key remounts the panel per day so the task form pre-fills the selected date */}
      <DayPanel
        key={selected}
        selected={selected}
        locale={locale}
        tasks={tasks}
        plants={plants}
        onChanged={reloadTasks}
      />

      <SuggestionsCard
        planKey={planKey}
        monthLabel={monthLabel}
        loc={loc}
        weather={weather}
      />

      <MyPlants plants={plants} onChanged={reloadPlantsAndTasks} />

      {/* reminders */}
      {typeof Notification !== 'undefined' && notif !== 'granted' && (
        <button className="btn" onClick={enableNotif}>{t('cal.notify.enable')}</button>
      )}
      {notif === 'granted' && <p className="muted small">{t('cal.notify.on')}</p>}
    </div>
  )
}
