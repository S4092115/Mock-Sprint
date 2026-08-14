import { test, expect } from '@playwright/test'

// Task 6 — Test Login -> Redirect -> Team Page Flow
// Happy path only. Edge cases (invalid login, direct URL access, etc) are task 7.

const EMAIL = process.env.E2E_EMAIL ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''

// names come straight off the team page cards
const TEAM_MEMBERS = [
  { name: 'Tommy Flasza', role: 'Project Manager' },
  { name: 'Samuel Brooks', role: 'Business Analyst' },
  { name: 'UX', role: 'UX' },
  { name: 'Henry Vo', role: 'Developer' },
  { name: 'Jun Chan', role: 'Developer' },
]

test.beforeAll(() => {
  // fail loudly rather than getting a confusing "invalid password" later
  if (!EMAIL || !PASSWORD) {
    throw new Error('E2E_EMAIL and E2E_PASSWORD must be set in .env.e2e.local')
  }
})

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/auth/signin')
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}

test('login page loads with the email and password fields', async ({ page }) => {
  await page.goto('/auth/signin')

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
})

test('signing in with valid credentials redirects to the team page', async ({ page }) => {
  await signIn(page)

  await expect(page).toHaveURL(/\/team$/, { timeout: 15_000 })
})

test('team page shows the team heading after login', async ({ page }) => {
  await signIn(page)
  await page.waitForURL(/\/team$/, { timeout: 15_000 })

  await expect(page.getByRole('heading', { name: 'Team B', level: 1 })).toBeVisible()
  await expect(page.getByText('Meet our team')).toBeVisible()
})

test('every team member card renders with a name, role and blurb', async ({ page }) => {
  await signIn(page)
  await page.waitForURL(/\/team$/, { timeout: 15_000 })

  for (const member of TEAM_MEMBERS) {
    const heading = page.getByRole('heading', { name: member.name, level: 2 })
    await expect(heading).toBeVisible()

    // the card is the box wrapping this heading — check role and blurb sit inside it
    const card = page.locator('div.border').filter({ has: heading })
    await expect(card).toContainText(member.role)

    const blurb = card.locator('p').last()
    await expect(blurb).not.toBeEmpty()
  }
})

test('the team page lists exactly five members', async ({ page }) => {
  await signIn(page)
  await page.waitForURL(/\/team$/, { timeout: 15_000 })

  await expect(page.locator('div.border')).toHaveCount(TEAM_MEMBERS.length)
})
