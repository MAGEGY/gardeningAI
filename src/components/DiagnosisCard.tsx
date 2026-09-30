import { useI18n } from '../i18n'
import type { Diagnosis } from '../types'

const HEALTH_CLASS: Record<string, string> = {
  healthy: 'green',
  mild: 'blue',
  moderate: 'amber',
  severe: 'red',
  critical: 'red',
}
const SEV_CLASS: Record<string, string> = { low: 'blue', moderate: 'amber', high: 'red' }
const URGENCY_CLASS: Record<string, string> = {
  low: 'green', medium: 'amber', high: 'red', immediate: 'red',
}

function List({ title, items, tint }: { title: string; items?: string[]; tint?: string }) {
  if (!items?.length) return null
  return (
    <section className={`sec${tint ? ` ${tint}` : ''}`}>
      <h3>{title}</h3>
      <ul className="ticks">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </section>
  )
}

export default function DiagnosisCard({ dx }: { dx: Diagnosis }) {
  const { t } = useI18n()

  if (!dx.isPlant) {
    return (
      <div className="card">
        <h2>{t('dx.noPlant')}</h2>
        <p>{dx.summary || t('plant.noMatch')}</p>
      </div>
    )
  }

  const healthy = dx.overallHealth === 'healthy' || dx.issues?.length === 0

  return (
    <div className="card result">
      <div className="result-head">
        <div>
          <h2>{healthy ? t('dx.healthy') : t('dx.diagnosis')}</h2>
          {dx.plantName && <em className="latin">{dx.plantName}</em>}
        </div>
        <div className="chips">
          <span className={`badge ${HEALTH_CLASS[dx.overallHealth] || ''}`}>
            {t(`dx.h.${dx.overallHealth}`)}
          </span>
          {dx.urgency && (
            <span className={`badge ${URGENCY_CLASS[dx.urgency] || ''}`}>
              {t('dx.urgency')}: {t(`dx.u.${dx.urgency}`)}
            </span>
          )}
        </div>
      </div>

      {dx.summary && <p className="lead">{dx.summary}</p>}

      {dx.issues?.map((issue, i) => (
        <div className="issue" key={i}>
          <div className="issue-head">
            <strong>{issue.name}</strong>
            <span className="badge gray">{t(`dx.type.${issue.type}`)}</span>
            <span className={`badge ${SEV_CLASS[issue.severity] || ''}`}>
              {t(`dx.sev.${issue.severity}`)}
            </span>
            {typeof issue.confidence === 'number' && (
              <small className="muted">{Math.round(issue.confidence * 100)}%</small>
            )}
          </div>
          {issue.description && <p>{issue.description}</p>}
          {issue.symptoms?.length > 0 && (
            <ul className="ticks compact">
              {issue.symptoms.map((s, j) => <li key={j}>{s}</li>)}
            </ul>
          )}
        </div>
      ))}

      {dx.treatment && (dx.treatment.immediate?.length || dx.treatment.organic?.length || dx.treatment.chemical?.length) ? (
        <section className="sec sec-amber">
          <h3>{t('dx.treatment')}</h3>
          <div className="treatment-grid">
            {dx.treatment.immediate?.length > 0 && (
              <div>
                <h4>{t('dx.doNow')}</h4>
                <ul className="ticks compact">
                  {dx.treatment.immediate.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {dx.treatment.organic?.length > 0 && (
              <div>
                <h4>{t('dx.organic')}</h4>
                <ul className="ticks compact">
                  {dx.treatment.organic.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {dx.treatment.chemical?.length > 0 && (
              <div>
                <h4>{t('dx.chemical')}</h4>
                <ul className="ticks compact">
                  {dx.treatment.chemical.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <List title={t('dx.prevention')} items={dx.prevention} tint="sec-teal" />

      {dx.recoveryPlan && (
        <section className="sec sec-blue">
          <h3>{t('dx.recovery')}</h3>
          <p>{dx.recoveryPlan}</p>
        </section>
      )}

      <p className="muted small">{t('dx.disclaimer')}</p>
    </div>
  )
}
