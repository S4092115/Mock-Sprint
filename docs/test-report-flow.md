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

**The team page itself is fine. Getting to it after login is not always reliable.**

| # | Test | Result |
|---|------|--------|
| 1 | Login page loads with the email and password fields | Pass |
| 2 | Signing in with valid credentials redirects to the team page | **Fails intermittently — see BUG-01** |
| 3 | Team page shows the team heading after login | Pass |
| 4 | Every team member card renders with a name, role and blurb | Pass |
| 5 | The team page lists exactly five members | Pass |

Tests 3, 4 and 5 go to `/team` directly after signing in instead of relying on the redirect, and they retry if BUG-01 bounces them. That way they only report on what the page renders, which is what they are actually meant to check. Run three times over, all 15 of those passed.

Test 2 is the one that checks the redirect itself, and that is where the problem shows up.

Because it only fails sometimes, a single run of the suite can look completely green. The first time I ran it everything passed, which is exactly why this is worth flagging. One green run is not proof that this flow works.

## BUG-01 — login sometimes lands on the dashboard instead of the team page

**Severity:** High. A user who signs in and should see the team page lands on the dashboard instead, with no error shown. This is the feature task 5 was meant to deliver, so it cannot be signed off while this happens.

**How often:** About 1 login in 10. I measured it twice with two different accounts. The first account landed on `/dashboard` once in 10 logins, the second once in 12.

I also saw `/team` redirect to `/dashboard` when typing the URL directly while already signed in. That happened repeatedly during one stretch of testing but did not happen at all across 12 later attempts, so it is the same bug showing up in a second place rather than something separate.

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

**Steps to reproduce:** Sign in with valid credentials at `/auth/signin` and wait a few seconds for the page to settle. Repeat about ten times using a fresh browser session each time. At least one attempt ends up on `/dashboard` showing the Dashboard heading instead of the team page.

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

Tests 3, 4 and 5 navigate to `/team` directly after signing in rather than relying on the redirect, and they retry a couple of times if BUG-01 sends them to the dashboard. That keeps them focused on what the page renders instead of failing over a redirect problem that test 2 already covers.

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

Getting to the page after login is the problem. BUG-01 sends a signed in user to the dashboard about one time in ten, with nothing on screen to explain why. That is often enough that a real user would run into it.

Task 6 is complete in the sense that the flow has been tested and the results are written up, but I am not calling the flow itself working. BUG-01 needs a fix from Dev 1 first.
