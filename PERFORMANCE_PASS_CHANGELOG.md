# Performance & Responsiveness Pass — Changelog

Scope: measurable performance wins only, no functionality, routes, visual
design, or database behavior changed. Verified with `tsc --noEmit` (clean)
and `next build` (compiles and bundles clean — the only build failure in
this sandbox is Google Fonts being unreachable behind the network
allowlist, a pre-existing sandbox limitation noted in DAY7_CHANGELOG.md,
not a bug introduced here).

## What was already good (left untouched)

Before changing anything, the codebase was audited end-to-end. Several
things the brief asked about were already handled correctly and weren't
touched, to respect "don't rewrite working architecture for stylistic
reasons":

- Every Mongo query already uses `.lean()` and scopes to `ownerId` with
  proper compound indexes (`{ownerId,updatedAt}`, `{caseId,type}`, etc.).
- `lib/db/connect.ts` already caches the Mongoose connection on `global`
  across serverless invocations / dev hot-reloads.
- The case detail page (`app/(dashboard)/cases/[id]/page.tsx`) already
  parallelizes its server-side data fetches with `Promise.all`.
- `CaseGraphView`'s node components are already `memo`-wrapped with a
  stable `nodeTypes` map, and its dagre layout is already behind a
  `useMemo` keyed on the actual inputs — this is the correct pattern and
  wasn't changed.
- `@xenova/transformers` (the local embeddings model) is only ever
  imported from server-side code (API routes, Inngest functions) — no
  leak into the client bundle to fix.
- `prefers-reduced-motion` is already respected both in CSS
  (`globals.css`) and for framer-motion specifically (`MotionProvider` /
  `MotionConfig reducedMotion="user"`).
- The AI processing states (`AnalysisProgressCard`, `AILoaderOrb`,
  `AIWorkingBlock`, `AIDotWave`) already use restrained, GPU-friendly,
  staggered animations reserved for genuine background-job waits — this
  is exactly the "premium, not flashy" language the brief asked for, so
  it was left as-is rather than re-animated.

## Changes made

### 1. Tabs no longer discard themselves on every switch
`components/cases/case-tabs.tsx` used Radix's default `TabsContent`
behavior, which fully **unmounts** a tab's content the instant you switch
away. That meant every trip back to a previously-visited tab was a cold
start: Chat re-fetched its entire message history from scratch, the Graph
tab re-ran dagre's layout algorithm and lost your pan/zoom position, and
Drafts lost any in-progress step.

Tabs now use Radix's `forceMount` once a tab has been opened at least
once (tracked in a small `visitedTabs` set), and are hidden with a CSS
rule (`data-[state=inactive]:hidden`, added to `components/ui/tabs.tsx`)
instead of being torn down. A tab that's never been clicked still isn't
mounted at all — so it never fires its data fetch — but once you've
visited it, coming back is instant with zero network or layout work.

### 2. That change would have doubled up polling — fixed at the source
Simply keeping tabs mounted would have created a real bug: Overview and
Timeline both call `useCaseAnalysis`, and that hook was a hand-rolled
`fetch` + `setInterval` — two independent timers hitting
`/api/cases/[id]/analysis` in parallel the moment both tabs were kept
alive. Same risk for `useCaseGraph`.

Both hooks (`lib/hooks/use-case-analysis.ts`, `lib/hooks/use-case-graph.ts`)
were rewritten on React Query — the same library already used by
`use-case-status.ts`, just applied consistently. Every consumer keys off
the same `["case-analysis", caseId]` / `["case-graph", caseId]` query, so
React Query dedupes them into one shared in-flight request and one poll
timer no matter how many components are mounted. **Public function
signatures are unchanged** — `overview-tab.tsx` and `timeline-tab.tsx`
needed zero edits.

This also has a second benefit for free: React Query's default
*structural sharing* means that when a poll returns data that's identical
to what's cached, the object references for unchanged nested
arrays/items are reused rather than replaced. That's what makes change
\#4 below actually effective instead of cosmetic.

`use-drafts.ts` and `use-case-chat.ts` were left as plain hooks — each
only ever has one mounted consumer, so there's no duplication risk to
fix, and rewriting them would have been risk without benefit.

