import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiKeyGate, ErrorBox, Spinner } from '../components/Status'
import { LeafIcon } from '../components/icons'
import { useI18n } from '../i18n'
import { seasonalPlan } from '../lib/gemini'
import {
  TASK_KINDS,
  addPlant,
  addTask,
  loadPlants,
  loadTasks,
  markTaskDone,
  removePlant,
  removeTask,
  tasksInRange,
  tasksOnDay,
  toISODate,
  todayISO,
} from '../lib/garden'
import {
  detectLocation,
  fetchWeather,
  geocode,
  loadLocation,
  reverseGeocode,
  saveLocation,
  weatherKey,
} from '../lib/weather'
import { loadSettings } from '../lib/storage'
import type {
  GardenPlant,
  GardenTask,
  SeasonalPlan,
  StoredLocation,
  TaskKind,
  WeatherNow,
} from '../types'

const PLAN_CACHE = 'gardening.plans.v1'

type PlanCache = Record<string, SeasonalPlan>

function loadPlans(): PlanCache {
  try {
    return JSON.parse(localStorage.getItem(PLAN_CACHE) || '{}')
  } catch {
    return {}
  }
}
function cachePlan(key: string, plan: SeasonalPlan) {
  const all = loadPlans()
  all[key] = plan
  const keys = Object.keys(all)
  if (keys.length > 18) keys.slice(0, keys.length - 18).forEach((k) => delete all[k])
  localStorage.setItem(PLAN_CACHE, JSON.stringify(all))
}

