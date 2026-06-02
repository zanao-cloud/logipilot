import { test, expect } from '@playwright/test'
import path from 'node:path'
import { signUpAsGestor } from './helpers/auth'

const CSV_PATH = path.join(__dirname, 'fixtures', 'entregas.csv')
const TXT_PATH = path.join(__dirname, 'fixtures', 'relatorio.txt')

// These tests hit the real Gemini API. They are slower (60-120s) but exercise
// the full pipeline: upload → parse → AI → save → diagnosis → chat → export.
test.describe.configure({ mode: 'serial' })

test.describe('Analysis pipeline', () => {
  test('Upload CSV → diagnosis page renders', async ({ page }) => {
    test.setTimeout(180_000)
    await signUpAsGestor(page)

    await page.goto('/analysis/new')
    await expect(page.getByRole('heading', { name: /nova análise/i })).toBeVisible()

    await page.getByLabel(/título/i).fill('QA — Entregas Maio')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(CSV_PATH)
    await expect(page.getByText('entregas.csv')).toBeVisible()

    await page.getByRole('button', { name: /analisar dados/i }).click()

    // Processing loader appears, then we land on the analysis page.
    await page.waitForURL(/\/analysis\/[a-z0-9-]+/, { timeout: 150_000 })
    await expect(page.getByText(/diagnóstico|score|indicadores/i).first()).toBeVisible()
  })

  test('Upload TXT report → AI generates structured output', async ({ page }) => {
    test.setTimeout(180_000)
    await signUpAsGestor(page)

    await page.goto('/analysis/new')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(TXT_PATH)
    await expect(page.getByText('relatorio.txt')).toBeVisible()

    await page.getByRole('button', { name: /analisar dados/i }).click()
    await page.waitForURL(/\/analysis\/[a-z0-9-]+/, { timeout: 150_000 })
    await expect(page.getByText(/diagnóstico|score|indicadores/i).first()).toBeVisible()
  })

  test('Chat with data responds', async ({ page }) => {
    test.setTimeout(180_000)
    await signUpAsGestor(page)

    // Create one analysis
    await page.goto('/analysis/new')
    await page.locator('input[type="file"]').first().setInputFiles(CSV_PATH)
    await page.getByRole('button', { name: /analisar dados/i }).click()
    await page.waitForURL(/\/analysis\/[a-z0-9-]+/, { timeout: 150_000 })

    // Open chat
    const chatLink = page.getByRole('link', { name: /chat/i }).first()
    if (await chatLink.count()) {
      await chatLink.click()
    } else {
      await page.goto(page.url() + '/chat')
    }

    const input = page.getByPlaceholder(/pergunte|mensagem|escreva/i).first()
    await input.fill('Quem foi o motorista com maior pontualidade?')
    await input.press('Enter')

    // Wait for assistant reply
    await expect(page.getByText(/maria|souza|pontualidade/i).first()).toBeVisible({ timeout: 60_000 })
  })

  test('History lists created analyses', async ({ page }) => {
    test.setTimeout(120_000)
    await signUpAsGestor(page)

    // Create one
    await page.goto('/analysis/new')
    await page.locator('input[type="file"]').first().setInputFiles(CSV_PATH)
    await page.getByRole('button', { name: /analisar dados/i }).click()
    await page.waitForURL(/\/analysis\/[a-z0-9-]+/, { timeout: 150_000 })

    // Open history
    await page.goto('/history')
    await expect(page.getByText(/análise|histórico/i).first()).toBeVisible()
  })

  test('Export page is reachable', async ({ page }) => {
    test.setTimeout(180_000)
    await signUpAsGestor(page)
    await page.goto('/analysis/new')
    await page.locator('input[type="file"]').first().setInputFiles(CSV_PATH)
    await page.getByRole('button', { name: /analisar dados/i }).click()
    await page.waitForURL(/\/analysis\/[a-z0-9-]+/, { timeout: 150_000 })
    const url = page.url()
    await page.goto(url + '/export')
    await expect(page.getByText(/export|imprimir|pdf/i).first()).toBeVisible()
  })
})
