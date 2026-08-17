# Port new landing + onboarding + UI from years-value-explorer → yearsmoney

Source: `longevusmarcus/years-value-explorer` (TanStack Start, React 19, Tailwind v4, `motion`)
Target: `longevusmarcus/yearsmoney` (Vite SPA, React 18, Tailwind v3, `framer-motion`)

Decision: keep yearsmoney's stack; translate the new UI into it. No toolchain upgrade.

Locked scope (confirmed by user):
- App screens: **re-skin only** — tokens, fonts, radii, shared shells. No layout rebuilds, no feature changes.
- Routing: new landing at `/` **and** `/about`; new onboarding at `/onboarding`. Old `About.tsx` kept but unrouted.

## A. Foundation
- [ ] Vendor 9 local images from source `src/assets`
- [ ] Vendor 3 Lovable-hosted assets (`years-logo`, `woman-sky`, `woman-sky-desktop`) — downloaded, sizes match manifests
- [ ] Add Space Grotesk / JetBrains Mono / Inter / Cormorant to `index.html`
- [ ] Add `.font-display` + `.logo-gradient-text` + base heading rules to `index.css`
- [ ] `tailwind.config.ts`: Space Grotesk as `sans`, add `display` family

## B. Port UI components → `src/components/landing/`
- [ ] `hero-2-1.tsx` (Hero2 + LightLeakBackdrop + typed headline)
- [ ] `iphone-showcase.tsx` (5 phone screens, scroll-driven)
- [ ] `bento-grid-showcase.tsx`
- [ ] `morphing-card-stack.tsx`
- [ ] Skip `steps-workflow.tsx` — dead code in source, referenced nowhere

Transforms applied to each: `motion/react`→`framer-motion`, TanStack `Link`→`react-router-dom` `Link`,
drop `"use client"`, `.asset.json` imports → real image imports, `fetchPriority`→lowercase attr (React 18).

## C. Port pages
- [ ] `src/pages/Landing.tsx` ← `routes/index.tsx`
- [ ] `src/pages/Onboarding.tsx` ← `routes/onboarding.tsx` (9-step flow + plan)
- [ ] `src/pages/Filosofia.tsx` ← `routes/filosofia.tsx` (linked from hero badge)
- [ ] Skip `routes/calcola.tsx` — it is a **feature** (Supabase auth + simulator) and duplicates
      yearsmoney's existing Calculator/Auth/Home. Out of scope per "don't touch features".
