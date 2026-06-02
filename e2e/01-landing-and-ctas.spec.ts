import { test, expect } from '@playwright/test'

test.describe('Landing page CTAs', () => {
  test('renders headline and primary CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /você não está enviando arquivos/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /começar grátis/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /entrar$/i })).toBeVisible()
  })

  test('Começar grátis goes to /register?plan=free', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /começar grátis/i }).first().click()
    await expect(page).toHaveURL(/\/register\?plan=free/)
    await expect(page.getByText(/plano selecionado: grátis/i)).toBeVisible()
  })

  test('Assinar Pro opens WhatsApp with pre-filled message', async ({ page }) => {
    await page.goto('/#pricing')
    const cta = page.getByRole('link', { name: /^assinar pro$/i })
    await expect(cta).toBeVisible()
    const href = await cta.getAttribute('href')
    expect(href).toContain('wa.me/5511939369341')
    expect(href).toContain('Pro')
  })

  test('Falar com vendas opens WhatsApp with Empresarial context', async ({ page }) => {
    await page.goto('/#pricing')
    const cta = page.getByRole('link', { name: /falar com vendas/i })
    await expect(cta).toBeVisible()
    const href = await cta.getAttribute('href')
    expect(href).toContain('wa.me/5511939369341')
    expect(href).toContain('Empresarial')
  })

  test('Termos e Privacidade load with 2026 date and gmail contact', async ({ page }) => {
    await page.goto('/termos')
    await expect(page.getByRole('heading', { name: /termos de uso/i })).toBeVisible()
    await expect(page.getByText(/junho de 2026/i)).toBeVisible()
    await expect(page.getByText('logipilot@gmail.com').first()).toBeVisible()

    await page.goto('/privacidade')
    await expect(page.getByRole('heading', { name: /política de privacidade/i })).toBeVisible()
    await expect(page.getByText(/junho de 2026/i)).toBeVisible()
    await expect(page.getByText('logipilot@gmail.com').first()).toBeVisible()
  })

  test('404 page is rendered for unknown routes', async ({ page }) => {
    const response = await page.goto('/rota-inexistente-' + Date.now())
    expect(response?.status()).toBe(404)
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByRole('link', { name: /ir para o início/i })).toBeVisible()
  })
})
