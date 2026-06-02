import { test, expect } from '@playwright/test'
import { signUpAsGestor, login, uniqueEmail } from './helpers/auth'

test.describe('Auth flow', () => {
  test('Register: required field validation', async ({ page }) => {
    await page.goto('/register?plan=free')

    // Submit without filling anything (form has noValidate, so client validation kicks in)
    await page.getByRole('button', { name: /^criar conta/i }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('Register: invalid email', async ({ page }) => {
    await page.goto('/register?plan=free')
    await page.getByLabel('Seu nome').fill('QA')
    await page.getByLabel('E-mail').fill('not-an-email')
    await page.getByLabel('Senha').fill('senha123')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /^criar conta/i }).click()
    await expect(page.getByRole('alert')).toContainText(/e-mail inválido/i)
  })

  test('Register: short password', async ({ page }) => {
    await page.goto('/register?plan=free')
    await page.getByLabel('Seu nome').fill('QA')
    await page.getByLabel('E-mail').fill(uniqueEmail())
    await page.getByLabel('Senha').fill('abc')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /^criar conta/i }).click()
    await expect(page.getByRole('alert')).toContainText(/6 caracteres/i)
  })

  test('Register: terms required', async ({ page }) => {
    await page.goto('/register?plan=free')
    await page.getByLabel('Seu nome').fill('QA')
    await page.getByLabel('E-mail').fill(uniqueEmail())
    await page.getByLabel('Senha').fill('senha-segura-2026')
    // do not check terms
    await page.getByRole('button', { name: /^criar conta/i }).click()
    await expect(page.getByRole('alert')).toContainText(/termos/i)
  })

  test('Register → Dashboard → Logout → Login → Dashboard', async ({ page }) => {
    const { email, password } = await signUpAsGestor(page)

    // Logged in: should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/gestor|visão geral|dashboard/i).first()).toBeVisible()

    // Logout
    await page.getByRole('link', { name: /sair da conta/i }).click()
    await page.waitForURL(/\/(login|$)/, { timeout: 15_000 })

    // Login again
    await login(page, email, password)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('Login: wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill('inexistente@logipilot.test')
    await page.getByLabel('Senha').fill('senha-errada')
    await page.getByRole('button', { name: /^entrar$/i }).click()
    await expect(page.getByRole('alert')).toContainText(/incorretos/i)
  })

  test('Password toggle button has aria-label', async ({ page }) => {
    await page.goto('/login')
    const toggle = page.getByRole('button', { name: /mostrar senha/i })
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(page.getByRole('button', { name: /ocultar senha/i })).toBeVisible()
  })
})
