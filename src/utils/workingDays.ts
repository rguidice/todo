import { DUE_DATE_COLORS } from '../types'

/**
 * Count working days (Mon-Fri) remaining between today and the target date.
 * Returns 0 for today, negative for overdue.
 */
export function getWorkingDaysRemaining(dateStr: string): number {
  // Parse with T00:00:00 to force local timezone interpretation
  const target = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const targetTime = target.getTime()
  const todayTime = today.getTime()

  if (targetTime === todayTime) return 0

  const forward = targetTime > todayTime
  const start = forward ? today : target
  const end = forward ? target : today

  let workingDays = 0
  const current = new Date(start)
  current.setDate(current.getDate() + 1) // Start counting from day after start

  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
      workingDays++
    }
    current.setDate(current.getDate() + 1)
  }

  return forward ? workingDays : -workingDays
}

/**
 * Get severity level based on working days remaining.
 */
export function getDueDateSeverity(workingDays: number): 'normal' | 'warning' | 'urgent' {
  if (workingDays <= 0) return 'urgent'
  if (workingDays <= 2) return 'warning'
  return 'normal'
}

/**
 * Get the color for a due date severity level.
 */
export function getDueDateColor(workingDays: number): string {
  const severity = getDueDateSeverity(workingDays)
  return DUE_DATE_COLORS[severity]
}

/**
 * Format a date string as short date: "M/D"
 */
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * Format working days remaining: "3d", "0d", "-2d"
 */
export function formatWorkingDays(workingDays: number): string {
  return `${workingDays}d`
}
