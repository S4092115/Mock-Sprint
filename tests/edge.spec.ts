import { test, expect, type Page } from '@playwright/test'

// Task 7 - edge cases and bug logging
// Each test says which requirement from docs/requirements.md it's checking

const EMAIL = process.env.E2E_EMAIL ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''

// the four real people, from requirements.md section 5
const REAL_MEMBERS = ['Tommy Flasza', 'Samuel Brooks', 'Henry Vo', 'Jun Chan']

test.beforeAll(() => {
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

// BUG-01 can bounce you to /dashboard so try a few times to land on /team
async function openTeamPage(page: Page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto('/team')
    if (page.url().endsWith('/team')) break
  }
  await expect(page.getByRole('heading', { name: 'Team B', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
}

// ── Login edge cases ─────────────────────────────────────────────────────────

// FR-5 - wrong password should show an error and keep you on the page
test('wrong password shows an error and does not sign you in', async ({ page }) => {
  await page.goto('/auth/signin')
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill('DefinitelyNotThePassword123')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  await expect(page.getByText('Invalid email or password')).toBeVisible()
  await expect(page).toHaveURL(/\/auth\/signin/)
})

// FR-5 - an email that has no account should be handled the same way
test('an email with no account shows an error', async ({ page }) => {
  await page.goto('/auth/signin')
  await page.locator('#email').fill('nobody-here-9f2a@example.com')
  await page.locator('#password').fill('Whatever1234')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  await expect(page.getByText('Invalid email or password')).toBeVisible()
  await expect(page).toHaveURL(/\/auth\/signin/)
})

// FR-4 - a badly formatted email should be caught and show an inline message
// the "does not submit" half works, but no inline message shows up (BUG-04)
// the input is type="email" so the browser blocks it first and our own
// validation never gets a chance to run
test('badly formatted email shows an inline error', async ({ page }) => {
  await page.goto('/auth/signin')
  await page.locator('#email').fill('not-an-email')
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  // it does at least stay on the page
  await expect(page).toHaveURL(/\/auth\/signin/)

  await expect(page.locator('#email-error')).toBeVisible()
})

// FR-4 - submitting nothing should show validation, not crash or submit
test('submitting an empty form shows validation errors', async ({ page }) => {
  await page.goto('/auth/signin')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true')
  await expect(page).toHaveURL(/\/auth\/signin/)
})

// ── Route protection ─────────────────────────────────────────────────────────

// FR-9 - not logged in, so /team should send you to the login page
test('going to /team without logging in sends you to the sign in page', async ({ page }) => {
  await page.goto('/team')

  await expect(page).toHaveURL(/\/auth\/signin/)
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

// FR-7 - already signed in, so the login page should take you to /team
test('already signed in and opening the login page takes you to the team page', async ({
  page,
}) => {
  await signIn(page)
  await page.goto('/auth/signin')

  await expect(page).toHaveURL(/\/team$/)
})

// ── Team page content ────────────────────────────────────────────────────────

// FR-17 - every photo should actually load
// currently fails because the UX card points at /team/ which isn't an image (BUG-03)
test('every member photo actually loads', async ({ page }) => {
  await signIn(page)
  await openTeamPage(page)

  const broken = await page.locator('img').evaluateAll((imgs) =>
    imgs
      .filter((img) => (img as HTMLImageElement).naturalWidth === 0)
      .map((img) => (img as HTMLImageElement).getAttribute('src'))
  )

  expect(broken, `these images did not load: ${broken.join(', ')}`).toEqual([])
})

// FR-16 - no placeholder cards, everyone on the page should be a real person
// currently fails, there's still a card called "UX" (BUG-02)
test('there is no placeholder UX card', async ({ page }) => {
  await signIn(page)
  await openTeamPage(page)

  await expect(page.getByRole('heading', { name: 'UX', level: 2, exact: true })).toHaveCount(0)
})

// FR-14 and FR-16 - should be one card each for the four real members
// currently fails, there are five cards (BUG-02)
test('the page shows one card for each of the four real members', async ({ page }) => {
  await signIn(page)
  await openTeamPage(page)

  await expect(page.locator('div.border')).toHaveCount(REAL_MEMBERS.length)

  for (const name of REAL_MEMBERS) {
    await expect(page.getByRole('heading', { name, level: 2, exact: true })).toHaveCount(1)
  }
})

// ── Layout edge cases ────────────────────────────────────────────────────────

// FR-18 - should stack into one column on a phone
test('cards stack into a single column on a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signIn(page)
  await openTeamPage(page)

  const cards = page.locator('div.border')
  const count = await cards.count()

  // if they're stacked, every card starts at the same x position
  const lefts: number[] = []
  for (let i = 0; i < count; i++) {
    const box = await cards.nth(i).boundingBox()
    if (box) lefts.push(Math.round(box.x))
  }

  expect(new Set(lefts).size).toBe(1)
})

// a really long blurb shouldn't push the card out of the page
test('a very long blurb does not break the card layout', async ({ page }) => {
  await signIn(page)
  await openTeamPage(page)

  // put a huge blurb into the first card to see what happens
  await page.locator('div.border').first().locator('p').last().evaluate((el) => {
    el.textContent = 'This is a really long blurb. '.repeat(60)
  })

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )

  expect(overflows, 'the page scrolls sideways with a long blurb').toBe(false)
})
