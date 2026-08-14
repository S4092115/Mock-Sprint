import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// login details are in .env.e2e.local, that file is gitignored so it never
// gets committed
dotenv.config({ path: '.env.e2e.local' })

export default defineConfig({
  testDir: './tests',
  // run one at a time so the tests don't clash over the same account
  workers: 1,
  // this runs against the real deployed site instead of localhost, so 5s
  // wasn't always enough
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
