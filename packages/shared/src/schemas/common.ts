import { z } from 'zod'

/**
 * Validates UUID v4 string format.
 * Used at every boundary where entity IDs are received from clients.
 */
export const idSchema = z.uuid()

/**
 * Validates ISO 8601 datetime string format.
 * Used for query parameters and form inputs involving dates.
 */
export const timestampSchema = z.iso.datetime()

/**
 * Pagination parameters with sensible defaults and bounds.
 * Used by all list/query endpoints.
 */
export const paginationSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
  offset: z
    .number()
    .int()
    .nonnegative()
    .default(0),
})

export type PaginationParams = z.infer<typeof paginationSchema>
