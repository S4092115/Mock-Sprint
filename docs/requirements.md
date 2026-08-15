# Requirements — Login → Team Page Feature

**Feature:** A styled login page leading into a team page (team name, each member's photo/name/role, and a short blurb), built on the existing boilerplate.
**Date:** 15 August 2026
**Status:** Draft — for review
**Related artifacts:**
- Design mockup — [`Mockup.fig`](Mockup.fig) (Figma, exported 13 August 2026)
- Design system reference — [`DESIGN.md`](DESIGN.md)
- Design validation — [`design-validation.md`](design-validation.md)
- Test report (login flow) — [`test-report-flow.md`](test-report-flow.md)
- Feature code — `frontend/src/app/(auth)/auth/signin/page.tsx`, `frontend/src/app/(dashboard)/team/page.tsx`

---

## 1. Purpose

Deliver one complete, styled feature that demonstrates the whole boilerplate flow: an unauthenticated visitor signs in, and once authenticated lands on a team page that introduces the team. The team page is also the artifact used for the 2-minute team introduction video in the assignment submission.

## 2. Scope

**In scope**
- A styled sign-in page (email/password + Google) matching the mockup.
- Successful sign-in redirects the user to the team page.
- A team page showing the team name and one card per member (photo, name, role, blurb).
- Route protection: the team page is only reachable by a signed-in user.

**Out of scope**
- Editing team members through the UI (the member list is hard-coded content, not stored in Firestore for this sprint).
- Sign-up / registration flow beyond what the boilerplate already ships.
- Password reset, email verification changes, and profile editing.
- Any team page other than the single "meet the team" view.

## 3. Users

| Role | Need |
|------|------|
| Visitor (unauthenticated) | Sign in with valid credentials. |
| Team member (authenticated) | See the team page after signing in. |
| Marker / client | Open the deployed URL, sign in with a test account, and see the team page as the introduction artifact. |

## 4. Functional Requirements

### 4.1 Login page (`/auth/signin`)

- **FR-1** The page shows a "Sign in" heading with supporting text.
- **FR-2** The page offers "Continue with Google" as a sign-in option.
- **FR-3** The page provides email and password fields with labels, and a submit button.
- **FR-4** Email and password are validated before submission (via the existing `loginSchema`); invalid input shows an inline message and does not submit.
- **FR-5** Invalid credentials show a non-blocking error ("Invalid email or password") and keep the user on the page.
- **FR-6** On successful sign-in the user is redirected to the team page (`/team`).
- **FR-7** A visitor who is already signed in and opens `/auth/signin` is taken to the team page, not shown the form again.
- **FR-8** The page provides a link to register for users without an account.

### 4.2 Redirect / route protection

- **FR-9** `/team` is a protected route. An unauthenticated request to `/team` is redirected to `/auth/signin`.
- **FR-10** After a successful sign-in the user reliably lands on `/team` — **every time**, not most of the time. (Currently violated — see BUG-01 in [`test-report-flow.md`](test-report-flow.md).)
- **FR-11** An authenticated user who navigates directly to `/team` sees the team page and is not bounced elsewhere. (Currently violated intermittently — see BUG-01.)

### 4.3 Team page (`/team`)

- **FR-12** The page shows the team name as a heading — this team's name is "Team B". (The mockup uses "Team 52" as a placeholder.)
- **FR-13** The page shows a short supporting line under the heading ("Meet our team").
- **FR-14** The page renders exactly one card per team member, and no duplicates or blanks.
- **FR-15** Each member card shows: a photo (or a placeholder avatar when no photo is available), a name, a role, and a one-line blurb.
- **FR-16** Every card is a real person with a real name and role. There is no dedicated UX card — the UX role is shared across the team with no single owner (the previous UX designer left), so no member is listed under it. Placeholder entries (e.g. a card named "UX") must not appear in the delivered page. (Currently violated — see §7.)
- **FR-17** Member photos load and render. Where a member has no headshot, a placeholder avatar is shown rather than a broken image. (Currently violated — see §7.)
- **FR-18** The card grid is responsive: a single column on mobile, and a multi-column grid (up to three across) on larger screens.

## 5. Data Requirements

Each team member is defined by the following fields:

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Full name of a real team member. Required. |
| `role` | string | e.g. Project Manager, Business Analyst, Developer. Required. |
| `photo` | string (path/URL) | Path to a headshot. Must resolve to an existing image, or the member falls back to the placeholder avatar. |
| `blurb` | string | One short sentence describing what the member does. Required. |

The delivered team is four members: Tommy Flasza (Project Manager), Samuel Brooks (Business Analyst), Henry Vo (Developer), and Jun Chan (Developer). The UX role is shared across the team with no dedicated owner (the previous UX designer left), so it does not get its own card. The "UX" placeholder card in the current build must be removed.

## 6. Non-Functional Requirements

- **NFR-1 Design system** — Login and team page follow [`DESIGN.md`](DESIGN.md): Tailwind v4 tokens, no inline styles, defined color/typography/spacing tokens, and the card pattern (`rounded-lg border border-zinc-200 bg-white p-6 shadow-sm`). Deviations are listed in [`design-validation.md`](design-validation.md).
- **NFR-2 Fidelity to mockup** — Both screens match the structure and layout of [`Mockup.fig`](Mockup.fig).
- **NFR-3 Accessibility** — Images have `alt` text; form inputs have associated labels; interactive elements are keyboard accessible and use semantic HTML per DESIGN.md's accessibility rules.
- **NFR-4 Responsive** — Mobile-first; both screens are usable from small phones up to desktop.
- **NFR-5 Boilerplate conventions** — Built with the existing boilerplate (Next.js 16 App Router, Server Components by default, existing auth flow). Protected pages sit in the `(dashboard)` route group; auth pages in `(auth)`.

## 7. Known gaps against these requirements

These are the requirements the current build does not yet meet. They are captured here so the requirements can be signed off as the target, with the gaps tracked separately.

| Requirement | Gap | Source |
|-------------|-----|--------|
| FR-10 / FR-11 | Sign-in lands on `/dashboard` instead of `/team` about 1 login in 10, with no error shown. | BUG-01, [`test-report-flow.md`](test-report-flow.md) |
| FR-16 | The build has a placeholder card named "UX" (role "UX"). The UX role is now shared with no dedicated owner, so this card must be removed — the page should list the four real members. | [`test-report-flow.md`](test-report-flow.md), `team/page.tsx` |
| FR-17 | Every member photo is set to `photo: "/team/"` and there is no `frontend/public/team/` folder, so every avatar renders broken (natural width 0). No placeholder fallback exists. | [`test-report-flow.md`](test-report-flow.md), `team/page.tsx` |

## 8. Acceptance Criteria

The feature is done when:

- [ ] The login page matches the mockup and offers Google + email/password sign-in.
- [ ] Valid credentials sign the user in and **reliably** land them on `/team`.
- [ ] An unauthenticated user cannot reach `/team` and is sent to sign-in.
- [ ] The team page shows the team name, a supporting line, and exactly one card per member.
- [ ] Every card shows a real person's photo (or placeholder avatar), name, role, and blurb — no placeholder people, no broken images.
- [ ] The grid is responsive from mobile to desktop.
- [ ] Login and team page pass the design validation in [`design-validation.md`](design-validation.md).
- [ ] Sign-off recorded by the PM.