- [ ] Skip `routes/privacy.tsx` + `routes/terms.tsx` — yearsmoney already has these pages
- [ ] Remap all `/calcola` CTAs → `/home` (yearsmoney's canonical app entry, per old About.tsx)

## D. Routing
- [ ] `App.tsx`: `/` → Landing (drop redirect), `/about` → Landing, add `/onboarding`, `/filosofia`

## E. App re-skin (shared shells only)
- [ ] `PageHeader`, `BottomNav`, `ui/button`, `ui/card` → new glass/typography language
- [ ] Verify no logic/props changed

## F. Verify
- [ ] `bun install` + typecheck + build
- [ ] Dev server: console clean, no 404s on assets
- [ ] Screenshots of `/`, `/onboarding`, `/filosofia`, and two app screens

## Review

All items done. `bun run build` and `tsc --noEmit` both clean.

### What changed
| File | Change |
|---|---|
| `index.html` | Added Space Grotesk + JetBrains Mono to the Google Fonts request |
| `src/index.css` | `.font-display`, `.font-mono`, `.logo-gradient-text`, h1–h4 display rules, smooth scroll |
| `tailwind.config.ts` | `sans` → Space Grotesk; added `grotesk` + `inter` families |
| `src/App.tsx` | `/` and `/about` → Landing; added `/onboarding`, `/filosofia`; dropped `RootRedirect` |
| `src/components/PageHeader.tsx` | Default title style → `font-display text-2xl` |
| `src/components/BottomNav.tsx` | Pill shape + stronger blur (token-based, so light mode still works) |
| `src/components/ui/button.tsx` | `rounded-md` → `rounded-full`, slightly wider padding |
| `src/components/landing/*` | 4 new components: Hero, IphoneShowcase, BentoGridShowcase, MorphingCardStack |
| `src/pages/{Landing,Onboarding,Filosofia}.tsx` | 3 new pages |
| `src/assets/*` | 12 images vendored |

No feature file touched — `Home`, `Purchase`, `Risks`, `Leaderboard`, `Settings`, `Auth`, hooks,
`integrations/`, `supabase/` are all unmodified (`git status` confirms).

### Translation notes
- `motion/react` → `framer-motion`; TanStack `Link` → `react-router-dom` `Link`
- Tailwind v4 `@theme` tokens → v3 config + plain CSS. The landing's `oklch(...)` arbitrary values
  compile fine under v3 (73 of them), and PostCSS adds sRGB hex fallbacks — slightly wider browser
  support than the v4 original.
- `fetchPriority` → lowercase `fetchpriority` attribute (React 18 doesn't know the camelCase prop)
- Inline `style={{fontFamily}}` → `font-grotesk` / `font-cormorant` utilities
- **Lovable-hosted assets**: `years-logo`, `woman-sky`, `woman-sky-desktop` were `.asset.json`
  descriptors pointing at `/__l5e/assets-v1/...`, a path only Lovable's dev plugin serves. Downloaded
  the real files from the published app and vendored them (byte sizes match the manifests).
  `years-logo.png` is actually WebP, so it's saved as `years-logo.webp`.

### `calcola` — ported on request (second pass)
`src/pages/Calcola.tsx` at route `/calcola`. Session gate → auth screen → simulator.

- **Google OAuth swapped.** The source used `@lovable.dev/cloud-auth-js` via
  `src/integrations/lovable/index.ts`. Rather than add a Lovable-specific dependency, this uses
  `supabase.auth.signInWithOAuth({ provider: "google" })` — the exact pattern yearsmoney's own
  `Auth.tsx` already uses. Email/password, sign-up, and sign-out are unchanged from source.
- **Fixed a real bug in the source.** `Metric` had `"oklch(0.72_0.19_55)"` in an inline `style`
  — underscores are Tailwind arbitrary-value syntax, not valid CSS, so the value was dropped and both
  metric tones rendered in the inherited colour. Now `"oklch(0.72 0.19 55)"`, so warm/cold actually differ.
- **CTA target moved to `/calcola`.** All landing + onboarding CTAs now point here, which is what the
  design intends. Single constant: `src/components/landing/appEntry.ts` — set it to `/home` to send
  visitors into the main app instead. Hero, Landing, and Onboarding all read from it.

### Still not ported
- `routes/privacy.tsx`, `routes/terms.tsx` — yearsmoney already has these pages.
- `components/ui/steps-workflow.tsx` — dead code in the source; referenced nowhere.

### Verified
- Landing: all 8 sections render in order (`top`, `scopri`, `il-tempo-e-tuo`, `il-tuo-tempo`,
  `come-funziona`, `soluzione`, `inizia`, footer). Screenshots taken of each.
- Gradient-text treatment applies to all 7 time-value figures.
- Interactivity works: FinalCTA goal chips swap image + card; onboarding's "pick exactly two" gate
  enables/disables the Avanti button correctly.
- App re-skin confirmed by computed style: body + headings render Space Grotesk 500,
  `PageHeader` title line-height 22.8px (0.95 × 24), BottomNav radius 9999px / blur(24px).
- `/filosofia` renders chapter, Cormorant title, body lines, 5 pagination dots, paper gradient.

Onboarding was then driven through all 10 steps with the pane visible: every step advanced and the plan
screen rendered. With €120k liquid + €3.000/mo income + 20% saving the plan shows **4a 2m** —
120000 ÷ ((3000 − 600) × 12) = 4.17 years, so the ported projection math is correct.

`/calcola` auth screen verified rendering in both sign-in and sign-up modes. The authenticated
**simulator** view is built and typechecks but was not rendered — reaching it needs a real sign-in,
which is not something to do on the user's behalf.

### Known non-issues
- The bento cards appear twice in the DOM (desktop grid + mobile scroller, one CSS-hidden). Same as source.
- Earlier in development the onboarding looked frozen mid-flow. Cause: while the Browser pane is
  backgrounded (`document.visibilityState === "hidden"`) `requestAnimationFrame` is paused, so
  framer-motion stalls at its `initial` values and `AnimatePresence` exits never finish. The original
  years-value-explorer app behaves identically under the same condition. Resolved once the pane was
  visible — recorded here only so the symptom isn't misdiagnosed later.

## G. Third pass — app screens matched to the onboarding look (on request)

Asked for: app screens should share onboarding's background, logo, and fonts.

- [x] `src/components/AppBackground.tsx` — the onboarding's black + three blurred colour blooms,
      mounted once in `App.tsx` as a fixed `-z-10` layer
- [x] `--background` dark token `0 0% 4%` → `0 0% 0%` (pure black, matching onboarding's `bg-black`)
- [x] All 20 app screens: root `min-h-screen bg-background` → `bg-transparent` so the shared field
      shows through (`CheckIn.tsx` had 17 such wrappers; `NotFound.tsx`'s stray `bg-gray-100` also fixed)
- [x] `src/components/YearsWordmark.tsx` — the logo + "YEARS" lockup from the onboarding header,
      now rendered by `PageHeader` on every screen that uses it
- [x] Fonts already unified in pass one (Space Grotesk `sans` + `.font-display`)

**Light mode preserved.** The app has a theme toggle and onboarding is dark-only, so the blooms are
dimmed to 40% under `.light .years-ambient` rather than forcing black everywhere. Verified: light mode
still renders dark text on a light ground with only a soft warm tint.

Verified by screenshot on `/home` and `/leaderboard` in both themes. Class-name changes only — no
component logic, props, or data flow touched.

## H. Fourth pass — glass surfaces, dark-only, no in-app logo

Four follow-up requests, in order:

**1. Cards and fields should be glass / transparent, some gradient.** The app had ~360 uses of
`bg-card` / `bg-muted` / `bg-secondary` / `border-border`, many with opacity modifiers
(`bg-card/80`, `border-border/50`), so per-element edits were out. Fixed at the token level instead:

- `tailwind.config.ts` gains a `surface()` helper returning an alpha-aware colour function.
  `card`, `muted`, `secondary`, `input`, and `border` now resolve to translucent white overlays.
- Each token carries a resting opacity (`--card-a: 0.04`, `--border-a: 0.10`, …) matching the
  onboarding's `border-white/10 bg-white/[0.03]`.
- Opacity modifiers still work and **compose**: `bg-card/80` → `calc(var(--card-a) * .8)`, i.e.
  "80% as present as a card" rather than "80% opaque grey". Verified in the built CSS.
- `popover` deliberately stays opaque — dropdowns and selects float over arbitrary content.
- `ui/card`, `ui/input`, `ui/textarea` gained `backdrop-blur` so they read as glass, not just tint.
- Gradient: `ui/progress` indicator now uses the YEARS violet→gold ramp, so every progress bar in
  the app picks it up.

No legacy `bg-opacity-*` / `border-opacity-*` utilities exist in the repo, which is what makes the
colour-function approach safe here.

**2. Remove the logo from inside the app.** `YearsWordmark` dropped from `PageHeader` and the
component deleted.

**3. Remove light mode.** `ThemeProvider` now `forcedTheme="dark" enableSystem={false}`; the whole
`.light` token block is gone from `index.css`; `ThemeToggle` deleted and removed from both
`PageHeader` and Settings (its "appearance" section went with it). The provider stays because
`ui/sonner` reads `useTheme()`.

**4. Headline figures in white, not gradient.** Home's two runway numbers keep the display face but
render `text-foreground`. Gradient now appears only on progress bars.

Verified by screenshot: `/home` (glass cards over the ambient blooms, white figures, no logo, no
toggle) and `/settings` (Appearance section cleanly gone, glass cards intact).

## I. Fifth pass — Home chart + figures, and the leaderboard's own row

**Home projection chart** now uses the onboarding plan chart's treatment: `LineChart` → `ComposedChart`
with the same two gradients (warm→violet area fill, violet→gold stroke), dots off, `activeDot` kept so
the tooltip still has a target. Same data keys, same formatter — behaviour untouched, styling only.

**"If you stop" / "keep earning" figures** carry `logo-gradient-text` like the onboarding plan figures.

> These were set to white two requests earlier. The reason the gradient looked wrong then: with
> `background-clip: text` the ramp maps across the *element box*, and a `<p>` is full-width, so short
> text only sampled the violet start. Adding `inline-block` makes the box hug the glyphs, so the full
> violet→white→gold ramp lands on the text — which is exactly why it looks right inside onboarding's
> narrow cards. Same fix applied to the leaderboard spans.

**Leaderboard own-row.** There was no current-user row at all — all 50 entries are generated names.
Added one, driven by the existing `useUserFinances` hook:

- Appears only when signed in **and** net worth + income are set. Signed out → list renders exactly as
  before, per the brief.
- Uses the same buffer formulas as the synthetic rows, so the ranking compares like with like.
- Labelled "You"; rank, name, and both buffer figures get the gradient.
- The trophy stays a top-3 marker and merely turns gold on the visitor's row. Giving them a trophy at
  any rank would read as a win they hadn't earned.
- **Caveat worth knowing:** this places a real figure among fabricated competitors, so the rank is
  illustrative, not a true standing. It becomes real once the leaderboard reads from Supabase.

Verified: chart and gradient figures screenshotted with seeded demo numbers (6y 7m / 6y 11m, gradient
area visibly curving up); signed-out leaderboard confirmed unchanged. The signed-in "You" row was not
rendered — that needs a real sign-in.

### One thing to be aware of
`MsxBootGate.isAtAuthedRoute()` (`src/msx/MsxBootGate.tsx:531`) does not list `/calcola`, `/onboarding`,
or `/filosofia`. Inside the MSX shell those routes show the splash and get replaced by `/home`. Harmless
for normal web visitors — the MSX shell launches straight into the app — but add them to that list if
these pages should ever be reachable from inside MSX.

### Left for a follow-up call
- `src/pages/About.tsx` (809 lines) is now unrouted but still in the repo, as agreed. Delete when happy.
- `src/components/Onboarding.tsx` was already dead code before this change and now shares a name with
  the new `src/pages/Onboarding.tsx`. Worth deleting to avoid import confusion.
- App screens still use their original layouts. `.logo-gradient-text` is now available if you want the
  time-value figures inside the app to get the same violet→gold treatment as the landing.
- Nothing committed or pushed — `AGENTS.md` warns that pushes sync back into Lovable.
