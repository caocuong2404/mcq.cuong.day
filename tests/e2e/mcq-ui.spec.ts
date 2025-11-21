import { test, expect } from '@playwright/test'

const testQuestions = `1. This is the book I borrowed from the library?
A. whose
B. whom
C. which
D. who

2. (0.2 Point)
This is the test question with points.
a. answer one
b. answer two
c. answer three
d. answer four`

test.describe('MCQ Shuffle UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should load the app with all tabs', async ({ page }) => {
    // Check that all tabs are present
    await expect(page.getByRole('tab', { name: /import/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /generate/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /answer sheet/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /settings/i })).toBeVisible()
  })

  test('should parse questions in Import view', async ({ page }) => {
    // Should be on Import tab by default
    await expect(
      page.getByRole('heading', { name: /import questions/i })
    ).toBeVisible()

    // Paste questions
    const textarea = page.locator('textarea').first()
    await textarea.fill(testQuestions)

    // Click Parse button
    await page.getByRole('button', { name: /parse questions/i }).click()

    // Wait for parsing
    await page.waitForTimeout(500)

    // Check that questions were parsed
    await expect(page.getByText(/2 questions parsed/i)).toBeVisible()
  })

  test('should navigate to Generate view', async ({ page }) => {
    // Parse questions first
    const textarea = page.locator('textarea').first()
    await textarea.fill(testQuestions)
    await page.getByRole('button', { name: /parse questions/i }).click()
    await page.waitForTimeout(500)

    // Accept and continue
    await page.getByRole('button', { name: /accept.*continue/i }).click()

    // Should be on Generate tab
    await expect(
      page.getByRole('heading', { name: /generate exam/i })
    ).toBeVisible()
  })

  test('should shuffle questions', async ({ page }) => {
    // Parse and navigate to Generate
    const textarea = page.locator('textarea').first()
    await textarea.fill(testQuestions)
    await page.getByRole('button', { name: /parse questions/i }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /accept.*continue/i }).click()

    // Enable shuffle
    const shuffleCheckbox = page.getByRole('checkbox').first()
    await shuffleCheckbox.check()

    // Click shuffle button
    await page
      .getByRole('button', { name: /shuffle.*now/i })
      .first()
      .click()

    // Should see toast notification
    await expect(page.getByText(/shuffled/i)).toBeVisible()
  })

  test('should generate answer sheet', async ({ page }) => {
    // Parse questions
    const textarea = page.locator('textarea').first()
    await textarea.fill(testQuestions)
    await page.getByRole('button', { name: /parse questions/i }).click()
    await page.waitForTimeout(500)

    // Mark answer keys
    const checkboxes = page.getByRole('checkbox')
    await checkboxes.nth(0).check() // Mark first answer
    await page.waitForTimeout(200)

    // Accept and continue
    await page.getByRole('button', { name: /accept.*continue/i }).click()

    // Go to answer sheet
    await page.getByRole('button', { name: /answer sheet/i }).click()

    // Wait for answer sheet tab
    await page.getByRole('tab', { name: /answer sheet/i }).click()
    await page.waitForTimeout(500)

    // Should see answer sheet
    await expect(page.getByText(/answer sheet/i)).toBeVisible()
  })

  test('should navigate to Settings', async ({ page }) => {
    await page.getByRole('tab', { name: /settings/i }).click()

    // Should see settings
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
    await expect(page.getByText(/question format/i)).toBeVisible()
  })
})

test.describe('Visual Screenshots', () => {
  test('Import view screenshot', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: `screenshots/${testInfo.project.name}-import.png`,
      fullPage: true,
    })
  })

  test('Generate view screenshot', async ({ page }, testInfo) => {
    await page.goto('/')

    // Parse questions first
    const textarea = page.locator('textarea').first()
    await textarea.fill(testQuestions)
    await page.getByRole('button', { name: /parse questions/i }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /accept.*continue/i }).click()

    await page.screenshot({
      path: `screenshots/${testInfo.project.name}-generate.png`,
      fullPage: true,
    })
  })

  test('Answer Sheet view screenshot', async ({ page }, testInfo) => {
    await page.goto('/')

    // Parse questions
    const textarea = page.locator('textarea').first()
    await textarea.fill(testQuestions)
    await page.getByRole('button', { name: /parse questions/i }).click()
    await page.waitForTimeout(500)

    // Mark answers
    const checkboxes = page.getByRole('checkbox')
    await checkboxes.nth(0).check()
    await page.waitForTimeout(200)

    // Go to generate then answer sheet
    await page.getByRole('button', { name: /accept.*continue/i }).click()
    await page.getByRole('tab', { name: /answer sheet/i }).click()
    await page.waitForTimeout(500)

    await page.screenshot({
      path: `screenshots/${testInfo.project.name}-answer-sheet.png`,
      fullPage: true,
    })
  })

  test('Settings view screenshot', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /settings/i }).click()
    await page.waitForTimeout(300)

    await page.screenshot({
      path: `screenshots/${testInfo.project.name}-settings.png`,
      fullPage: true,
    })
  })
})
