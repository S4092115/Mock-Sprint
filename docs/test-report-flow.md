# Test Report — Login → Redirect → Team Page Flow

**Task:** 6 — Test Login → Redirect → Team Page Flow
**Role:** Dev 2 — Jun Chan
**Date:** 14 August 2026
**Environment:** Deployed site at https://mock-sprint-frontend.vercel.app (not localhost)
**Test script:** [`tests/flow.spec.ts`](../tests/flow.spec.ts)

## Scope

This covers the happy path only, which is what task 6 asks for. Edge cases and bug logging are task 7 and are being done separately once the requirements document is filled in.

## How to run it

The tests use Playwright against the deployed site. Credentials are kept in `.env.e2e.local`, which is gitignored, so nothing sensitive is committed. Copy `.env.e2e.local.example` to `.env.e2e.local` and fill in a test account, then run:

```bash
pnpm install
pnpm exec playwright install chromium
pnpm run test:e2e
```

## Results

All 5 tests passed in 24.0 seconds.

| # | Test | Result |
|---|------|--------|
| 1 | Login page loads with the email and password fields | Pass |
| 2 | Signing in with valid credentials redirects to the team page | Pass |
| 3 | Team page shows the team heading after login | Pass |
| 4 | Every team member card renders with a name, role and blurb | Pass |
| 5 | The team page lists exactly five members | Pass |

## What was checked

- The sign in page loads and shows the email field, password field and sign in button.
- Signing in with a valid account redirects the browser to `/team`. The redirect fires on its own, so no manual navigation is needed.
- The team page renders the "Team B" heading and the "Meet our team" line underneath it.
- All five member cards are present, and each one shows a name, a role and a blurb. The five members are Tommy Flasza, Samuel Brooks, UX, Henry Vo and Jun Chan.
- The page renders exactly five cards, so nothing is missing or duplicated.

## Evidence

| Screenshot | What it shows |
|------------|---------------|
| [`screenshots/01-login-page.png`](screenshots/01-login-page.png) | The login page as it loads |
| [`screenshots/02-team-page.png`](screenshots/02-team-page.png) | The team page straight after a successful login |

## Observations

The happy path itself works and every check passed, but two things stood out while testing and both are worth passing on.

**Profile photos are broken on every card.** Each member is set to `photo: "/team/"` in `frontend/src/app/(dashboard)/team/page.tsx`, and there is no `frontend/public/team/` folder in the repo. I checked the rendered images in the browser and all five come back with a natural width of 0, which means none of them loaded. You can see the broken image icons in the team page screenshot. The design called for a placeholder avatar for the one member without a headshot, so this needs the placeholder treatment rather than a path that points at nothing.

**One card is a placeholder rather than a person.** The third card has the name "UX" and the role "UX" instead of a team member's name.

I have not raised either of these as formal bugs yet because bug logging belongs to task 7. They are recorded here so Dev 1 sees them early.

## Conclusion

The login to redirect to team page flow works end to end on the deployed site. All five automated checks pass. The two issues above are cosmetic and do not block the flow, so task 6 is complete.
