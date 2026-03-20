import { describe, expect, it } from 'vitest'
import { idSchema, timestampSchema, paginationSchema } from '../../src/schemas/common'

describe('idSchema', () => {
  it('accepts a valid UUID v4', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'

    const result = idSchema.safeParse(uuid)

    expect(result.success).toBe(true)
  })

  it('accepts another valid UUID v4', () => {
    const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

    const result = idSchema.safeParse(uuid)

    expect(result.success).toBe(true)
  })

  it('rejects an empty string', () => {
    const result = idSchema.safeParse('')

    expect(result.success).toBe(false)
  })

  it('rejects a plain string that is not a UUID', () => {
    const result = idSchema.safeParse('not-a-uuid')

    expect(result.success).toBe(false)
  })

  it('rejects a UUID with wrong format (too short)', () => {
    const result = idSchema.safeParse('550e8400-e29b-41d4-a716')

    expect(result.success).toBe(false)
  })

  it('rejects a numeric value', () => {
    const result = idSchema.safeParse(12345)

    expect(result.success).toBe(false)
  })

  it('rejects null', () => {
    const result = idSchema.safeParse(null)

    expect(result.success).toBe(false)
  })
})

describe('timestampSchema', () => {
  it('accepts a valid ISO 8601 datetime string with timezone', () => {
    const timestamp = '2026-03-18T12:00:00.000Z'

    const result = timestampSchema.safeParse(timestamp)

    expect(result.success).toBe(true)
  })

  it('rejects an ISO 8601 datetime with a timezone offset (schema requires UTC)', () => {
    // The timestampSchema uses z.string().datetime() which requires UTC (Z suffix).
    // Non-UTC offsets like +01:00 are rejected. All timestamps should be stored as UTC.
    const timestamp = '2026-03-18T12:00:00+01:00'

    const result = timestampSchema.safeParse(timestamp)

    expect(result.success).toBe(false)
  })

  it('rejects a date-only string (no time component)', () => {
    const result = timestampSchema.safeParse('2026-03-18')

    expect(result.success).toBe(false)
  })

  it('rejects a malformed datetime string', () => {
    const result = timestampSchema.safeParse('not-a-date')

    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = timestampSchema.safeParse('')

    expect(result.success).toBe(false)
  })

  it('rejects a Date object (must be a string)', () => {
    const result = timestampSchema.safeParse(new Date())

    expect(result.success).toBe(false)
  })

  it('rejects a Unix timestamp number', () => {
    const result = timestampSchema.safeParse(1710763200000)

    expect(result.success).toBe(false)
  })
})

describe('paginationSchema', () => {
  it('applies default limit of 20 when not provided', () => {
    const result = paginationSchema.safeParse({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
    }
  })

  it('applies default offset of 0 when not provided', () => {
    const result = paginationSchema.safeParse({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.offset).toBe(0)
    }
  })

  it('accepts explicit limit within bounds', () => {
    const result = paginationSchema.safeParse({ limit: 50, offset: 0 })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(50)
    }
  })

  it('accepts the maximum allowed limit of 100', () => {
    const result = paginationSchema.safeParse({ limit: 100, offset: 0 })

    expect(result.success).toBe(true)
  })

  it('accepts limit of 1 (minimum positive integer)', () => {
    const result = paginationSchema.safeParse({ limit: 1, offset: 0 })

    expect(result.success).toBe(true)
  })

  it('rejects limit above maximum (101)', () => {
    const result = paginationSchema.safeParse({ limit: 101, offset: 0 })

    expect(result.success).toBe(false)
  })

  it('rejects limit of 0', () => {
    const result = paginationSchema.safeParse({ limit: 0, offset: 0 })

    expect(result.success).toBe(false)
  })

  it('rejects negative limit', () => {
    const result = paginationSchema.safeParse({ limit: -1, offset: 0 })

    expect(result.success).toBe(false)
  })

  it('accepts offset of 0', () => {
    const result = paginationSchema.safeParse({ limit: 20, offset: 0 })

    expect(result.success).toBe(true)
  })

  it('accepts a large positive offset', () => {
    const result = paginationSchema.safeParse({ limit: 20, offset: 1000 })

    expect(result.success).toBe(true)
  })

  it('rejects negative offset', () => {
    const result = paginationSchema.safeParse({ limit: 20, offset: -1 })

    expect(result.success).toBe(false)
  })

  it('rejects non-integer limit', () => {
    const result = paginationSchema.safeParse({ limit: 10.5, offset: 0 })

    expect(result.success).toBe(false)
  })

  it('rejects non-integer offset', () => {
    const result = paginationSchema.safeParse({ limit: 10, offset: 1.5 })

    expect(result.success).toBe(false)
  })
})
