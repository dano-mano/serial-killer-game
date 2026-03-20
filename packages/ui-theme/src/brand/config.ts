/**
 * Brand configuration for the application.
 * Centralized branding values consumed by UI components and metadata.
 *
 * This file is the single source of truth for brand identity (Constitution Principle IV).
 * Update this file to change branding across the entire application.
 */

export const brandConfig = {
  name: 'Serial Killer Game',
  shortName: 'SKG',
  description: 'A browser-based roguelite where killers hunt against federal agents.',
  themeColor: '#0a0a0f',
} as const

export type BrandConfig = typeof brandConfig
