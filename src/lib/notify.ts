import { todayISO } from './garden'

const NOTIF_LAST = 'gardening.notif.last'

/** Fire at most one browser notification per day about due garden tasks. */
export function notifyDueTasks(count: number, body: string): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (localStorage.getItem(NOTIF_LAST) === todayISO()) return
  localStorage.setItem(NOTIF_LAST, todayISO())
  new Notification('Gardening AI', { body: `${count} ${body}` })
}
