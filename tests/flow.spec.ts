import { test, expect, type Page } from '@playwright/test'

// Task 6 - testing the login -> redirect -> team page flow
// Just the happy path here, edge cases are task 7

const EMAIL = process.env.E2E_EMAIL ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''

// these are the names on the team page
const TEAM_MEMBERS = [
  { name: 'Tommy Flasza', role: 'Project Manager' },
  { name: 'Samuel Brooks', role: 'Business Analyst' },
  { name: 'UX', role: 'UX' },
  { name: 'Henry Vo', role: 'Developer' },
  { name: 'Jun Chan', role: 'Developer' },
]

test.beforeAll(() => {
  // better to stop here than get a confusing wrong password error later
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

// sign in then go to /team myself
// BUG-01 means /team sometimes bounces you to /dashboard, so try a few times
// to actually get there. the redirect has its own test below, these ones are
// only about what the page shows once you're on it
async function signInAndOpenTeamPage(page: Page): Promise<Page> {
  await signIn(page)

  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto('/team')
    if (page.url().endsWith('/team')) break
  }

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

// this one fails sometimes on purpose, see BUG-01 in docs/test-report-flow.md
// you end up on /dashboard instead of /team every so often
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

    // find the card that this heading is inside, then check the rest of it
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
