// src/utils/formatters.ts
// Date/time formatting + Christ University name parsing utilities

import { format } from 'date-fns'

type TimestampLike = { toDate?: () => Date } | Date | number | string

function toDate(timestamp: TimestampLike): Date {
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }
  return new Date(timestamp as string | number | Date)
}

/**
 * Format a Firestore timestamp to readable date string
 * @param timestamp - Firestore timestamp or Date
 * @returns Formatted date (e.g. "Apr 25, 2026")
 */
export function formatDate(timestamp: TimestampLike | null | undefined): string {
  if (!timestamp) return ''
  return format(toDate(timestamp), 'MMM d, yyyy')
}

/**
 * Format a Firestore timestamp to readable date + time
 * @param timestamp - Firestore timestamp or Date
 * @returns Formatted date-time (e.g. "Apr 25, 2026 at 3:00 PM")
 */
export function formatDateTime(timestamp: TimestampLike | null | undefined): string {
  if (!timestamp) return ''
  return format(toDate(timestamp), "MMM d, yyyy 'at' h:mm a")
}

/**
 * Format time only (e.g. "3:00 PM")
 */
export function formatTime(timestamp: TimestampLike | null | undefined): string {
  if (!timestamp) return ''
  return format(toDate(timestamp), 'h:mm a')
}

/**
 * Get relative time (e.g. "2 hours ago", "in 3 days")
 */
export function timeAgo(timestamp: TimestampLike | null | undefined): string {
  if (!timestamp) return ''
  const date = toDate(timestamp)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/**
 * Get countdown string (e.g. "Ends in 25 mins", "Starts in 1hr 30mins")
 */
export function getCountdown(targetDate: TimestampLike | null | undefined): string {
  if (!targetDate) return ''
  const target = toDate(targetDate)
  const now = new Date()
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) return 'Already passed'

  const totalMinutes = Math.floor(diff / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  if (hours > 0 && mins > 0) return `${hours}hr ${mins}min`
  if (hours > 0) return `${hours}hr`
  return `${mins} min`
}

/**
 * Extract the registration number from a Christ University display name.
 * Format: "MANDAR SACHIN WAIGAONKAR 2460476" → "2460476"
 */
export function extractRegNumber(displayName: string | null | undefined): string {
  if (!displayName) return ''
  const parts = displayName.trim().split(/\s+/)
  const lastPart = parts[parts.length - 1]
  return /^\d+$/.test(lastPart) ? lastPart : ''
}

/**
 * Extract the clean name (without reg number) and title-case it.
 * "MANDAR SACHIN WAIGAONKAR 2460476" → "Mandar Sachin Waigaonkar"
 */
export function extractCleanName(displayName: string | null | undefined): string {
  if (!displayName) return displayName || ''
  const parts = displayName.trim().split(/\s+/)
  const lastPart = parts[parts.length - 1]
  const nameParts = /^\d+$/.test(lastPart) ? parts.slice(0, -1) : parts
  return nameParts
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
