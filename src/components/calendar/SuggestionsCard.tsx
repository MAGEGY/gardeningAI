import { useEffect, useRef, useState } from 'react'
import { ApiKeyGate, ErrorBox, Spinner } from '../Status'
import { useI18n } from '../../i18n'
import { builtinQuotaLeft } from '../../lib/builtinKey'
import { seasonalPlan } from '../../lib/gemini'
import { loadSettings } from '../../lib/storage'
import type { SeasonalPlan, StoredLocation, WeatherNow } from '../../types'

const PLAN_CACHE = 'gardening.plans.v1'

type PlanCache = Record<string, SeasonalPlan>

const canCallAi = () => Boolean(loadSettings().apiKey.trim()) || builtinQuotaLeft() > 0

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

export default function SuggestionsCard({
  planKey,
  monthLabel,
  loc,
  weather,
}: {
  planKey: string | null
  monthLabel: string
  loc: StoredLocation | null
  weather: WeatherNow | null
}) {
  const { t } = useI18n()
  const [plan, setPlan] = useState<SeasonalPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const reqRef = useRef(0)

  const loadPlan = async (force = false) => {
    if (!loc || !planKey) return
    if (!force) {
      const cached = loadPlans()[planKey]
      if (cached) {
        setPlan(cached)
        return
      }
    }
    if (!canCallAi()) {
      setPlan(null)
      return
    }
    const reqId = ++reqRef.current
    setLoading(true)
    setErr(null)
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
      if (reqRef.current === reqId) {
        setPlan(p)
        cachePlan(planKey, p)
      }
    } catch (e) {
      if (reqRef.current === reqId) setErr(e instanceof Error ? e.message : String(e))
    } finally {
      if (reqRef.current === reqId) setLoading(false)
    }
  }

  // auto-load cached / fetch plan when month or location changes
  useEffect(() => {
    setPlan(null)
    setErr(null)
    void loadPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey])

  return (
    <div className="card">
      <div className="section-head">
        <h3>{t('cal.suggest')} — {monthLabel}</h3>
        {loc && canCallAi() && (
          <button className="btn small" onClick={() => void loadPlan(true)} disabled={loading}>
            {t('cal.refresh')}
          </button>
        )}
      </div>
      {!loc && <p className="muted small">{t('cal.loc.none')}</p>}
      {loc && !loadSettings().apiKey.trim() && <ApiKeyGate />}
      {loading && <Spinner label={t('cal.suggest.load')} />}
      {err && <ErrorBox message={err} />}
      {err && !loading && (
        <button className="btn" onClick={() => void loadPlan(true)}>{t('err.retry')}</button>
      )}
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
  )
}
