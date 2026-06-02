import { test, expect } from '@playwright/test'

test.describe('Route protection', () => {
  test('Anonymous user is redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
  })

  test('Anonymous user is redirected from /analysis/new to /login', async ({ page }) => {
    await page.goto('/analysis/new')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
  })

  test('Anonymous user is redirected from /history to /login', async ({ page }) => {
    await page.goto('/history')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
  })

  test('Anonymous user is redirected from /operador to /operador/login', async ({ page }) => {
    await page.goto('/operador')
    await page.waitForURL(/\/operador\/login/, { timeout: 10_000 })
  })

  test('Anonymous user is redirected from /motorista to /motorista/login', async ({ page }) => {
    await page.goto('/motorista')
    await page.waitForURL(/\/motorista\/login/, { timeout: 10_000 })
  })
})
