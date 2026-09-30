import { beforeEach, describe, expect, it } from 'vitest'
import {
  addPlant,
  addTask,
  dueTasks,
  loadPlants,
  loadTasks,
  markTaskDone,
  removePlant,
  tasksInRange,
  tasksOnDay,
  todayISO,
  toISODate,
} from './garden'
import type { GardenTask } from '../types'
import { mockLocalStorage } from '../test/mockStorage'

beforeEach(() => {
  mockLocalStorage()
})

function iso(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return toISODate(d)
}

function makeTask(overrides: Partial<GardenTask> = {}): Omit<GardenTask, 'id'> {
  return {
    kind: 'water',
    title: 'Water the basil',
    nextDue: iso(0),
    ...overrides,
  }
}

describe('date helpers', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toISODate(new Date(2026, 10, 30))).toBe('2026-11-30')
  })

  it('todayISO matches today', () => {
    expect(todayISO()).toBe(toISODate(new Date()))
  })
})

describe('plants', () => {
  it('adds plants with generated ids', () => {
    const p = addPlant({ name: 'Bay laurel' })
    expect(loadPlants()).toHaveLength(1)
    expect(loadPlants()[0].id).toBe(p.id)
    expect(loadPlants()[0].createdAt).toBeGreaterThan(0)
  })

  it('removePlant deletes only the target plant', () => {
    const a = addPlant({ name: 'A' })
    addPlant({ name: 'B' })
    removePlant(a.id)
    expect(loadPlants().map((p) => p.name)).toEqual(['B'])
  })
})

describe('tasks', () => {
  it('tasksOnDay returns only tasks due that day', () => {
    const a = addTask(makeTask({ nextDue: iso(0) }))
    addTask(makeTask({ nextDue: iso(1) }))
    expect(tasksOnDay(loadTasks(), iso(0)).map((t) => t.id)).toEqual([a.id])
  })

  it('dueTasks includes overdue and today, excludes future and done', () => {
    addTask(makeTask({ nextDue: iso(-2) }))
    addTask(makeTask({ nextDue: iso(0) }))
    addTask(makeTask({ nextDue: iso(3) }))
    addTask(makeTask({ nextDue: iso(-1), done: true }))
    expect(dueTasks(loadTasks())).toHaveLength(2)
  })

  it('markTaskDone completes a one-time task', () => {
    const t = addTask(makeTask())
    markTaskDone(t.id)
    const updated = loadTasks().find((x) => x.id === t.id)
    expect(updated?.done).toBe(true)
    expect(updated?.lastDone).toBe(todayISO())
  })

  it('markTaskDone reschedules a recurring task from today', () => {
    const t = addTask(makeTask({ everyDays: 7, nextDue: iso(-1) }))
    markTaskDone(t.id)
    const updated = loadTasks().find((x) => x.id === t.id)
    expect(updated?.done).toBeFalsy()
    expect(updated?.lastDone).toBe(todayISO())
    expect(updated?.nextDue).toBe(iso(7))
  })

  it('markTaskDone ignores unknown ids', () => {
    markTaskDone('nope')
    expect(loadTasks()).toHaveLength(0)
  })
})

describe('tasksInRange', () => {
  it('buckets tasks by day within the inclusive range', () => {
    addTask(makeTask({ nextDue: iso(-1) }))
    addTask(makeTask({ nextDue: iso(0) }))
    addTask(makeTask({ nextDue: iso(0) }))
    addTask(makeTask({ nextDue: iso(2) }))
    const map = tasksInRange(loadTasks(), iso(0), iso(1))
    expect(map.get(iso(0))).toHaveLength(2)
    expect(map.has(iso(-1))).toBe(false)
    expect(map.has(iso(2))).toBe(false)
  })
})
