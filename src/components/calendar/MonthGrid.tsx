import { useMemo, useRef } from 'react'
import { useI18n } from '../../i18n'
import { tasksInRange, toISODate, todayISO } from '../../lib/garden'
import type { GardenTask } from '../../types'

export default function MonthGrid({
  cursor,
  locale,
  selected,
  tasks,
  onMove,
  onSelect,
  onToday,
}: {
  cursor: { y: number; m: number }
  locale: string
  selected: string
  tasks: GardenTask[]
  onMove: (delta: number) => void
  onSelect: (iso: string) => void
  onToday: () => void
}) {
  const { t } = useI18n()
  const touchX = useRef<number | null>(null)

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

  const today = todayISO()
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(cursor.y, cursor.m, 1),
  )

  return (
    <div className="card">
      <div className="cal-head">
        <button className="btn small" onClick={() => onMove(-1)} aria-label="previous month">‹</button>
        <h2>{monthLabel}</h2>
        <button className="btn small" onClick={() => onMove(1)} aria-label="next month">›</button>
        <button className="btn small ghost" onClick={onToday}>{t('cal.today')}</button>
      </div>
      <div
        className="cal-grid"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          touchX.current = null
          if (Math.abs(dx) > 60) onMove(dx > 0 ? -1 : 1)
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
              onClick={() => onSelect(iso)}
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
  )
}
