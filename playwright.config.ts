import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// creds live in .env.e2e.local, which is gitignored — never commit them
dotenv.config({ path: '.env.e2e.local' })

export default defineConfig({
  testDir: './tests',
  // one at a time, so the tests don't fight over the same test account
  workers: 1,
  // we're hitting a real deployed site, not localhost, so give it longer than
  // the 5s default — a cold start on Vercel can easily blow past that
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://mock-sprint-frontend.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
