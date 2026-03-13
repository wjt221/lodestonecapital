import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { createHash, randomBytes } from 'crypto'

/**
 * Merge Tailwind CSS class names with conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as a currency string.
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a number as a currency string with decimal precision.
 */
export function formatCurrencyFull(amount: number, currency = 'USD', decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

/**
 * Format a number as a percentage string.
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format a date as a human-readable string.
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a date with time as a human-readable string.
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

/**
 * Format a number as a compact currency (e.g., $1.2M, $500K).
 */
export function formatCompactCurrency(amount: number, currency = 'USD'): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  const symbol = currency === 'USD' ? '$' : currency + ' '

  if (abs >= 1_000_000_000) {
    return `${sign}${symbol}${(abs / 1_000_000_000).toFixed(1)}B`
  } else if (abs >= 1_000_000) {
    return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`
  } else if (abs >= 1_000) {
    return `${sign}${symbol}${(abs / 1_000).toFixed(0)}K`
  }
  return formatCurrency(amount, currency)
}

/**
 * Compute SHA-256 hash of a buffer or string.
 */
export function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Generate a cryptographically secure random hex ID.
 */
export function generateSecureId(bytes = 16): string {
  return randomBytes(bytes).toString('hex')
}

/**
 * Mask an email address for display (e.g., jo***@example.com).
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  const visible = Math.min(2, local.length)
  return `${local.slice(0, visible)}***@${domain}`
}

/**
 * Mask a phone number (keep last 4 digits).
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `***-***-${digits.slice(-4)}`
}

/**
 * Calculate the fiscal quarter string for a given date.
 */
export function calculateQuarter(date: Date = new Date()): string {
  const q = Math.floor(date.getMonth() / 3) + 1
  return `${date.getFullYear()}-Q${q}`
}

/**
 * Parse a quarter string (e.g. "2024-Q3") into start/end dates.
 */
export function parseQuarter(quarter: string): { start: Date; end: Date } {
  const match = quarter.match(/^(\d{4})-Q([1-4])$/)
  if (!match) throw new Error(`Invalid quarter format: ${quarter}`)
  const year = parseInt(match[1])
  const q = parseInt(match[2])
  const startMonth = (q - 1) * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999)
  return { start, end }
}

/**
 * Add months to a date.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * Add days to a date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Check if a date is in the past.
 */
export function isPastDate(date: Date): boolean {
  return date < new Date()
}

/**
 * Check if a date is within N days from now.
 */
export function isWithinDays(date: Date, days: number): boolean {
  const now = new Date()
  const future = addDays(now, days)
  return date >= now && date <= future
}

/**
 * Sanitize a filename to be safe for storage.
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255)
}

/**
 * Paginate an array of items.
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; total: number; pages: number; page: number } {
  const total = items.length
  const pages = Math.ceil(total / pageSize)
  const offset = (page - 1) * pageSize
  return { items: items.slice(offset, offset + pageSize), total, pages, page }
}

/**
 * Omit specific keys from an object.
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((k) => delete result[k])
  return result as Omit<T, K>
}

/**
 * Pick specific keys from an object.
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((k) => {
    result[k] = obj[k]
  })
  return result
}

/**
 * Deep clone a plain object (no functions, dates are cloned as ISO strings).
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Convert Decimal-like values (Prisma Decimal) to number.
 */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  // Prisma Decimal
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber()
  }
  return Number(value)
}

/**
 * Slugify a string (lowercase, hyphenated).
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Group an array of objects by a key.
 */
export function groupBy<T extends object>(
  items: T[],
  key: keyof T
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const groupKey = String(item[key])
      if (!acc[groupKey]) acc[groupKey] = []
      acc[groupKey].push(item)
      return acc
    },
    {} as Record<string, T[]>
  )
}

/**
 * Calculate IRR using Newton's method approximation.
 * cashFlows: array starting with initial investment (negative) followed by returns.
 */
export function calculateIRR(cashFlows: number[], tolerance = 1e-7, maxIterations = 1000): number | null {
  let rate = 0.1 // initial guess 10%

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let dnpv = 0

    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t)
      npv += cashFlows[t] / factor
      dnpv -= (t * cashFlows[t]) / (factor * (1 + rate))
    }

    if (Math.abs(dnpv) < 1e-12) return null
    const newRate = rate - npv / dnpv
    if (Math.abs(newRate - rate) < tolerance) return newRate
    rate = newRate
  }

  return null
}

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Check if a string is a valid CUID.
 */
export function isCuid(value: string): boolean {
  return /^c[a-z0-9]{24}$/.test(value)
}

/**
 * Build a safe S3 object key from path segments.
 */
export function buildS3Key(...segments: string[]): string {
  return segments
    .map((s) => s.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
}

/**
 * Convert a Date to ISO 8601 date string (YYYY-MM-DD).
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}
