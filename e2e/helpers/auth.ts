import type { Page } from '@playwright/test'

export function uniqueEmail(prefix = 'qa') {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}+${ts}-${rand}@logipilot.test`
}

export async function signUpAsGestor(page: Page, opts: { email?: string; password?: string; name?: string } = {}) {
  const email = opts.email ?? uniqueEmail('gestor')
  const password = opts.password ?? 'logipilot-qa-2026'
  const name = opts.name ?? 'QA Gestor'

  await page.goto('/register?plan=free')
  await page.getByLabel('Seu nome').fill(name)
  await page.getByLabel('Nome da transportadora').fill('QA Transportes')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /^criar conta/i }).click()

  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })

  return { email, password, name }
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: /^entrar$/i }).click()
  await page.waitForURL(/\/(dashboard|operador|motorista)/, { timeout: 30_000 })
}

export async function logout(page: Page) {
  // Open user menu / sair button. Sidebar has a "Sair da conta" link.
  await page.getByRole('button', { name: /sair da conta/i }).click().catch(async () => {
    await page.getByRole('link', { name: /sair da conta/i }).click()
  })
  await page.waitForURL(/\/(login|$)/, { timeout: 15_000 })
}
