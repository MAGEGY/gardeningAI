import { useState } from 'react'
import { EmptyState } from '../Status'
import { LeafIcon } from '../icons'
import { useI18n } from '../../i18n'
import { addPlant, addTask, removePlant, toISODate } from '../../lib/garden'
import type { GardenPlant } from '../../types'

export default function MyPlants({
  plants,
  onChanged,
}: {
  plants: GardenPlant[]
  onChanged: () => void
}) {
  const { t } = useI18n()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [water, setWater] = useState('7')

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const days = parseInt(water, 10)
    const plant = addPlant({
      name: trimmed,
      waterEveryDays: days > 0 ? days : undefined,
    })
    if (days > 0) {
      const due = new Date()
      due.setDate(due.getDate() + days)
      addTask({
        plantId: plant.id,
        kind: 'water',
        title: `${t('task.water')} — ${trimmed}`,
        everyDays: days,
        nextDue: toISODate(due),
      })
    }
    setName('')
    setShowForm(false)
    onChanged()
  }

  return (
    <div className="card">
      <div className="section-head">
        <h3>{t('cal.myPlants')}</h3>
        <button className="btn small" onClick={() => setShowForm((v) => !v)}>
          {t('cal.addPlant')}
        </button>
      </div>

      {plants.length === 0 && !showForm && (
        <EmptyState icon={<LeafIcon width={26} height={26} />} text={t('cal.noPlants')} />
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
            <button
              className="btn small ghost"
              onClick={() => {
                removePlant(p.id)
                onChanged()
              }}
            >
              {t('cal.delete')}
            </button>
          </span>
        </div>
      ))}

      {showForm && (
        <div className="form-box">
          <div className="form-row">
            <label className="field">
              <span>{t('cal.plantName')}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span>{t('cal.waterEvery')}</span>
              <input
                type="number"
                min="0"
                value={water}
                onChange={(e) => setWater(e.target.value)}
                dir="ltr"
              />
            </label>
          </div>
          <div className="btn-row">
            <button className="btn primary" onClick={submit} disabled={!name.trim()}>
              {t('cal.save')}
            </button>
            <button className="btn" onClick={() => setShowForm(false)}>{t('cal.cancel')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
