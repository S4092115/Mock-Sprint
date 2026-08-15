# Test Report — Edge Cases & Bugs

**Task:** 7 — Test Edge Cases & Log Bugs
**Role:** Dev 2 — Jun Chan
**Date:** 16 August 2026
**Environment:** Deployed site at https://mock-sprint-frontend.vercel.app (not localhost)
**Test script:** [`tests/edge.spec.ts`](../tests/edge.spec.ts)
**Tested against:** [`requirements.md`](requirements.md) and [`design-validation.md`](design-validation.md)

## Scope

Task 6 covered the happy path. This one covers everything around it — bad logins, empty forms, going to pages you shouldn't be able to reach, missing photos, long text and small screens. Each test names the requirement it is checking so it is clear where the expected behaviour comes from.

## How to run it

```bash
pnpm install
pnpm exec playwright install chromium
pnpm run test:e2e
```

Copy `.env.e2e.local.example` to `.env.e2e.local` and fill in a test account first. That file is gitignored so no login details get committed.

## Results

11 edge case tests. 8 pass, 3 fail. Every failure is a real bug, listed below.

| Test | Requirement | Result |
|------|-------------|--------|
| Wrong password shows an error and does not sign you in | FR-5 | Pass |
| An email with no account shows an error | FR-5 | Pass |
| Badly formatted email shows an inline error | FR-4 | **Fail — BUG-04** |
| Submitting an empty form shows validation errors | FR-4 | Pass |
| Going to /team without logging in sends you to the sign in page | FR-9 | Pass |
| Already signed in and opening the login page takes you to the team page | FR-7 | Pass |
| Every member photo actually loads | FR-17 | **Fail — BUG-03** |
| There is no placeholder UX card | FR-16 | **Fail — BUG-02** |
| The page shows one card for each of the four real members | FR-14, FR-16 | **Fail — BUG-02** |
| Cards stack into a single column on a small screen | FR-18 | Pass |
| A very long blurb does not break the card layout | NFR-4 | Pass |

Running both spec files together gives 16 tests, 12 passing.

## Bugs

### BUG-02 — The placeholder "UX" card is still on the page

**Severity:** High. This is on the artifact being used for the team introduction video, so it is the first thing anyone sees.

**Requirement:** FR-16 says every card must be a real person, and FR-14 says one card per member. Section 5 of the requirements says the team is four people, because the UX role is shared with no dedicated owner.

**Expected:** Four cards — Tommy Flasza, Samuel Brooks, Henry Vo, Jun Chan.
**Actual:** Five cards. The third one has the name "UX" and the role "UX", with a generic blurb about designing user flows.

**Where:** `frontend/src/app/(dashboard)/team/page.tsx`, third entry in the `teamMembers` array.

**Fix:** Delete that entry. The grid is already `lg:grid-cols-3` so four members will lay out as three across and one underneath, which is fine.

**Evidence:** [`screenshots/05-team-page-ux-card.png`](screenshots/05-team-page-ux-card.png)

### BUG-03 — Missing photos render as a broken image instead of a placeholder

**Severity:** Medium.

**Requirement:** FR-17 — photos load, and a member with no headshot shows a placeholder avatar rather than a broken image.

**Expected:** Every card shows either a real photo or a placeholder avatar.
**Actual:** Four of the five photos now load correctly, which is an improvement since the last report. The UX card still points at `photo: "/team/"`, which is not an image, so it renders as a broken image icon. I checked every image in the browser:

| Card | Photo path | Loaded? |
|------|-----------|---------|
| Tommy Flasza | `/team/Tommy.jpg` | Yes |
| Samuel Brooks | `/team/Samuel.png` | Yes |
| UX | `/team/` | **No** |
| Henry Vo | `/team/Henry.jpg` | Yes |
| Jun Chan | `/team/Jun.png` | Yes |

**Note:** Removing the UX card (BUG-02) makes this symptom disappear, but the underlying problem stays — there is still no fallback, so any member added later without a photo will render broken again. The design validation doc raises the same point as D-1 and suggests a lucide user icon on a zinc circle.

**Fix:** Remove the UX card, and add a fallback so a missing or failed photo shows a placeholder avatar instead of a dead `img`.

### BUG-04 — A badly formatted email shows no inline error

**Severity:** Low. Nothing breaks and nothing unsafe gets through, it is just not the behaviour the requirements describe.

**Requirement:** FR-4 — invalid input shows an inline message and does not submit.

**Expected:** Typing `not-an-email` and pressing Sign in shows the app's own inline red error under the field.
**Actual:** The form correctly does not submit and you stay on the page, but no inline message appears. The email input is `type="email"`, so the browser's own validation blocks the submit before the form's `onSubmit` ever runs. That means react-hook-form and the Zod `loginSchema` never get a chance to validate, and `aria-invalid` stays `false`.

Worth saying that the browser does show its own popup, so a real user is not stuck with no feedback. The gap is that the app's validation is not what is catching it, and the styling is the browser's rather than the design system's.

**Fix:** Either accept the native behaviour and reword FR-4, or add `noValidate` to the form so the app's own validation and inline messages handle it consistently. Worth a quick chat with the BA about which is wanted rather than just changing it.

### BUG-01 — Still open

The redirect bug from the Task 6 report has not been fixed. Sign-in still lands on `/dashboard` instead of `/team` about one time in ten. Details in [`test-report-flow.md`](test-report-flow.md). Requirements FR-10 and FR-11 both depend on it.

## What passed, and why it is worth saying

**Route protection works properly.** Going to `/team` while logged out sends you to the sign in page every time. This is the most important thing on the list from a security point of view, and it holds up.

**Bad logins are handled well.** A wrong password and an email with no account both show "Invalid email or password" and keep you on the page. The message deliberately does not say which of the two was wrong, which is the right call — telling an attacker that an email exists but the password is wrong gives away more than it should.

**An empty form is caught by the app's own validation.** Both fields get `aria-invalid` and inline errors, which is exactly what FR-4 describes. This is the same requirement BUG-04 misses for the email format case, so the validation is wired up correctly, it is just being bypassed by the browser in that one case.

**The layout holds up.** Cards stack into a single column at 390px wide, and a blurb sixty times longer than a normal one wraps inside its card without making the page scroll sideways.

## Evidence

| Screenshot | What it shows |
|------------|---------------|
| [`screenshots/04-invalid-login-error.png`](screenshots/04-invalid-login-error.png) | The error shown after signing in with a wrong password |
| [`screenshots/05-team-page-ux-card.png`](screenshots/05-team-page-ux-card.png) | The team page with the UX placeholder card and its broken image |

## Conclusion

The things that matter most for safety are solid. You cannot reach the team page without logging in, and bad credentials are handled sensibly without leaking anything.

The problems left are on the team page itself. BUG-02 and BUG-03 both need Dev 1 to touch the same few lines, so they should be fixed together, and both are visible on the page being used for the team video. BUG-01 from the last report is still open and is the biggest of the three.

Nothing here is outstanding on my side. The feature should not be signed off until BUG-01, BUG-02 and BUG-03 are fixed. BUG-04 is a judgement call for the BA rather than a straight defect.
