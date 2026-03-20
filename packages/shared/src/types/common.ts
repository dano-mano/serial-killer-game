/**
 * Base TypeScript types shared across all packages.
 * These are the foundational types that all domain-specific types build upon.
 */

/** UUID v4 string identifier. All entity primary/foreign keys use this type. */
export type ID = string

/** ISO 8601 datetime string (e.g., "2026-03-18T12:00:00.000Z"). All timestamps use this type. */
export type Timestamp = string

/** Base shape for all data transfer objects returned by the Data Access Layer. */
export interface BaseDto {
  id: ID
  createdAt: Timestamp
  updatedAt: Timestamp
}
