# FlowForge — Logo Redesign + Motion Pass

Date: 2026-08-09
Status: Approved by Aarav (logo + rollout + prompt-template scope), motion implementation gated on a live preview review before touching site files.

## 1. Logo — "Forge Spark"

Replaces the current "Forge Current" mark (amber arc over a green bar, built 2026-08-08).

**Concept:** an amber bolt struck from an anvil, over a solid green baseline bar, on a fixed dark badge. More literal "forge" imagery than the previous arc; higher contrast so it reads instantly at favicon size.

**Colors** (existing site tokens — unchanged):
- Bolt: `#ff8a2b` (amber, `--led`)
- Baseline bar: `#33c56a` (green)
- Badge: `#161310` (fixed — does not flip with the light/dark theme toggle, same as the current mark)

**Master artwork** (32×32 viewBox, matches existing icon convention):
```svg
<svg viewBox="0 0 32 32">
  <rect x="1" y="1" width="30" height="30" rx="7" fill="#161310"/>
  <path d="M17.5 4 L10 19 L14.5 19 L12.5 28 L22 14 L16.5 14 Z" fill="#ff8a2b"/>
  <rect x="6" y="22.5" width="20" height="4.5" rx="2.2" fill="#33c56a"/>
</svg>
```
Approved at real render sizes: 32px favicon, 20px header, 16px browser-tab — legible at all three (checked in the visual companion 2026-08-09).

**Rollout locations** (same 4 places the current mark lives, across all pages):
1. Favicon `<link>` (data URI) — every page
2. Header `.brand-mk` — every page
3. Footer `.brand-mk` — every page
4. Chat-widget `window.SUPPORT_CHAT_CONFIG.logoSvg` — inlined per-page (9 separate copies), also update `logoOnWhite` if needed (unchanged, badge stays dark)

**Method:** backup each file as `<name>.pre-2026-08-09-logo-rebuild.bak`, then propagate via a scratch Node script doing exact string replacement (identical approach to the 2026-08-08 rebuild — safe because all pages share byte-identical boilerplate for these elements).

## 2. Motion

**Library:** [`motion`](https://motion.dev) (the framework-free successor to Framer Motion — "Motion for the DOM"), loaded via a single CDN `<script type="module">` import. No npm, no bundler, no React — matches the site's existing vanilla-JS/no-build-step architecture (confirmed in `PRODUCT.md`).

**Scope — 4 additions, ranked by payoff:**

1. **Chat-demo sequencing** (highest payoff): the 4 hero chat bubbles animate in one at a time with a short delay, instead of appearing together as part of the existing `.rev` fade-up. Directly visualizes the core pitch ("watch it answer live").
2. **Spring hovers**: buttons and pricing tier cards get a tight, low-bounce spring on hover/press, replacing the current CSS `ease` transitions. Deliberately snappy, not playful/bouncy — matches the "LED-precision, grounded, not guessing" brand voice from `PRODUCT.md`; bouncy motion would undercut that positioning.
3. **Logo strike**: the new Forge Spark bolt does a one-time "strike" flash on first page load, header only, gated (e.g. a session-storage flag or `:has(+ script)` one-shot pattern) so it never repeats on internal navigation.
4. **Page transitions**: cross-fade between the 11 pages via the browser-native **View Transitions API** — not part of the `motion` library, a separate native API. Chrome/Edge get the cross-fade; Firefox/Safari fall back to normal instant navigation with no broken state.

All 4 respect `prefers-reduced-motion`, matching the pattern already established in the codebase (`@media (prefers-reduced-motion:reduce)` already zeroes out animation/transition durations site-wide).

**What's explicitly out of scope:** the site's existing scroll-reveal (`.rev`/`.rev.in` via IntersectionObserver), stat count-up, and marquee strip are already well-implemented and reduced-motion-safe — left as-is, not rebuilt in `motion`.

**Workflow requirement (per Aarav 2026-08-09):** before any of the 4 items is wired into the live site pages, build a working interactive preview (real `motion` code, real interactions — either the visual-companion browser tab or a standalone local demo page) and get explicit sign-off per item. Do not implement directly into `index.html`/subpages first.

## 3. Reusable design-process prompt template

**Constraint (per Aarav 2026-08-09):** the template must produce a **unique identity per client business**, not reuse FlowForge's own amber/green "recharge-shop counter" visual system. The *process* is reusable; the *output* must not be. This mirrors a rule already encoded in this exact repo — `index.html`'s own header comment documents a THESIS / OWN-WORLD / STORY / FIRST VIEWPORT / FORM / FINISH methodology (the `impeccable` skill's process), which is how FlowForge's own site arrived at its specific "recharge-shop counter" identity rather than a generic template. The reusable prompt template re-applies that *process*, not that *output*.

Deliverable: a plain-text brief Aarav can paste as a message in any future Claude Code session (no special slash command — pasting it is the command; Claude auto-triggers `design`, `impeccable`, and `ui-ux-pro-max` from the content). Contents:
- Instruction to gather the target business's specifics first (industry, audience, tone, what makes this business different) before proposing any visual direction
- Explicit instruction to derive a new THESIS/OWN-WORLD/STORY for *this* business, and an explicit prohibition on reusing FlowForge's own amber/green/recharge-shop palette or metaphor for a different client
- Which installed skills to invoke and why (`design` for logo/visual assets, `impeccable` for the critique/redesign process itself, `ui-ux-pro-max` for palette/type-pairing reference data)
- The same constraints this project already enforces: no fabricated claims/testimonials, WCAG AA floor, brand voice grounded in what the business actually offers

Full text of the template is written out as part of implementation (not duplicated here to avoid drift between two copies).

## 4. Rollout & verification

- Backup-then-propagate pattern (see §1) for the logo; motion additions land page-by-page after preview sign-off (§2)
- Verify in Chrome at `localhost:4173` (`dev-proxy-server.js`), both dark and light theme, no console errors
- Confirm `prefers-reduced-motion` still fully disables all new animation
- Confirm the fixed dark badge (`#161310`) still renders correctly against both themes (this exact bug class bit the 2026-08-08 rebuild once — a dark chip on a dark background)
