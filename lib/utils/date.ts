export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`
}

export function formatDateForInput(dateString: string): string {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

export function formatTimeForInput(dateString: string): string {
  const date = new Date(dateString)
  return date.toTimeString().substring(0, 5)
}

export function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function isFuture(dateString: string): boolean {
  const date = new Date(dateString)
  return date > new Date()
}

export function isPast(dateString: string): boolean {
  const date = new Date(dateString)
  return date < new Date()
}

export function daysUntil(dateString: string): number {
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = date.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}