### 3. ReactFlow + dagre no longer ship on every case page
`components/cases/graph-tab.tsx` statically imported `CaseGraphView`,
which pulls in `reactflow` and `dagre` (together ~81 KB gzipped in this
build) — shipped to *every* case page's JS bundle even if the lawyer
never opens the Graph tab. It's now loaded via `next/dynamic(..., {ssr:
false})` with the existing skeleton as the loading state (ReactFlow
measures the DOM, so it was never SSR-safe anyway). Verified in a local
build: this content now lands in its own on-demand chunk
(`c37d3baf.*.js`, 81 KB) separate from the `/cases/[id]` route's main
bundle.

### 4. Memoized the components that render inside polled lists
`DocumentRow`, `ChatMessageBubble`, `FactCard`, `ContradictionCard`,
`MissingInfoCard`, `TimelineSection`, `DeadlineSection`, and `CaseRow`
are now wrapped in `React.memo`. On their own this does nothing if the
parent hands them a new callback prop on every render — so the
`onViewSource` handlers in `overview-tab.tsx`, `timeline-tab.tsx`,
`chat-panel.tsx`, and `graph-tab.tsx` were also moved to `useCallback`.
Combined with #2's structural sharing, an unchanged document/fact/message
now genuinely skips re-rendering when a sibling changes or a poll tick
returns identical data, instead of the whole list re-rendering every 3–4
seconds while anything is processing.

### 5. Bundle-level tuning
`next.config.mjs`:
- Added `experimental.optimizePackageImports` for `lucide-react`,
  `framer-motion`, and the Radix packages in use. These are imported via
  named/barrel imports throughout the app (lucide icons especially, on
  nearly every component) — this rewrites those to per-module imports at
  build time so only the icons/pieces actually used ship, with no call
  site changes required.
- Added `images.formats: ["image/avif", "image/webp"]` so Next serves
  modern formats to browsers that support them for the existing
  `remotePatterns` (Clerk avatars, Supabase-hosted assets) instead of
  always falling back to source format.

### 6. React Query defaults
`components/providers/query-provider.tsx` got a `staleTime: 5000` /
`gcTime: 5 * 60 * 1000` default. Previously every query defaulted to
`staleTime: 0`, meaning any remount (e.g. navigating away from a case and
back) triggered an immediate refetch even for data that's almost
certainly still fresh. The explicit `refetchInterval` on the
analysis/graph/status hooks is unaffected by this — that's a separate
mechanism and keeps polling exactly as before while something is
genuinely in flight.

## Verified

- `npx tsc --noEmit` — clean, zero errors.
- `npx next build` — compiles and bundles clean (font fetch is the only
  failure, and only because this sandbox's network allowlist doesn't
  include `fonts.googleapis.com`; confirmed by temporarily stubbing
  `lib/fonts.ts`, building successfully, then reverting it — the real
  file was not changed).
- Confirmed via the build's chunk output that the ReactFlow/dagre bundle
  (81 KB) is split into its own on-demand chunk, separate from the
  `/cases/[id]` route.

## Not done in this pass

Being upfront about the edges of this pass rather than overstating it:

- No real browser/Lighthouse run was possible in this sandbox (no
  display, and the app needs live Clerk/Mongo/Supabase/Inngest
  credentials to run end-to-end) — the verification above is static
  (type-check + production build + bundle inspection), not measured
  runtime performance. I'd recommend a real Lighthouse pass and a
  screen-reader spot check once you have a deploy up, the same next step
  DAY7_CHANGELOG.md flagged.
- `public/logo.png` is 1.4 MB but isn't referenced anywhere in the app
  code (no `<img>` or `next/image` usage found for it) — nothing to fix
  there since it isn't being shipped to any page today.
- `useCaseChat` and `useDrafts` were intentionally left as plain hooks
  (see #2) rather than converted to React Query, since there's no
  duplication risk to fix and converting them would have been
  risk without measurable benefit.
- The dashboard's `getDashboardStatsForOwner` still loads the full case
  list to sum stats client-side (in the query layer) rather than an
  aggregation pipeline. At typical per-firm case-list sizes this is
  negligible, and a `.lean()` query already avoids the expensive part
  (full Mongoose document hydration); left as-is per "don't rewrite
  working architecture just for stylistic reasons" rather than
  introducing aggregation-pipeline risk for an unmeasured gain.

## Follow-up — logo wired in

`public/logo (1).png` (180×180 PNG, 15 KB — not the 1.4 MB noted above,
which described a different file that's since been replaced) has been
renamed to `public/logo.png` and is now actually referenced, closing the
gap called out above. It replaces the plain "A" gradient-tile placeholder
in every brand spot, rendered through `next/image` (so it's served in
AVIF/WebP per change #5 rather than a raw PNG, with no extra config
needed since it's a local `/public` asset):

- `components/shell/sidebar.tsx` — the persistent desktop nav rail, which
  is what's on-screen for `/dashboard` and every other route under
  `app/(dashboard)/layout.tsx`.
- `components/shell/mobile-app-shell.tsx` — the mobile top bar / drawer
  trigger shown below the `lg` breakpoint (same shared layout, so this
  covers the dashboard on mobile too).
- `components/shell/auth-shell.tsx` — the shared header on `/sign-in` and
  `/sign-up`.
- `app/layout.tsx` — added as the site favicon / apple-touch-icon via
  `metadata.icons`, so it also shows in the browser tab.

`components/cases/case-tabs.tsx` (the in-case Overview / Documents /
Timeline / Graph / Chat / Drafts strip) deliberately does not get a logo
— it's a content-area tab bar sitting right under `CaseHeader`, which
already shows the case title; a repeated wordmark there would be noise,
and the nav-level logo is one scroll up on every case page already.

Re-verified after this change: `npx tsc --noEmit` clean, and
`npx next build` compiles and bundles clean with dummy env vars standing
in for Clerk/Mongo/Supabase (this sandbox has neither live credentials
nor a browser, the same limitation noted above — with the dummy vars set,
the build now runs all the way through page generation rather than
stopping at page-data collection). Confirmed the ReactFlow/dagre chunk
from change #3 is still split out on its own (~80 KB, `c37d3baf.*.js`),
unaffected by this pass.
