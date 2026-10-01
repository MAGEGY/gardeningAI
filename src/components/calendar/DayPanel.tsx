import { useState } from 'react'
import { EmptyState } from '../Status'
import { CalendarIcon } from '../icons'
import { useI18n } from '../../i18n'
import { TASK_KINDS, addTask, markTaskDone, removeTask, tasksOnDay, todayISO } from '../../lib/garden'
import type { GardenPlant, GardenTask, TaskKind } from '../../types'

export default function DayPanel({
  selected,
  locale,
  tasks,
  plants,
  onChanged,
}: {
  selected: string
  locale: string
  tasks: GardenTask[]
  plants: GardenPlant[]
  onChanged: () => void
}) {
  const { t } = useI18n()
  const today = todayISO()

  const [showForm, setShowForm] = useState(false)
  const [kind, setKind] = useState<TaskKind>('water')
  const [plant, setPlant] = useState('')
  const [date, setDate] = useState(selected)
  const [every, setEvery] = useState('')
  const [note, setNote] = useState('')

  const dayTasks = tasksOnDay(tasks, selected)
  const plantName = (id?: string) => plants.find((p) => p.id === id)?.name

  const submit = () => {
    if (!date) return
    const days = parseInt(every, 10)
    const pname = plantName(plant || undefined)
    addTask({
      plantId: plant || undefined,
      kind,
      title: pname ? `${t(`task.${kind}`)} — ${pname}` : t(`task.${kind}`),
      everyDays: days > 0 ? days : undefined,
      nextDue: date,
      note: note.trim() || undefined,
    })
    setNote('')
    setEvery('')
    setShowForm(false)
    onChanged()
  }

  return (
    <div className="card">
      <div className="section-head">
        <h3>
          {new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(
            new Date(`${selected}T12:00:00`),
          )}
        </h3>
        <button className="btn small" onClick={() => setShowForm((v) => !v)}>
          {t('cal.addTask')}
        </button>
      </div>

      {dayTasks.length === 0 && !showForm && (
        <EmptyState icon={<CalendarIcon width={26} height={26} />} text={t('cal.noDayTasks')} />
      )}
      {dayTasks.map((tk) => (
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
              <button
                className="btn small primary"
                onClick={() => {
                  markTaskDone(tk.id)
                  onChanged()
                }}
              >
                {t('cal.doneBtn')}
              </button>
            )}
            <button
              className="btn small ghost"
              onClick={() => {
                removeTask(tk.id)
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
              <span>{t('cal.addTask')}</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as TaskKind)}>
                {TASK_KINDS.map((k) => (
                  <option key={k} value={k}>{t(`task.${k}`)}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t('cal.plant')}</span>
              <select value={plant} onChange={(e) => setPlant(e.target.value)}>
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
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field">
              <span>{t('cal.every')}</span>
              <input
                type="number"
                min="0"
                placeholder={t('cal.once')}
                value={every}
                onChange={(e) => setEvery(e.target.value)}
                dir="ltr"
              />
            </label>
          </div>
          <label className="field">
            <span>{t('cal.note')}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="btn-row">
            <button className="btn primary" onClick={submit}>{t('cal.save')}</button>
            <button className="btn" onClick={() => setShowForm(false)}>{t('cal.cancel')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
