import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

/**
 * Home page smoke test.
 *
 * Verifies the page component renders the expected heading.
 * Uses React 19's async render — render() must be awaited.
 */
describe('HomePage', () => {
  it('renders the game title heading', async () => {
    await render(<HomePage />)

    expect(screen.getByRole('heading', { name: 'Serial Killer Game' })).toBeInTheDocument()
  })
})
