import { describe, expect, it } from 'vitest'
import { ok, err, AppError } from '../../src/utils/result'
import { ErrorCategory } from '../../src/constants/errors'

describe('ok()', () => {
  it('returns a success Result containing the provided value', () => {
    const result = ok('hello')

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toBe('hello')
  })

  it('wraps falsy values correctly', () => {
    const zero = ok(0)
    const falseResult = ok(false)
    const nullResult = ok(null)

    expect(zero.isOk()).toBe(true)
    expect(zero._unsafeUnwrap()).toBe(0)

    expect(falseResult.isOk()).toBe(true)
    expect(falseResult._unsafeUnwrap()).toBe(false)

    expect(nullResult.isOk()).toBe(true)
    expect(nullResult._unsafeUnwrap()).toBe(null)
  })

  it('wraps objects correctly', () => {
    const payload = { id: '123', name: 'test' }
    const result = ok(payload)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toEqual(payload)
  })
})

describe('err()', () => {
  it('returns a failure Result containing the provided error', () => {
    const error = new AppError({ category: 'VALIDATION', message: 'Invalid input' })
    const result = err(error)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toBe(error)
  })

  it('carries the error category and message', () => {
    const error = new AppError({ category: 'NOT_FOUND', message: 'Resource not found' })
    const result = err(error)

    const unwrapped = result._unsafeUnwrapErr()
    expect(unwrapped.category).toBe('NOT_FOUND')
    expect(unwrapped.message).toBe('Resource not found')
  })
})

describe('AppError', () => {
  describe('constructor', () => {
    it('creates an error with required fields', () => {
      const error = new AppError({ category: 'INTERNAL', message: 'Something went wrong' })

      expect(error.category).toBe('INTERNAL')
      expect(error.message).toBe('Something went wrong')
      expect(error.name).toBe('AppError')
    })

    it('creates an error with optional code and cause', () => {
      const cause = new Error('original')
      const error = new AppError({
        category: 'DATABASE',
        message: 'Query failed',
        code: 'DB_TIMEOUT',
        cause,
      })

      expect(error.code).toBe('DB_TIMEOUT')
      expect(error.cause).toBe(cause)
    })

    it('leaves optional fields undefined when not provided', () => {
      const error = new AppError({ category: 'FORBIDDEN', message: 'Access denied' })

      expect(error.code).toBeUndefined()
      expect(error.cause).toBeUndefined()
    })

    it('extends Error so it can be caught as an exception', () => {
      const error = new AppError({ category: 'INTERNAL', message: 'Error' })

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('AppError.validation()', () => {
    it('returns an Err result with VALIDATION category', () => {
      const result = AppError.validation('Name is required')

      expect(result.isErr()).toBe(true)
      const error = result._unsafeUnwrapErr()
      expect(error.category).toBe(ErrorCategory.VALIDATION)
      expect(error.message).toBe('Name is required')
    })

    it('accepts an optional error code', () => {
      const result = AppError.validation('Invalid email', 'EMAIL_FORMAT')

      const error = result._unsafeUnwrapErr()
      expect(error.code).toBe('EMAIL_FORMAT')
    })
  })

  describe('AppError.notFound()', () => {
    it('returns an Err result with NOT_FOUND category', () => {
      const result = AppError.notFound('User not found')

      expect(result.isErr()).toBe(true)
      const error = result._unsafeUnwrapErr()
      expect(error.category).toBe(ErrorCategory.NOT_FOUND)
      expect(error.message).toBe('User not found')
    })
  })

  describe('AppError.unauthorized()', () => {
    it('returns an Err result with UNAUTHORIZED category', () => {
      const result = AppError.unauthorized('Authentication required')

      expect(result.isErr()).toBe(true)
      const error = result._unsafeUnwrapErr()
      expect(error.category).toBe(ErrorCategory.UNAUTHORIZED)
      expect(error.message).toBe('Authentication required')
    })
  })

  describe('AppError.forbidden()', () => {
    it('returns an Err result with FORBIDDEN category', () => {
      const result = AppError.forbidden('Insufficient permissions')

      expect(result.isErr()).toBe(true)
      const error = result._unsafeUnwrapErr()
      expect(error.category).toBe(ErrorCategory.FORBIDDEN)
      expect(error.message).toBe('Insufficient permissions')
    })
  })

  describe('AppError.database()', () => {
    it('returns an Err result with DATABASE category', () => {
      const result = AppError.database('Connection failed')

      expect(result.isErr()).toBe(true)
      const error = result._unsafeUnwrapErr()
      expect(error.category).toBe(ErrorCategory.DATABASE)
      expect(error.message).toBe('Connection failed')
    })

    it('accepts an optional cause for debugging', () => {
      const cause = new Error('ECONNREFUSED')
      const result = AppError.database('Connection failed', cause)

      const error = result._unsafeUnwrapErr()
      expect(error.cause).toBe(cause)
    })

    it('accepts an optional error code', () => {
      const result = AppError.database('Query timeout', undefined, 'DB_TIMEOUT')

      const error = result._unsafeUnwrapErr()
      expect(error.code).toBe('DB_TIMEOUT')
    })
  })

  describe('AppError.internal()', () => {
    it('returns an Err result with INTERNAL category', () => {
      const result = AppError.internal('Unexpected state')

      expect(result.isErr()).toBe(true)
      const error = result._unsafeUnwrapErr()
      expect(error.category).toBe(ErrorCategory.INTERNAL)
      expect(error.message).toBe('Unexpected state')
    })

    it('accepts an optional cause', () => {
      const cause = new TypeError('Cannot read property')
      const result = AppError.internal('Unexpected state', cause)

      const error = result._unsafeUnwrapErr()
      expect(error.cause).toBe(cause)
    })
  })

  describe('serialization', () => {
    it('does not leak cause message to JSON (prevents leaking internal details)', () => {
      const cause = new Error('Internal DB error: connection refused at 10.0.0.1:5432')
      const error = new AppError({
        category: 'DATABASE',
        message: 'Query failed',
        code: 'DB_TIMEOUT',
        cause,
      })

      const serialized = JSON.parse(JSON.stringify(error))

      // The cause Error's message is not enumerable, so it does not appear in JSON.
      // Even if cause itself serializes, the sensitive internal message is not included.
      // This prevents internal infrastructure details from leaking to API clients.
      const causeStr = serialized.cause ? JSON.stringify(serialized.cause) : ''
      expect(causeStr).not.toContain('connection refused')
      expect(causeStr).not.toContain('10.0.0.1')
    })

    it('exposes category and code for client error handling', () => {
      const error = new AppError({
        category: 'VALIDATION',
        message: 'Bad input',
        code: 'INVALID_EMAIL',
      })

      expect(error.category).toBe('VALIDATION')
      expect(error.code).toBe('INVALID_EMAIL')
    })
  })
})