export default function Calendar() {
  const { t, lang } = useI18n()
  const locale = lang === 'ar' ? 'ar' : lang

  const [loc, setLoc] = useState<StoredLocation | null>(loadLocation)
  const [weather, setWeather] = useState<WeatherNow | null>(null)
  const [city, setCity] = useState('')
  const [locBusy, setLocBusy] = useState(false)
  const [locErr, setLocErr] = useState<string | null>(null)

  const now = new Date()
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [selected, setSelected] = useState<string>(todayISO())
  const [plants, setPlants] = useState<GardenPlant[]>(loadPlants)
  const [tasks, setTasks] = useState<GardenTask[]>(loadTasks)

  const [plan, setPlan] = useState<SeasonalPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planErr, setPlanErr] = useState<string | null>(null)
  const planReqRef = useRef(0)

  const [showPlantForm, setShowPlantForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [pName, setPName] = useState('')
  const [pWater, setPWater] = useState('7')
  const [tKind, setTKind] = useState<TaskKind>('water')
  const [tPlant, setTPlant] = useState('')
  const [tDate, setTDate] = useState(todayISO())
  const [tEvery, setTEvery] = useState('')
  const [tNote, setTNote] = useState('')

  const [notif, setNotif] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  )

  /* ---------- location & weather ---------- */

  const detectMyLocation = async () => {
    setLocBusy(true)
    setLocErr(null)
    try {
      const c = await detectLocation()
      const label = await reverseGeocode(c.latitude, c.longitude)
      const l = { lat: c.latitude, lon: c.longitude, label }
      setLoc(l)
      saveLocation(l)
    } catch {
      setLocErr(t('cal.loc.error'))
    } finally {
      setLocBusy(false)
    }
  }

  const applyCity = async () => {
    if (!city.trim()) return
    setLocBusy(true)
    setLocErr(null)
    try {
      const hit = await geocode(city.trim())
      if (hit) {
        setLoc(hit)
        saveLocation(hit)
      } else {
        setLocErr(t('cal.loc.error'))
      }
    } catch {
      setLocErr(t('cal.loc.error'))
    } finally {
      setLocBusy(false)
    }
  }

  const refreshWeather = () => {
    if (!loc) return
    fetchWeather(loc.lat, loc.lon).then((w) => w && setWeather(w))
  }

  useEffect(() => {
    if (loc) fetchWeather(loc.lat, loc.lon).then((w) => w && setWeather(w))
  }, [loc])

  /* ---------- seasonal plan (Gemini, cached) ---------- */

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(cursor.y, cursor.m, 1),
  )
  const planKey = loc
    ? `${loc.lat.toFixed(1)},${loc.lon.toFixed(1)}|${cursor.y}-${cursor.m + 1}`
    : null

  const loadPlan = async (force = false) => {
    if (!loc || !planKey) return
    if (!force) {
      const cached = loadPlans()[planKey]
      if (cached) {
        setPlan(cached)
        return
      }
    }
    if (!loadSettings().apiKey) {
      setPlan(null)
      return
    }
    const reqId = ++planReqRef.current
    setPlanLoading(true)
    setPlanErr(null)
    try {
      const weatherDesc = weather
        ? `${weather.temperature}°C, wind ${weather.windspeed} km/h`
        : undefined
      const p = await seasonalPlan(loadSettings(), {
        lat: loc.lat,
        lon: loc.lon,
        label: loc.label,
        month: monthLabel,
        weather: weatherDesc,
      })
      if (planReqRef.current === reqId) {
        setPlan(p)
        cachePlan(planKey, p)
      }
    } catch (e) {
      if (planReqRef.current === reqId)
        setPlanErr(e instanceof Error ? e.message : String(e))
    } finally {
      if (planReqRef.current === reqId) setPlanLoading(false)
    }
  }

  // auto-load cached / fetch plan when month or location changes
  useEffect(() => {
    setPlan(null)
    setPlanErr(null)
    void loadPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey])

  /* ---------- calendar grid ---------- */

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1)
    const startOffset = (first.getDay() + 6) % 7 // Monday-first
    const start = new Date(cursor.y, cursor.m, 1 - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [cursor])

  const rangeTasks = useMemo(
    () => tasksInRange(tasks, toISODate(cells[0]), toISODate(cells[41])),
    [cells, tasks],
  )

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    // 2024-01-01 was a Monday
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)))
  }, [locale])

  const moveMonth = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1)
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
  }

  const goToday = () => {
    setCursor({ y: now.getFullYear(), m: now.getMonth() })
    setSelected(todayISO())
  }

  const touchX = useRef<number | null>(null)

  /* ---------- plants & tasks ---------- */

  const plantName = (id?: string) => plants.find((p) => p.id === id)?.name

  const submitPlant = () => {
    const name = pName.trim()
    if (!name) return
    const days = parseInt(pWater, 10)
    const plant = addPlant({
      name,
      waterEveryDays: days > 0 ? days : undefined,
    })
    if (days > 0) {
      const due = new Date()
      due.setDate(due.getDate() + days)
      addTask({
        plantId: plant.id,
        kind: 'water',
        title: `${t('task.water')} — ${name}`,
        everyDays: days,
        nextDue: toISODate(due),
      })
    }
    setPlants(loadPlants())
    setTasks(loadTasks())
    setPName('')
    setShowPlantForm(false)
  }

  const submitTask = () => {
    if (!tDate) return
    const days = parseInt(tEvery, 10)
    const pname = plantName(tPlant || undefined)
    addTask({
      plantId: tPlant || undefined,
      kind: tKind,
      title: pname ? `${t(`task.${tKind}`)} — ${pname}` : t(`task.${tKind}`),
      everyDays: days > 0 ? days : undefined,
      nextDue: tDate,
      note: tNote.trim() || undefined,
    })
    setTasks(loadTasks())
    setTNote('')
    setTEvery('')
    setShowTaskForm(false)
  }

  const done = (id: string) => {
    markTaskDone(id)
    setTasks(loadTasks())
  }
  const delTask = (id: string) => {
    removeTask(id)
    setTasks(loadTasks())
  }
  const delPlant = (id: string) => {
    removePlant(id)
    setPlants(loadPlants())
  }

  const enableNotif = async () => {
    if (typeof Notification === 'undefined') return
    const p = await Notification.requestPermission()
    setNotif(p)
  }

  const today = todayISO()

  return (
    <div className="page">
      <h1>{t('cal.title')}</h1>

      {/* location + weather */}
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
                  setLoc(null)
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
              <button className="btn primary" onClick={detectMyLocation} disabled={locBusy}>
                {locBusy ? t('photo.starting') : t('cal.loc.use')}
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
              <button className="btn" type="submit" disabled={locBusy || !city.trim()}>
                {t('cal.loc.set')}
              </button>
            </form>
          </>
        )}
        {locErr && <ErrorBox message={locErr} />}
      </div>

      {/* month grid */}
      <div className="card">
        <div className="cal-head">
          <button className="btn small" onClick={() => moveMonth(-1)} aria-label="previous month">‹</button>
          <h2>{monthLabel}</h2>
          <button className="btn small" onClick={() => moveMonth(1)} aria-label="next month">›</button>
          <button className="btn small ghost" onClick={goToday}>{t('cal.today')}</button>
        </div>
        <div
          className="cal-grid"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current == null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) > 60) moveMonth(dx > 0 ? -1 : 1)
          }}
        >
          {weekdays.map((w) => (
            <div className="cal-wd" key={w}>{w}</div>
          ))}
          {cells.map((d) => {
            const iso = toISODate(d)
            const dayTasks = rangeTasks.get(iso) ?? []
            const overdue = iso < today && dayTasks.length > 0
            const outside = d.getMonth() !== cursor.m
            return (
              <button
                key={iso}
                className={[
                  'cal-day',
                  outside ? 'outside' : '',
                  iso === today ? 'today' : '',
                  iso === selected ? 'selected' : '',
                ].join(' ')}
                onClick={() => {
                  setSelected(iso)
                  setTDate(iso)
                }}
              >
                <span className="cal-num">{d.getDate()}</span>
                {dayTasks.length > 0 && (
                  <span className="cal-dots">
                    <span className={`dot ${overdue ? 'red' : 'green'}`} />
                    {dayTasks.length > 1 && <small>{dayTasks.length}</small>}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* selected day */}
      <div className="card">
        <div className="section-head">
          <h3>
            {new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(
              new Date(`${selected}T12:00:00`),
            )}
          </h3>
          <button className="btn small" onClick={() => setShowTaskForm((v) => !v)}>
            {t('cal.addTask')}
          </button>
        </div>

        {tasksOnDay(tasks, selected).length === 0 && !showTaskForm && (
          <p className="muted small">{t('cal.noDayTasks')}</p>
        )}
        {tasksOnDay(tasks, selected).map((tk) => (
          <div className="task-row" key={tk.id}>
            <span className={`badge ${tk.nextDue < today ? 'red' : 'green'}`}>
              {t(`task.${tk.kind}`)}
            </span>
            <span className="task-title">
              {tk.title}
              {tk.note && <small className="muted"> — {tk.note}</small>}
            </span>
            <span className="task-actions">
              {tk.nextDue <= today && (
                <button className="btn small primary" onClick={() => done(tk.id)}>
                  {t('cal.doneBtn')}
                </button>
              )}
              <button className="btn small ghost" onClick={() => delTask(tk.id)}>
                {t('cal.delete')}
              </button>
            </span>
          </div>
        ))}

        {showTaskForm && (
          <div className="form-box">
            <div className="form-row">
              <label className="field">
                <span>{t('cal.addTask')}</span>
                <select value={tKind} onChange={(e) => setTKind(e.target.value as TaskKind)}>
                  {TASK_KINDS.map((k) => (
                    <option key={k} value={k}>{t(`task.${k}`)}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t('cal.plant')}</span>
                <select value={tPlant} onChange={(e) => setTPlant(e.target.value)}>
                  <option value="">{t('cal.none')}</option>
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label className="field">
                <span>{t('cal.date')}</span>
                <input type="date" value={tDate} onChange={(e) => setTDate(e.target.value)} />
              </label>
              <label className="field">
                <span>{t('cal.every')}</span>
                <input
                  type="number"
                  min="0"
                  placeholder={t('cal.once')}
                  value={tEvery}
                  onChange={(e) => setTEvery(e.target.value)}
                  dir="ltr"
                />
              </label>
            </div>
            <label className="field">
              <span>{t('cal.note')}</span>
              <input value={tNote} onChange={(e) => setTNote(e.target.value)} />
            </label>
            <div className="btn-row">
              <button className="btn primary" onClick={submitTask}>{t('cal.save')}</button>
              <button className="btn" onClick={() => setShowTaskForm(false)}>{t('cal.cancel')}</button>
            </div>
          </div>
        )}
      </div>

      {/* seasonal suggestions */}
      <div className="card">
        <div className="section-head">
          <h3>{t('cal.suggest')} — {monthLabel}</h3>
          {loc && loadSettings().apiKey && (
            <button className="btn small" onClick={() => void loadPlan(true)} disabled={planLoading}>
              {t('cal.refresh')}
            </button>
          )}
        </div>
        {!loc && <p className="muted small">{t('cal.loc.none')}</p>}
        {loc && !loadSettings().apiKey && <ApiKeyGate />}
        {planLoading && <Spinner label={t('cal.suggest.load')} />}
        {planErr && <ErrorBox message={planErr} />}
        {plan && (
          <>
            {plan.summary && <p className="lead">{plan.summary}</p>}
            <div className="suggest-grid">
              {plan.plantings.map((p, i) => (
                <div className="suggest-item" key={i}>
                  <div className="suggest-head">
                    <strong>{p.name}</strong>
                    <span className={`badge ${p.action === 'harvest' ? 'amber' : 'green'}`}>
                      {t(`act.${p.action}`)}
                    </span>
                  </div>
                  <small className="muted">{p.note}</small>
                </div>
              ))}
            </div>
            {plan.tasks?.length > 0 && (
              <ul className="ticks compact">
                {plan.tasks.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          </>
        )}
      </div>

      {/* my plants */}
      <div className="card">
        <div className="section-head">
          <h3>{t('cal.myPlants')}</h3>
          <button className="btn small" onClick={() => setShowPlantForm((v) => !v)}>
            {t('cal.addPlant')}
          </button>
        </div>

        {plants.length === 0 && !showPlantForm && (
          <p className="muted small">{t('cal.noPlants')}</p>
        )}
        {plants.map((p) => (
          <div className="task-row" key={p.id}>
            {p.thumbnail ? (
              <img className="plant-thumb" src={p.thumbnail} alt="" />
            ) : (
              <span className="plant-thumb placeholder"><LeafIcon width={18} height={18} /></span>
            )}
            <span className="task-title">
              <strong>{p.name}</strong>
              {p.species && <em className="muted"> {p.species}</em>}
              {p.waterEveryDays && (
                <small className="muted">
                  {' '}· {t('task.water')} / {p.waterEveryDays} {t('cal.days')}
                </small>
              )}
            </span>
            <span className="task-actions">
              <button className="btn small ghost" onClick={() => delPlant(p.id)}>
                {t('cal.delete')}
              </button>
            </span>
          </div>
        ))}

        {showPlantForm && (
          <div className="form-box">
            <div className="form-row">
              <label className="field">
                <span>{t('cal.plantName')}</span>
                <input value={pName} onChange={(e) => setPName(e.target.value)} />
              </label>
              <label className="field">
                <span>{t('cal.waterEvery')}</span>
                <input
                  type="number"
                  min="0"
                  value={pWater}
                  onChange={(e) => setPWater(e.target.value)}
                  dir="ltr"
                />
              </label>
            </div>
            <div className="btn-row">
              <button className="btn primary" onClick={submitPlant} disabled={!pName.trim()}>
                {t('cal.save')}
              </button>
              <button className="btn" onClick={() => setShowPlantForm(false)}>{t('cal.cancel')}</button>
            </div>
          </div>
        )}
      </div>

      {/* reminders */}
      {typeof Notification !== 'undefined' && notif !== 'granted' && (
        <button className="btn" onClick={enableNotif}>{t('cal.notify.enable')}</button>
      )}
      {notif === 'granted' && <p className="muted small">{t('cal.notify.on')}</p>}
    </div>
  )
}
