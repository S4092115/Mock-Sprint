# Design Validation — Login → Team Page Feature

**Feature:** Styled login page leading into a team page.
**Date:** 15 August 2026
**Status:** Draft — for review
**Validated against:**
- Design mockup — [`Mockup.fig`](Mockup.fig) (Figma, exported 13 August 2026)
- Design system — [`DESIGN.md`](DESIGN.md)
**Code reviewed:** `frontend/src/app/(auth)/auth/signin/page.tsx`, `frontend/src/app/(auth)/layout.tsx`, `frontend/src/app/(dashboard)/team/page.tsx`
**Evidence:** [`screenshots/01-login-page.png`](screenshots/01-login-page.png), [`screenshots/02-team-page.png`](screenshots/02-team-page.png), [`screenshots/03-bug-01-landed-on-dashboard.png`](screenshots/03-bug-01-landed-on-dashboard.png)

---

## What this covers

This validates the built login and team pages against two things: the Figma mockup (does it look like what was designed?) and [`DESIGN.md`](DESIGN.md) (does it follow the project's design system?). Functional behaviour — the login redirect — is covered separately in [`test-report-flow.md`](test-report-flow.md); the one crossover with design (a broken avatar) is noted here and there.

## The mockup, briefly

The mockup has two frames on a near-black (`#1e1e1e`) background:

1. **Login** — the team name ("Team 52") shown large on the left, and a centred sign-in card: a "Sign in" heading with a subtext line, a "Continue with Google" button, an "or" divider, labelled email and password fields, a full-width "Sign in" button, and a register link underneath.
2. **Team** — a centred "Team 52" heading, then a grid of member cards (the template shows five). Each card is a light panel with a circular placeholder avatar (a person silhouette), a name, a role, and a blurb.

"Team 52" is a placeholder team name in the mockup; the real team's name is **"Team B"** (confirmed). The mockup grid is a five-slot template — the real team is four people, since the UX role is shared with no dedicated owner (see D-2).

---

## Login page

**Verdict: matches the mockup and follows the design system.**

| Design element | Mockup | Built | Result |
|----------------|--------|-------|--------|
| "Sign in" heading + subtext | Yes | `Sign in` + "Enter your credentials to continue" | Match |
| Continue with Google button | Yes | Yes, with Google logo | Match |
| "or" divider | Yes | Yes | Match |
| Email + password fields with labels | Yes | Yes, labelled and validated | Match |
| Full-width primary sign-in button | Yes | Yes | Match |
| Register link | Yes | Link to sign-up | Match |
| Dark theme | Dark background | Supported via `dark:` variants; container is `bg-zinc-50 dark:bg-zinc-950` | Match (theme follows the user/system preference) |
| Centred card on a full-height background | Yes | `min-h-screen flex items-center justify-center`, `max-w-sm` card | Match |

Design-system compliance is clean: Tailwind utility classes only, no inline styles, zinc/red tokens used as prescribed, inputs and buttons follow the DESIGN.md patterns, and inputs carry `aria-invalid` / `aria-describedby` with inline error text.

One note, not a defect: the mockup shows the login on a dark background, while the built page renders light or dark depending on the viewer's theme preference. The screenshot on file ([`01-login-page.png`](screenshots/01-login-page.png)) was captured mid-load and shows only the spinner, so it isn't useful evidence of the finished page — worth re-capturing a settled screenshot for the record.

---

## Team page

**Verdict: structurally matches the mockup, but has two visible defects and several design-system deviations.**

### Structure and layout

| Design element | Mockup | Built | Result |
|----------------|--------|-------|--------|
| Team name heading | "Team 52", centred | "Team B", centred, `text-3xl font-bold` | Match ("Team B" confirmed) |
| Supporting line under heading | — | "Meet our team" | Reasonable addition |
| One card per real member | Five template slots | Build shows five, incl. a "UX" placeholder | Deviation — team is four people; "UX" card to be removed (D-2) |
| Responsive card grid | 3-across grid | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (four members → 3 + 1 on desktop) | Match |
| Circular avatar per card | Placeholder silhouette | `rounded-full` image slot | Match in intent, broken in practice (see D-1) |
| Name / role / blurb per card | Yes | Yes | Match |
| Responsive (single column on mobile) | — | `grid-cols-1` base | Match |

### Defects

**D-1 — Every avatar is broken (High).** Every member is set to `photo: "/team/"`, and there is no `frontend/public/team/` folder in the repo, so every image resolves to nothing and renders as a broken image (natural width 0 in the browser). The mockup calls for a circular placeholder silhouette where a member has no headshot; the build has no placeholder fallback at all. This is the same finding as the test report's "Other observations". Fix: add real headshots under `frontend/public/team/`, and render a placeholder avatar (e.g. a lucide `UserIcon` on a zinc circle) whenever a photo is missing, instead of pointing `img` at a dead path.

**D-2 — Leftover "UX" placeholder card (High).** The third card has `name: "UX"` and `role: "UX"`. The UX designer left the team and the role is now shared with no single owner, so there is no person for this card. It must be removed so the page shows the four real members (Tommy Flasza, Samuel Brooks, Henry Vo, Jun Chan). Visible in [`02-team-page.png`](screenshots/02-team-page.png).

### Design-system deviations (against [`DESIGN.md`](DESIGN.md))

These don't break the page but move it off the shared design system. Worth tidying before sign-off.

| # | DESIGN.md says | Built | Note |
|---|----------------|-------|------|
| DS-1 | Card pattern is `rounded-lg border border-zinc-200 bg-white p-6 shadow-sm` | `border rounded-lg p-5 text-center` | Uses a bare `border` (no token colour), no `shadow-sm`, `p-5` instead of `p-6`. |
| DS-2 | Page layout uses `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` and the `PageHeader` component | `p-8` wrapper, hand-rolled heading | No max-width container; not using `PageHeader`. |
| DS-3 | Body/muted text uses zinc tokens (`text-zinc-900`, `text-zinc-500`) | No explicit text colours on heading/role/blurb | Relies on defaults rather than the token scale; role/blurb hierarchy isn't expressed with the prescribed muted token. |
| DS-4 | Images: use `next/image`; icon-only/decorative images handled deliberately; all images have meaningful `alt` | Raw `<img>` with `alt={member.name}` pointing at a dead path | Raw `<img>` over `next/image`, and the `alt` describes an image that never loads. |
| DS-5 | Icon sizing via `size-*`, placeholder/empty states via shared components | None used | A placeholder avatar (D-1) should use the shared icon + token approach. |

---

## Summary

- **Login page** — matches the mockup and the design system. Good to sign off on design once a settled screenshot is captured.
- **Team page** — the layout is right (team name, member cards, responsive grid), but it is not ready: every avatar is broken (D-1), the leftover "UX" placeholder card needs removing so the page shows the four real members (D-2), and the card/layout styling drifts from `DESIGN.md` (DS-1…DS-5).

Design sign-off should wait until D-1 and D-2 are fixed; the DS-* items are lower priority but should be picked up while the avatars are being fixed, since they touch the same cards. The redirect reliability issue (BUG-01) is a separate, functional problem tracked in [`test-report-flow.md`](test-report-flow.md).
