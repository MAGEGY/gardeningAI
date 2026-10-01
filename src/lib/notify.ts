import { todayISO } from './garden'

const NOTIF_LAST = 'gardening.notif.last'

/** Fire at most one browser notification per day about due garden tasks. */
export function notifyDueTasks(count: number, body: string): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (localStorage.getItem(NOTIF_LAST) === todayISO()) return
  localStorage.setItem(NOTIF_LAST, todayISO())
  const opts = { body: `${count} ${body}`, icon: `${import.meta.env.BASE_URL}icon.svg` }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification('Gardening AI', opts))
      .catch(() => { try { new Notification('Gardening AI', opts) } catch { /* unsupported */ } })
  } else {
    try { new Notification('Gardening AI', opts) } catch { /* unsupported */ }
  }
}
