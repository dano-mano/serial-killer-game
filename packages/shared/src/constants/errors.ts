/**
 * Error category constants used by AppError throughout the application.
 * All error categories are defined here to ensure consistency across packages.
 */
export const ErrorCategory = {
  /** Input failed schema validation */
  VALIDATION: 'VALIDATION',
  /** Requested resource does not exist */
  NOT_FOUND: 'NOT_FOUND',
  /** Request lacks valid authentication */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** Authenticated but insufficient permissions */
  FORBIDDEN: 'FORBIDDEN',
  /** Database operation failed */
  DATABASE: 'DATABASE',
  /** Unexpected internal error */
  INTERNAL: 'INTERNAL',
} as const

export type ErrorCategory = (typeof ErrorCategory)[keyof typeof ErrorCategory]
