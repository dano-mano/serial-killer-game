import { err as neverthrowErr } from 'neverthrow'
import type { ErrorCategory } from '../constants/errors'

export type { Result, ResultAsync } from 'neverthrow'

/**
 * Creates a success Result wrapping the provided value.
 * Re-exported from neverthrow for consistent import paths.
 */
export { ok, err } from 'neverthrow'

/** Shape of an application error with category, message, and optional metadata. */
export interface AppErrorShape {
  readonly category: ErrorCategory
  readonly message: string
  readonly code?: string | undefined
  readonly cause?: unknown
}

/**
 * Typed application error for use with the Result pattern.
 * Always use factory methods to construct instances.
 *
 * Factory methods return `err(new AppError(...))` — a neverthrow Err result —
 * ready for direct return from DAL functions and game systems.
 */
export class AppError extends Error implements AppErrorShape {
  readonly category: ErrorCategory
  readonly code?: string | undefined
  override readonly cause?: unknown

  constructor({
    category,
    message,
    code,
    cause,
  }: AppErrorShape) {
    super(message)
    this.name = 'AppError'
    this.category = category
    this.code = code
    this.cause = cause
  }

  /** Creates a validation error result — input failed schema validation. */
  static validation(message: string, code?: string) {
    return neverthrowErr(
      new AppError({ category: 'VALIDATION', message, code }),
    )
  }

  /** Creates a not-found error result — requested resource does not exist. */
  static notFound(message: string, code?: string) {
    return neverthrowErr(
      new AppError({ category: 'NOT_FOUND', message, code }),
    )
  }

  /** Creates an unauthorized error result — request lacks valid authentication. */
  static unauthorized(message: string, code?: string) {
    return neverthrowErr(
      new AppError({ category: 'UNAUTHORIZED', message, code }),
    )
  }

  /** Creates a forbidden error result — authenticated but insufficient permissions. */
  static forbidden(message: string, code?: string) {
    return neverthrowErr(
      new AppError({ category: 'FORBIDDEN', message, code }),
    )
  }

  /** Creates a database error result — database operation failed. */
  static database(message: string, cause?: unknown, code?: string) {
    return neverthrowErr(
      new AppError({ category: 'DATABASE', message, code, cause }),
    )
  }

  /** Creates an internal error result — unexpected internal error. */
  static internal(message: string, cause?: unknown, code?: string) {
    return neverthrowErr(
      new AppError({ category: 'INTERNAL', message, code, cause }),
    )
  }
}
