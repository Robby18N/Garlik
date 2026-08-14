import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Today's Patient only has two buckets (Today / Tomorrow tabs), so a newly
// booked appointment — from Registration's "make appointment" flow or the
// standalone MakeAppointmentDialog — needs to land in whichever one matches
// its date instead of always defaulting to Today. `dateStr` is the native
// <input type="date"> value ("YYYY-MM-DD"); parsed with an explicit local
// midnight so this doesn't drift a day depending on the browser's timezone.
export function resolveDayBucket(dateStr) {
  if (!dateStr) return 'today'
  const target = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(target.getTime())) return 'today'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return target.getTime() === today.getTime() ? 'today' : 'tomorrow'
}
