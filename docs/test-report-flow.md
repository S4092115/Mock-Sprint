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

**The flow does not work reliably. Any of the team page tests can fail on a given run, and the cause is a bug in the app rather than a problem with the tests.**

| # | Test | Result |
|---|------|--------|
| 1 | Login page loads with the email and password fields | Pass, every run |
| 2 | Signing in with valid credentials redirects to the team page | **Intermittent — see BUG-01** |
| 3 | Team page shows the team heading after login | **Intermittent — see BUG-01** |
| 4 | Every team member card renders with a name, role and blurb | **Intermittent — see BUG-01** |
| 5 | The team page lists exactly five members | **Intermittent — see BUG-01** |

Across 15 test runs, 12 passed and 3 failed. Every failure was the same thing — the browser ended up on `/dashboard` when it should have been on `/team`.

Because it only fails sometimes, a single run of the suite can look completely green. The first time I ran it everything passed, which is exactly why this is worth flagging. One green run is not proof that this flow works.

## BUG-01 — /team intermittently redirects to the dashboard

**Severity:** High. A signed in user who should see the team page lands on the dashboard instead, with no error shown. This is the feature task 5 was meant to deliver, so it cannot be signed off while this happens.

**How often:** Roughly 1 in 10 logins, and about 3 in 15 across full test runs. It affects both routes to the page — logging in, and typing the `/team` URL directly while already signed in.

| Run | Landed on |
|-----|-----------|
| 1 | /team |
| 2 | /team |
| 3 | /team |
| 4 | /team |
| 5 | /team |
| 6 | /team |
| 7 | **/dashboard** |
| 8 | /team |
| 9 | /team |
| 10 | /team |

**Steps to reproduce:** Sign in with valid credentials at `/auth/signin`, then go to `/team` while signed in. Repeat about ten times. At least one attempt shows the Dashboard instead of the team page.

**Expected:** A signed in user who goes to `/team` sees the team page.
**Actual:** Sometimes they are redirected to `/dashboard` instead, with no error and no explanation.

**Cause:** I traced the network requests on a failing run and got this redirect chain:

```
/team  ->307->  /auth/signin  ->307->  /dashboard
```

Two guards are involved and each one behaves correctly on its own. Together they send the user to the wrong place.

1. `/team` sits inside the `(dashboard)` route group, and `frontend/src/app/(dashboard)/layout.tsx` calls `getServerSession()`. That function verifies the session cookie with the Firebase Admin SDK and returns `null` if anything at all goes wrong, because the whole call sits in a `try/catch` that swallows the error. When it returns `null` the layout redirects to `/auth/signin`.

2. `frontend/src/proxy.ts` then sees a request for `/auth/signin` from someone who still has a `__session` cookie, and redirects them on to `/dashboard`:

```ts
if (isAuthRoute && isAuthenticated) {
  return NextResponse.redirect(new URL('/dashboard', req.url))
}
```

The proxy only checks that the cookie exists, while the layout actually verifies it. When those two disagree the user gets bounced to the dashboard rather than being told anything went wrong.

**Suggested fix for Dev 1:** the two checks need to agree. Either make the layout redirect somewhere the proxy will not immediately re-route, or stop `getServerSession()` from silently returning `null` on a transient verification failure so a real problem surfaces instead of a silent redirect. Sending the proxy's post login redirect to `/team` rather than `/dashboard` would also stop the user landing on the wrong page, though it treats the symptom rather than the cause.

**Evidence:** [`screenshots/03-bug-01-landed-on-dashboard.png`](screenshots/03-bug-01-landed-on-dashboard.png) — signed in as junyuan711@gmail.com, showing the Dashboard immediately after login.

## What was checked

- The sign in page loads and shows the email field, password field and sign in button.
- Signing in with a valid account redirects the browser. This is where BUG-01 shows up.
- The team page renders the "Team B" heading and the "Meet our team" line underneath it.
- All five member cards are present, and each one shows a name, a role and a blurb. The five members are Tommy Flasza, Samuel Brooks, UX, Henry Vo and Jun Chan.
- The page renders exactly five cards, so nothing is missing or duplicated.

Tests 3, 4 and 5 navigate to `/team` directly after signing in rather than relying on the redirect, so each test is about one thing. That still does not make them reliable, because BUG-01 affects direct navigation too. I tried several ways of stabilising them, including waiting for the page to settle and opening the team page in a separate tab, and none of it helped. That is the point at which it became clear the problem is in the app rather than in the tests, so I left them asserting the correct behaviour and let them fail.

When the team page does load, it renders correctly every single time. Nothing is wrong with the page itself.

## Evidence

| Screenshot | What it shows |
|------------|---------------|
| [`screenshots/01-login-page.png`](screenshots/01-login-page.png) | The login page as it loads |
| [`screenshots/02-team-page.png`](screenshots/02-team-page.png) | The team page after a successful login |
| [`screenshots/03-bug-01-landed-on-dashboard.png`](screenshots/03-bug-01-landed-on-dashboard.png) | BUG-01, the dashboard showing after login instead of the team page |

## Other observations

These are not part of the login flow but came up while testing, and Dev 1 should see them.

**Profile photos are broken on every card.** Each member is set to `photo: "/team/"` in `frontend/src/app/(dashboard)/team/page.tsx`, and there is no `frontend/public/team/` folder in the repo. I checked the rendered images in the browser and all five come back with a natural width of 0, which means none of them loaded. The design called for a placeholder avatar for the one member without a headshot, so this needs the placeholder treatment rather than a path that points at nothing.

**One card is a placeholder rather than a person.** The third card has the name "UX" and the role "UX" instead of a team member's name.

## Conclusion

The team page itself is fine. When it loads, every card renders correctly with a name, role and blurb, and there are exactly five of them.

Getting to the page is the problem. BUG-01 means a signed in user is sometimes sent to the dashboard instead, and it happens both after logging in and when going to `/team` directly. It failed 3 times out of 15 runs, so it is frequent enough that a real user would hit it.

I am not signing this off as working. Task 6 is complete in the sense that the flow has been tested and the results are documented, but the flow itself needs BUG-01 fixed by Dev 1 before it can be called done.
