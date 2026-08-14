import { test, expect, type Page } from '@playwright/test'

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

async function signIn(page: Page) {
  await page.goto('/auth/signin')
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL(/\/(team|dashboard)$/, { timeout: 15_000 })
}

// Sign in, let the app settle, then go to /team ourselves.
// Navigating directly keeps these tests about what the team page renders rather
// than about how you got there — the redirect has its own test below. The settle
// step matters because the sign in page can still have a navigation in flight,
// and that would land us on /dashboard part way through the test (BUG-01).
async function signInAndOpenTeamPage(page: Page): Promise<Page> {
  await signIn(page)
  await page.waitForLoadState('networkidle')

  await page.goto('/team')
  await expect(page.getByRole('heading', { name: 'Team B', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
  return page
}

test('login page loads with the email and password fields', async ({ page }) => {
  await page.goto('/auth/signin')

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
})

// KNOWN FAILURE — BUG-01. Lands on /dashboard roughly 1 run in 10 because proxy.ts
// sends any signed in user hitting /auth/signin to /dashboard, which races the
// router.replace('/team') on the sign in page. Left failing on purpose until Dev 1
// fixes the app. See docs/test-report-flow.md.
test('signing in with valid credentials redirects to the team page', async ({ page }) => {
  await signIn(page)

  await expect(page).toHaveURL(/\/team$/)
})

test('team page shows the team heading after login', async ({ page }) => {
  const teamPage = await signInAndOpenTeamPage(page)

  await expect(teamPage.getByText('Meet our team')).toBeVisible()
})

test('every team member card renders with a name, role and blurb', async ({ page }) => {
  const teamPage = await signInAndOpenTeamPage(page)

  for (const member of TEAM_MEMBERS) {
    const heading = teamPage.getByRole('heading', { name: member.name, level: 2, exact: true })
    await expect(heading).toBeVisible()

    // the card is the box wrapping this heading — check role and blurb sit inside it
    const card = teamPage.locator('div.border').filter({ has: heading })
    await expect(card).toContainText(member.role)

    const blurb = card.locator('p').last()
    await expect(blurb).not.toBeEmpty()
  }
})

test('the team page lists exactly five members', async ({ page }) => {
  const teamPage = await signInAndOpenTeamPage(page)

  await expect(teamPage.locator('div.border')).toHaveCount(TEAM_MEMBERS.length)
})
