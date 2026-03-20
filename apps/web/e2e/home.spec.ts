import { test, expect } from 'playwright/test'

/**
 * Home page E2E smoke test.
 *
 * Verifies the application serves the home page and renders the expected
 * heading. This is the minimum viable E2E coverage for the scaffold —
 * it confirms the Next.js server starts, routing works, and the page renders.
 */
test('home page loads with expected heading', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Serial Killer Game' })).toBeVisible()
})
