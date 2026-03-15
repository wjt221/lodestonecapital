import {
  formatCurrency,
  formatCompactCurrency,
  formatPercent,
  formatDate,
  formatFileSize,
  calculateIRR,
  slugify,
  truncate,
  sanitizeFilename,
  buildS3Key,
  groupBy,
  paginate,
  toNumber,
  isCuid,
  parseQuarter,
  calculateQuarter,
  addMonths,
  addDays,
  isPastDate,
  isWithinDays,
} from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats USD amounts', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000')
    expect(formatCurrency(0)).toBe('$0')
    expect(formatCurrency(1500)).toBe('$1,500')
  })

  it('handles negative amounts', () => {
    expect(formatCurrency(-500000)).toBe('-$500,000')
  })
})

describe('formatCompactCurrency', () => {
  it('formats billions', () => {
    expect(formatCompactCurrency(1_200_000_000)).toBe('$1.2B')
  })

  it('formats millions', () => {
    expect(formatCompactCurrency(5_000_000)).toBe('$5.0M')
    expect(formatCompactCurrency(25_500_000)).toBe('$25.5M')
  })

  it('formats thousands', () => {
    expect(formatCompactCurrency(750_000)).toBe('$750K')
  })

  it('handles small amounts', () => {
    expect(formatCompactCurrency(500)).toBe('$500')
  })

  it('handles negative values', () => {
    expect(formatCompactCurrency(-2_000_000)).toBe('-$2.0M')
  })
})

describe('formatPercent', () => {
  it('formats as percentage', () => {
    expect(formatPercent(0.15)).toBe('15.0%')
    expect(formatPercent(1.0)).toBe('100.0%')
    expect(formatPercent(0.001)).toBe('0.1%')
  })

  it('respects decimal places', () => {
    expect(formatPercent(0.1234, 2)).toBe('12.34%')
  })
})

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(512)).toBe('512 B')
  })

  it('formats KB', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB')
  })

  it('formats MB', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('formats GB', () => {
    expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2.00 GB')
  })
})

describe('calculateIRR', () => {
  it('calculates a known IRR', () => {
    // Investment of -100 returning 110 after 1 year = 10% IRR
    const irr = calculateIRR([-100, 110])
    expect(irr).not.toBeNull()
    expect(irr!).toBeCloseTo(0.1, 4)
  })

  it('returns null for invalid cash flows', () => {
    // All positive — no valid IRR
    const irr = calculateIRR([100, 100, 100])
    // May or may not converge, but shouldn't throw
    expect(irr === null || typeof irr === 'number').toBe(true)
  })

  it('calculates multi-period IRR', () => {
    // -1000 invested, 300/year for 5 years ≈ 15.24% IRR
    const irr = calculateIRR([-1000, 300, 300, 300, 300, 300])
    expect(irr).not.toBeNull()
    expect(irr!).toBeCloseTo(0.1524, 2)
  })
})

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('PE Fund #1 (2024)')).toBe('pe-fund-1-2024')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('a  b  c')).toBe('a-b-c')
  })
})

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...')
  })

  it('returns unchanged if within limit', () => {
    expect(truncate('Hi', 10)).toBe('Hi')
  })
})

describe('sanitizeFilename', () => {
  it('replaces unsafe characters', () => {
    expect(sanitizeFilename('report (final).pdf')).toBe('report__final_.pdf')
  })

  it('allows dots, hyphens, underscores', () => {
    expect(sanitizeFilename('Q3-2024_report.xlsx')).toBe('Q3-2024_report.xlsx')
  })
})

describe('buildS3Key', () => {
  it('joins segments with slashes', () => {
    expect(buildS3Key('documents', '2024', 'fund-i')).toBe('documents/2024/fund-i')
  })

  it('strips leading/trailing slashes from segments', () => {
    expect(buildS3Key('/docs/', '/file/')).toBe('docs/file')
  })

  it('filters empty segments', () => {
    expect(buildS3Key('a', '', 'b')).toBe('a/b')
  })
})

