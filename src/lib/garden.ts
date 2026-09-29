import type { GardenPlant, GardenTask, TaskKind } from '../types'

const PLANTS_KEY = 'gardening.plants.v1'
const TASKS_KEY = 'gardening.tasks.v1'

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}
function save(key: string, v: unknown) {
  localStorage.setItem(key, JSON.stringify(v))
}

/* ---------- plants ---------- */

export const loadPlants = (): GardenPlant[] => load<GardenPlant>(PLANTS_KEY)

export function addPlant(p: Omit<GardenPlant, 'id' | 'createdAt'>): GardenPlant {
  const plant: GardenPlant = { ...p, id: uid(), createdAt: Date.now() }
  save(PLANTS_KEY, [...loadPlants(), plant])
  return plant
}

export function removePlant(id: string): void {
  save(PLANTS_KEY, loadPlants().filter((p) => p.id !== id))
  // keep its tasks — they become plant-less standalone entries
}

/* ---------- tasks ---------- */

export const loadTasks = (): GardenTask[] => load<GardenTask>(TASKS_KEY)

export function addTask(t: Omit<GardenTask, 'id'>): GardenTask {
  const task: GardenTask = { ...t, id: uid() }
  save(TASKS_KEY, [...loadTasks(), task])
  return task
}

export function removeTask(id: string): void {
  save(TASKS_KEY, loadTasks().filter((t) => t.id !== id))
}

export function markTaskDone(id: string): void {
  const tasks = loadTasks()
  const t = tasks.find((x) => x.id === id)
  if (!t) return
  t.lastDone = todayISO()
  if (t.everyDays && t.everyDays > 0) {
    const d = new Date()
    d.setDate(d.getDate() + t.everyDays)
    t.nextDue = toISODate(d)
  } else {
    t.done = true
  }
  save(TASKS_KEY, tasks)
}

/** Active (not done) tasks due on a given ISO day. */
export function tasksOnDay(tasks: GardenTask[], day: string): GardenTask[] {
  return tasks.filter((t) => !t.done && t.nextDue === day)
}

/** Overdue or due-today tasks. */
export function dueTasks(tasks = loadTasks()): GardenTask[] {
  const today = todayISO()
  return tasks.filter((t) => !t.done && t.nextDue <= today)
}

/** Map of ISO day -> tasks for a whole month grid render. */
export function tasksInRange(tasks: GardenTask[], from: string, to: string): Map<string, GardenTask[]> {
  const map = new Map<string, GardenTask[]>()
  for (const t of tasks) {
    if (t.done || t.nextDue < from || t.nextDue > to) continue
    const arr = map.get(t.nextDue) ?? []
    arr.push(t)
    map.set(t.nextDue, arr)
  }
  return map
}

export const TASK_KINDS: TaskKind[] = [
  'water', 'fertilize', 'prune', 'repot', 'spray', 'harvest', 'sow', 'other',
]
