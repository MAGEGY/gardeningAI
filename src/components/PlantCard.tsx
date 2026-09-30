import { useI18n } from '../i18n'
import type { PlantProfile } from '../types'

function pct(n: number) {
  return `${Math.round(Math.min(1, Math.max(0, n)) * 100)}%`
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="info-item">
      <small>{label}</small>
      <span>{value}</span>
    </div>
  )
}

export default function PlantCard({
  plant,
  onSelectRelated,
}: {
  plant: PlantProfile
  onSelectRelated?: (name: string) => void
}) {
  const { t } = useI18n()

  if (!plant.identified) {
    return (
      <div className="card">
        <h2>{t('plant.notId')}</h2>
        <p>{plant.description || t('plant.noMatch')}</p>
        {plant.alternatives?.length > 0 && (
          <div className="chips">
            {plant.alternatives.map((a) => (
              <button key={a} className="chip" onClick={() => onSelectRelated?.(a)}>
                {a}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const toxic = /toxic|poison|harmful|irritant|سام|toxique|tóxica|giftig/i.test(plant.toxicity || '')

  return (
    <div className="card result">
      <div className="result-head">
        <div>
          <h2>{plant.commonName || t('plant.notId')}</h2>
          {plant.scientificName && <em className="latin">{plant.scientificName}</em>}
        </div>
        {typeof plant.confidence === 'number' && plant.confidence > 0 && (
          <div className="confidence" title={t('plant.match')}>
            <div className="confidence-bar">
              <span style={{ width: pct(plant.confidence) }} />
            </div>
            <small>
              {pct(plant.confidence)} {t('plant.match')}
            </small>
          </div>
        )}
      </div>

      <div className="chips">
        {plant.family && <span className="badge green">{plant.family}</span>}
        {plant.genus && <span className="badge">{plant.genus}</span>}
        {plant.growthHabit && <span className="badge">{plant.growthHabit}</span>}
        {plant.lifespan && <span className="badge">{plant.lifespan}</span>}
        {plant.bloomSeason && <span className="badge blue">{plant.bloomSeason}</span>}
        {plant.toxicity && (
          <span className={`badge ${toxic ? 'red' : 'green'}`}>{plant.toxicity}</span>
        )}
      </div>

      {plant.description && <p className="lead">{plant.description}</p>}

      {plant.characteristics?.length > 0 && (
        <section className="sec sec-green">
          <h3>{t('plant.characteristics')}</h3>
          <ul className="ticks">
            {plant.characteristics.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </section>
      )}

      <section className="sec sec-blue">
        <h3>{t('plant.irrigation')}</h3>
        <div className="info-grid">
          <InfoItem label={t('f.frequency')} value={plant.irrigation?.frequency} />
          <InfoItem label={t('f.amount')} value={plant.irrigation?.amount} />
          <InfoItem label={t('f.method')} value={plant.irrigation?.method} />
          <InfoItem label={t('f.notes')} value={plant.irrigation?.notes} />
        </div>
      </section>

      <section className="sec sec-amber">
        <h3>{t('plant.planting')}</h3>
        <div className="info-grid">
          <InfoItem label={t('f.season')} value={plant.planting?.season} />
          <InfoItem label={t('f.soil')} value={plant.planting?.soil} />
          <InfoItem label={t('f.depth')} value={plant.planting?.depth} />
          <InfoItem label={t('f.spacing')} value={plant.planting?.spacing} />
          <InfoItem label={t('f.sunlight')} value={plant.planting?.sunlight} />
          <InfoItem label={t('f.germination')} value={plant.planting?.germination} />
        </div>
      </section>

      <section className="sec sec-violet">
        <h3>{t('plant.care')}</h3>
        <div className="info-grid">
          <InfoItem label={t('f.sunlight')} value={plant.care?.sunlight} />
          <InfoItem label={t('f.soil')} value={plant.care?.soil} />
          <InfoItem label={t('f.temperature')} value={plant.care?.temperature} />
          <InfoItem label={t('f.humidity')} value={plant.care?.humidity} />
          <InfoItem label={t('f.fertilizer')} value={plant.care?.fertilizer} />
          <InfoItem label={t('f.pruning')} value={plant.care?.pruning} />
        </div>
      </section>

      {plant.uses?.length > 0 && (
        <section className="sec sec-teal">
          <h3>{t('plant.uses')}</h3>
          <ul className="ticks">
            {plant.uses.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        </section>
      )}

      {plant.notes?.length > 0 && (
        <section className="sec sec-rose">
          <h3>{t('plant.notes')}</h3>
          <ul className="ticks">
            {plant.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </section>
      )}

      {plant.alternatives?.length > 0 && (
        <section className="sec sec-gray">
          <h3>{t('plant.alsoBe')}</h3>
          <div className="chips">
            {plant.alternatives.map((a) => (
              <button key={a} className="chip" onClick={() => onSelectRelated?.(a)}>
                {a}
              </button>
            ))}
          </div>
        </section>
      )}

      {plant.relatedPlants?.length > 0 && (
        <section className="sec sec-gray">
          <h3>{t('plant.related')}</h3>
          <div className="chips">
            {plant.relatedPlants.map((r) => (
              <button key={r} className="chip" onClick={() => onSelectRelated?.(r)}>
                {r}
              </button>
            ))}
          </div>
        </section>
      )}

      {plant.nativeRegion && (
        <p className="muted small">
          {t('plant.native')} {plant.nativeRegion}
        </p>
      )}
    </div>
  )
}