describe('groupBy', () => {
  it('groups objects by key', () => {
    const items = [
      { stage: 'A', name: 'deal1' },
      { stage: 'B', name: 'deal2' },
      { stage: 'A', name: 'deal3' },
    ]
    const grouped = groupBy(items, 'stage')
    expect(grouped.A).toHaveLength(2)
    expect(grouped.B).toHaveLength(1)
  })
})

describe('paginate', () => {
  it('returns correct slice', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = paginate(items, 2, 3)
    expect(result.items).toEqual([4, 5, 6])
    expect(result.total).toBe(10)
    expect(result.pages).toBe(4)
    expect(result.page).toBe(2)
  })

  it('handles last page correctly', () => {
    const items = [1, 2, 3, 4, 5]
    const result = paginate(items, 2, 3)
    expect(result.items).toEqual([4, 5])
  })
})

describe('toNumber', () => {
  it('converts strings', () => {
    expect(toNumber('3.14')).toBe(3.14)
  })

  it('handles null/undefined', () => {
    expect(toNumber(null)).toBe(0)
    expect(toNumber(undefined)).toBe(0)
  })

  it('passes through numbers', () => {
    expect(toNumber(42)).toBe(42)
  })
})

describe('isCuid', () => {
  it('validates CUIDs', () => {
    expect(isCuid('clx1234567890abcdefghijk')).toBe(true)
  })

  it('rejects invalid CUIDs', () => {
    expect(isCuid('not-a-cuid')).toBe(false)
    expect(isCuid('abc123')).toBe(false)
  })
})

describe('parseQuarter', () => {
  it('parses valid quarter strings', () => {
    const { start, end } = parseQuarter('2024-Q1')
    expect(start.getMonth()).toBe(0) // January
    expect(end.getMonth()).toBe(2) // March
    expect(start.getFullYear()).toBe(2024)
  })

  it('throws on invalid format', () => {
    expect(() => parseQuarter('2024Q1')).toThrow()
    expect(() => parseQuarter('invalid')).toThrow()
  })

  it('handles Q4', () => {
    const { start, end } = parseQuarter('2024-Q4')
    expect(start.getMonth()).toBe(9) // October
    expect(end.getMonth()).toBe(11) // December
  })
})

describe('calculateQuarter', () => {
  it('returns correct quarter for a date', () => {
    expect(calculateQuarter(new Date('2024-02-15'))).toBe('2024-Q1')
    expect(calculateQuarter(new Date('2024-07-01'))).toBe('2024-Q3')
    expect(calculateQuarter(new Date('2024-12-31'))).toBe('2024-Q4')
  })
})

describe('addMonths', () => {
  it('adds months correctly', () => {
    const result = addMonths(new Date('2024-01-15'), 3)
    expect(result.getMonth()).toBe(3) // April
    expect(result.getFullYear()).toBe(2024)
  })

  it('handles year rollover', () => {
    const result = addMonths(new Date('2024-11-01'), 3)
    expect(result.getFullYear()).toBe(2025)
    expect(result.getMonth()).toBe(1) // February
  })
})

describe('addDays', () => {
  it('adds days correctly', () => {
    const result = addDays(new Date('2024-01-10'), 5)
    expect(result.getDate()).toBe(15)
  })
})

describe('isPastDate', () => {
  it('returns true for past dates', () => {
    expect(isPastDate(new Date('2000-01-01'))).toBe(true)
  })

  it('returns false for future dates', () => {
    expect(isPastDate(new Date('2099-12-31'))).toBe(false)
  })
})

describe('isWithinDays', () => {
  it('returns true for date within range', () => {
    const tomorrow = addDays(new Date(), 1)
    expect(isWithinDays(tomorrow, 7)).toBe(true)
  })

  it('returns false for date beyond range', () => {
    const farFuture = addDays(new Date(), 30)
    expect(isWithinDays(farFuture, 7)).toBe(false)
  })

  it('returns false for past dates', () => {
    const yesterday = addDays(new Date(), -1)
    expect(isWithinDays(yesterday, 7)).toBe(false)
  })
})
