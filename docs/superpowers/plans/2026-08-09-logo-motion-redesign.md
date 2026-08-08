# FlowForge Logo Redesign + Motion Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace FlowForge's logo mark with the approved "Forge Spark" design across all live pages, add 4 specific motion/animation upgrades using the framework-free `motion` library, and produce a reusable per-client design-process prompt template — all gated by explicit approval checkpoints with Aarav before anything lands on live site files.

**Architecture:** Static HTML/CSS/vanilla-JS site (`Documents/flowforge-site/`), no build step, no framework. Logo swap and any approved motion changes are applied via one-off Node scripts doing targeted regex replacement across the 10 live HTML pages (byte-identical boilerplate per page, confirmed in the 2026-08-08 rebuild), with `.bak` backups first. Motion is prototyped in a standalone, unlinked preview page and approved per-item in the browser before being wired into real pages.

**Tech Stack:** Vanilla HTML/CSS/JS, Node.js (migration scripts only, not shipped), `motion@13.0.0` (CDN ESM import, no npm install, no bundler), View Transitions API (native browser API, no library).

## Global Constraints

- No fabricated claims, testimonials, or numbers anywhere (per `PRODUCT.md` — "grounded, not guessing" is a load-bearing brand principle)
- All new motion must respect `prefers-reduced-motion` — the codebase already zeroes out animation/transition durations under that media query (`index.html:33`); new motion must not bypass this
- Motion feel must be tight/snappy, not bouncy/playful — matches the "LED-precision" brand voice, not a generic SaaS bounce
- Do not modify `quote.html` (real, already-issued client quote, gitignored, not a site page)
- Do not regress WCAG AA (contrast, focus indicators, form labeling — already fixed in this codebase per `PRODUCT.md`)
- Verify every change in both dark and light theme (the fixed `#161310` badge over a light theme background bit a real bug in the 2026-08-08 rebuild — check for a repeat)
- **Do not implement any of the 4 motion items into live site pages before Aarav approves each one in the standalone preview page** (explicit instruction, 2026-08-09)

---

## File Structure

- Create (scratch, not committed): `apply-forge-spark-logo.js` — one-off Node migration script, run once then discarded (matches the un-committed "scratch Node script" pattern used for the 2026-08-08 logo rebuild)
- Modify: all 10 live HTML pages in `Documents/flowforge-site/` — `index.html`, `about.html`, `contact.html`, `services.html`, `professional-websites.html`, `monthly-care.html`, `lead-capture-that-lands.html`, `google-business-setup.html`, `ai-chat-assistant.html`, `privacy-policy.html`
- Create (temporary, deleted at end of Task 2): `motion-preview.html` at site root — standalone demo page for the 4 motion items, not linked from nav, served by the existing `dev-proxy-server.js` at `localhost:4173/motion-preview.html`
- Create: `flowforge-design-process-prompt.md` in `Documents/flowforge-site/docs/` — the reusable prompt template text Aarav pastes into future sessions

---

## Task 1: Forge Spark logo — build and propagate

**Files:**
- Create (scratch): `apply-forge-spark-logo.js`
- Modify: all 10 live HTML pages listed above

**Interfaces:**
- Produces: every page's favicon, header `.brand-mk`, footer `.brand-mk`, and (where present) `SUPPORT_CHAT_CONFIG.logoSvg` now render the Forge Spark mark instead of the current arc-over-bar mark. No other markup changes.

- [ ] **Step 1: Confirm current mark's 3 fingerprints are consistent across all 10 pages**

```bash
cd "Documents/flowforge-site"
grep -l 'viewBox="0 0 32 32" fill="none"' *.html
grep -l 'viewBox=\\"0 0 48 48\\"' *.html
grep -l 'rel="icon"' *.html
```
Expected: header/footer fingerprint present in all 10 pages (2 matches each via header+footer); `logoSvg` fingerprint present in the 9 pages that carry the chat widget (not `privacy-policy.html`); favicon `rel="icon"` present in all 10.

- [ ] **Step 2: Write the migration script**

```javascript
// apply-forge-spark-logo.js
// One-off migration: swap FlowForge's logo mark (arc-over-bar) for the
// approved "Forge Spark" mark (bolt-over-bar) across all live site pages.
// Run once from the flowforge-site directory, then discard this file.
'use strict';

const fs = require('fs');
const path = require('path');

const SITE_ROOT = __dirname;
const PAGES = [
  'index.html', 'about.html', 'contact.html', 'services.html',
  'professional-websites.html', 'monthly-care.html',
  'lead-capture-that-lands.html', 'google-business-setup.html',
  'ai-chat-assistant.html', 'privacy-policy.html',
];

// --- New artwork, 3 sizes, matching each existing instance's viewBox convention ---

// A) Header/footer .brand-mk inline icon (32x32 viewBox, no badge —
//    the dark chip is a CSS box, `.brand-mk` in index.html's <style>)
const BRAND_MK_RE = /<svg width="20" height="20" viewBox="0 0 32 32" fill="none"[^>]*>[\s\S]*?<\/svg>/g;
const BRAND_MK_NEW =
  '<svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M17.5 4 L10 19 L14.5 19 L12.5 28 L22 14 L16.5 14 Z" fill="#ff8a2b"/>' +
  '<rect x="6" y="22.5" width="20" height="4.5" rx="2.2" fill="#33c56a"/></svg>';

// B) Favicon data URI (64x64 viewBox, standalone, includes its own badge)
const FAVICON_SVG_NEW =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" rx="14" fill="#161310"/>' +
  '<path d="M35 8 L20 38 L29 38 L25 56 L44 28 L33 28 Z" fill="#ff8a2b"/>' +
  '<rect x="12" y="45" width="40" height="9" rx="4.4" fill="#33c56a"/></svg>';
const FAVICON_HREF_RE = /href="data:image\/svg\+xml,[^"]*"/;
const FAVICON_HREF_NEW = `href="data:image/svg+xml,${encodeURIComponent(FAVICON_SVG_NEW)}"`;

// C) Chat-widget logoSvg config (48x48 viewBox, standalone, own badge,
//    embedded inside a JS string literal so quotes are escaped as \" in
//    the raw file text)
const WIDGET_SVG_RE = /<svg viewBox=\\"0 0 48 48\\"[\s\S]*?<\/svg>/g;
const WIDGET_SVG_NEW =
  '<svg viewBox=\\"0 0 48 48\\" width=\\"24\\" height=\\"24\\" xmlns=\\"http://www.w3.org/2000/svg\\">' +
  '<rect x=\\"4\\" y=\\"4\\" width=\\"40\\" height=\\"40\\" rx=\\"8\\" fill=\\"#161310\\"/>' +
  '<path d=\\"M26 8 L16 28 L22 28 L19.3 40 L32 21.3 L24.7 21.3 Z\\" fill=\\"#ff8a2b\\"/>' +
  '<rect x=\\"10.7\\" y=\\"32.7\\" width=\\"26.7\\" height=\\"6\\" rx=\\"2.9\\" fill=\\"#33c56a\\"/></svg>';

let totalReplacements = 0;

for (const page of PAGES) {
  const filePath = path.join(SITE_ROOT, page);
  const original = fs.readFileSync(filePath, 'utf8');

  const brandMkCount = (original.match(BRAND_MK_RE) || []).length;
  const faviconCount = FAVICON_HREF_RE.test(original) ? 1 : 0;
  const widgetCount = (original.match(WIDGET_SVG_RE) || []).length;

  if (brandMkCount + faviconCount + widgetCount === 0) {
    console.log(`${page}: no matches, skipping`);
    continue;
  }

  fs.writeFileSync(`${filePath}.pre-2026-08-09-logo-rebuild.bak`, original, 'utf8');

  let updated = original
    .replace(BRAND_MK_RE, BRAND_MK_NEW)
    .replace(FAVICON_HREF_RE, FAVICON_HREF_NEW)
    .replace(WIDGET_SVG_RE, WIDGET_SVG_NEW);

  fs.writeFileSync(filePath, updated, 'utf8');
  const pageTotal = brandMkCount + faviconCount + widgetCount;
  totalReplacements += pageTotal;
  console.log(`${page}: brand-mk x${brandMkCount}, favicon x${faviconCount}, widget x${widgetCount}`);
}

console.log(`\nDone. ${totalReplacements} total replacements across ${PAGES.length} pages.`);
```

- [ ] **Step 3: Run it**

```bash
cd "Documents/flowforge-site"
node apply-forge-spark-logo.js
```
Expected output: a line per page showing non-zero `brand-mk`/`favicon`/`widget` counts (2/1/1 for the 9 pages with the chat widget, 2/1/0 for `privacy-policy.html`), and a final total line. If any page shows all-zero, stop and investigate that page's markup before continuing — do not assume it's fine.

- [ ] **Step 4: Verify no old-mark artifacts remain**

```bash
grep -c 'M6 14C9.5 5.5 22.5 5.5 26 14' *.html
grep -c 'M13 21C16.5 12 31.5 12 35 21' *.html
```
Expected: `0` for every file on both commands (these are the old arc paths — their absence confirms full replacement).

- [ ] **Step 5: Visual check in browser**

Start the dev server if not already running (`node dev-proxy-server.js`), then open `http://localhost:4173/index.html` in Chrome. Confirm: favicon shows the new bolt, header brand mark shows the new bolt, footer brand mark shows the new bolt, and opening the chat widget (bottom-right launcher) shows the new bolt in its header. Toggle dark/light theme — badge should stay the fixed dark chip in both. Check the console for errors (F12 → Console tab) — expect none introduced by this change. Spot-check 2 more pages (e.g. `about.html`, `contact.html`) the same way.

- [ ] **Step 6: Delete the scratch script and commit**

```bash
cd "Documents/flowforge-site"
rm apply-forge-spark-logo.js
git add -A
git commit -m "feat: replace logo mark with approved Forge Spark design"
git status
```
Expected: working tree clean aside from the `.bak` files (already gitignored via `*.bak`), scratch script gone, commit created.

---

## Task 2: Build the motion preview page and get per-item approval

**Files:**
- Create (temporary): `motion-preview.html`

**Interfaces:**
- Consumes: nothing from Task 1
- Produces: 4 approval decisions (yes/no per item), recorded back into this plan file before Task 3 starts

- [ ] **Step 1: Write the preview page**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Motion preview — FlowForge (internal, not a site page)</title>
<style>
  body{background:#17140f;color:#f3ead9;font-family:system-ui,sans-serif;margin:0;padding:40px 24px;max-width:720px;margin-inline:auto}
  h2{font-size:1.1rem;border-bottom:1px solid #33301f;padding-bottom:8px;margin-top:48px}
  .demo{background:#1e1a13;border-radius:8px;padding:24px;margin-top:16px}
  .btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;padding:12px 20px;border-radius:6px;border:0;background:#33c56a;color:#0e1410;cursor:pointer;font-size:.95rem}
  .tier{background:#272016;border-radius:6px;padding:20px;display:inline-block;width:180px;margin-right:14px}
  .chat-demo{display:flex;flex-direction:column;gap:8px}
  .cmsg{padding:10px 14px;border-radius:8px;max-width:80%;font-size:.9rem;opacity:0}
  .cmsg-u{background:#272016;align-self:flex-end}
  .cmsg-b{background:#2f7d4f33;border:1px solid #33c56a;align-self:flex-start}
  .replay{margin-top:14px;font-size:.85rem;color:#a89f8a;background:none;border:1px solid #4a4433;padding:6px 12px;border-radius:4px;cursor:pointer}
  .brand-mk{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;background:#161310}
  a{color:#ff8a2b}
</style>
</head>
<body>
<p><a href="index.html">← back to site</a> · this page is a design preview only, not linked from navigation, will be deleted after review</p>

<h2>1. Chat-demo sequencing</h2>
<p>Hero chat bubbles animate in one at a time instead of appearing together.</p>
<div class="demo">
  <div class="chat-demo" id="chatDemo">
    <p class="cmsg cmsg-u">Do you have evening batches?</p>
    <p class="cmsg cmsg-b">Yes — 6–8 PM, Mon–Sat. Want me to note your number so the owner can confirm a seat?</p>
    <p class="cmsg cmsg-u">Can you also help file my taxes? 😅</p>
    <p class="cmsg cmsg-b">That's outside what this business does — happy to connect you to the owner on WhatsApp for anything else.</p>
  </div>
  <button class="replay" id="replayChat">Replay</button>
</div>

<h2>2. Spring hovers</h2>
<p>Buttons and pricing cards get a tight, low-bounce spring on hover — hover/tap each to feel it.</p>
<div class="demo">
  <button class="btn" id="springBtn">Get a free demo</button>
  <div style="margin-top:20px">
    <div class="tier" id="springTier1"><b>Starter</b><br>₹3,999</div>
    <div class="tier" id="springTier2"><b>Business</b><br>₹9,999</div>
  </div>
</div>

<h2>3. Logo strike</h2>
<p>One-time "strike" flash of the bolt on first load — reload this page to see it fire again (in production it's gated to fire once per session).</p>
<div class="demo">
  <span class="brand-mk"><svg id="logoStrike" width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 4 L10 19 L14.5 19 L12.5 28 L22 14 L16.5 14 Z" fill="#ff8a2b"/><rect x="6" y="22.5" width="20" height="4.5" rx="2.2" fill="#33c56a"/></svg></span>
</div>

<h2>4. Page transitions</h2>
<p>Cross-fade via the native View Transitions API. Click through — works in Chrome/Edge, falls back to a normal instant nav elsewhere (try it, then check in Firefox if you have it).</p>
<div class="demo">
  <a class="btn" href="motion-preview.html?page=2" id="vtLink" style="text-decoration:none">Go to "page 2" →</a>
</div>

<script type="module">
import { animate, stagger, hover } from "https://cdn.jsdelivr.net/npm/motion@13.0.0/+esm";

function playChatDemo() {
  const bubbles = document.querySelectorAll('#chatDemo .cmsg');
  animate(bubbles, { opacity: [0, 1], y: [12, 0] }, { delay: stagger(0.5), duration: 0.4, ease: 'easeOut' });
}
playChatDemo();
document.getElementById('replayChat').addEventListener('click', playChatDemo);

const springOpts = { type: 'spring', stiffness: 400, damping: 25 };
['springBtn', 'springTier1', 'springTier2'].forEach((id) => {
  const el = document.getElementById(id);
  hover(el, () => {
    animate(el, { scale: 1.04 }, springOpts);
    return () => animate(el, { scale: 1 }, springOpts);
  });
});

const bolt = document.getElementById('logoStrike');
if (!sessionStorage.getItem('ff-logo-struck')) {
  animate(bolt, { opacity: [0, 1], scale: [0.7, 1] }, { duration: 0.5, ease: 'circOut' });
  sessionStorage.setItem('ff-logo-struck', '1');
} else {
  // demo-only: allow replay every load by clearing the flag; production
  // version sets this once per real session and never clears it here
  sessionStorage.removeItem('ff-logo-struck');
}

if (document.getElementById('vtLink') && !document.startViewTransition) {
  document.querySelector('h2 + p + .demo p') // no-op guard, VT unsupported here
}
</script>
</body>
</html>
```

- [ ] **Step 2: Serve and open it**

```bash
cd "Documents/flowforge-site"
node dev-proxy-server.js
```
Open `http://localhost:4173/motion-preview.html` in Chrome (use the claude-in-chrome tool: navigate to the URL, then interact — hover the buttons/tiers, click Replay, click the page-transition link, reload the page to see the logo strike). Take a screenshot of each of the 4 sections. Check the browser console for errors.

- [ ] **Step 3: Get approval per item**

Present the 4 items to Aarav with the AskUserQuestion tool (multi-select: which of the 4 to bring into the live site), based on what was just demoed. Do not proceed to Task 3 until this is answered.

- [ ] **Step 4: Delete the preview page**

```bash
cd "Documents/flowforge-site"
rm motion-preview.html
```
(No commit needed — this file was never committed.)

---

## Task 3: Wire approved motion items into live pages

**Files:**
- Modify: `index.html` (items 1–3 all touch the hero/header, which only exists on the homepage)
- Modify: all 10 live pages (item 4, page transitions, is site-wide)

**Interfaces:**
- Consumes: the approval decisions from Task 2 Step 3
- Produces: live, working motion on the approved items only

Only execute the sub-steps for items Aarav approved in Task 2.

- [ ] **Step 1 (if chat-demo sequencing approved): Add the motion import and sequencing call to `index.html`**

Add before the closing `</body>` tag, after the existing inline `<script>` blocks:
```html
<script type="module">
import { animate, stagger } from "https://cdn.jsdelivr.net/npm/motion@13.0.0/+esm";
const bubbles = document.querySelectorAll('.chat-demo .cmsg');
if (bubbles.length) {
  animate(bubbles, { opacity: [0, 1], y: [12, 0] }, { delay: stagger(0.5), duration: 0.4, ease: 'easeOut' });
}
</script>
```
Also remove `.chat-demo .cmsg` from whatever currently makes it visible by default (check computed opacity isn't already 1 from the parent `.rev.in` class — if the bubbles inherit visibility from the parent `.hcard.rev`, add `opacity:0` as an inline style on each `.cmsg` in the HTML so they start hidden before the script runs, matching the preview page's behavior).

- [ ] **Step 2 (if spring hovers approved): Add spring hover handlers**

Extend the same `<script type="module">` block:
```javascript
import { hover } from "https://cdn.jsdelivr.net/npm/motion@13.0.0/+esm";
const springOpts = { type: 'spring', stiffness: 400, damping: 25 };
document.querySelectorAll('.btn, .tier').forEach((el) => {
  hover(el, () => {
    animate(el, { scale: 1.03 }, springOpts);
    return () => animate(el, { scale: 1 }, springOpts);
  });
});
```
This applies site-wide (buttons/tiers exist on multiple pages), so this script block needs to be added to every page's `</body>`, not just `index.html`.

- [ ] **Step 3 (if logo strike approved): Add the one-time strike animation**

Add to every page (header logo exists on all of them):
```javascript
import { animate } from "https://cdn.jsdelivr.net/npm/motion@13.0.0/+esm";
const bolt = document.querySelector('.brand-mk svg path');
if (bolt && !sessionStorage.getItem('ff-logo-struck')) {
  animate(bolt, { opacity: [0, 1] }, { duration: 0.5, ease: 'circOut' });
  sessionStorage.setItem('ff-logo-struck', '1');
}
```

- [ ] **Step 4 (if page transitions approved): Add View Transitions**

Add once, in a shared inline script on every page (near the top of the existing script block is fine):
```javascript
if (document.startViewTransition) {
  document.querySelectorAll('a[href$=".html"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const url = link.getAttribute('href');
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      e.preventDefault();
      document.startViewTransition(() => { window.location.href = url; });
    });
  });
}
```
Add the matching CSS once to `index.html`'s `<style>` block (and every other page's, since each page has its own inline `<style>`):
```css
::view-transition-old(root), ::view-transition-new(root) { animation-duration: .22s; }
```

- [ ] **Step 5: Consolidate into the propagation script**

Since items 2–4 (if approved) touch all 10 pages identically, write them once and reuse the same `apply-forge-spark-logo.js`-style pattern: a scratch script that reads each page, inserts the new `<script type="module">` block before `</body>` (and the CSS rule into `<style>` if item 4 approved), backs up first (`.pre-2026-08-09-motion-rebuild.bak`), writes, and reports counts — following exactly the Task 1 Step 2–4 pattern (fingerprint check → script → run → verify no old artifacts / correct new artifacts → browser check).

- [ ] **Step 6: Browser verification**

Open `localhost:4173` in Chrome. For each approved item: confirm it behaves as demoed in Task 2. Then enable "Emulate CSS prefers-reduced-motion: reduce" in Chrome DevTools (Rendering tab) and reload — confirm all 4 (whichever were added) are fully suppressed, matching the existing site-wide reduced-motion contract. Check console for errors. Check both dark and light theme.

- [ ] **Step 7: Commit**

```bash
cd "Documents/flowforge-site"
git add -A
git commit -m "feat: add motion pass (chat sequencing, spring hovers, logo strike, page transitions)"
```
(Commit message reflects only the items actually implemented — edit to match what was approved.)

---

## Task 4: Reusable per-client design-process prompt template

**Files:**
- Create: `docs/flowforge-design-process-prompt.md`

**Interfaces:**
- Produces: a plain-text block Aarav can copy-paste as a message in any future Claude Code session to repeat this design *process* for a different client, without reusing FlowForge's own visual identity

- [ ] **Step 1: Write the template**

```markdown
# FlowForge client-site design prompt (paste this as your message)

I want you to design and build a website for [BUSINESS NAME], a [TYPE OF
BUSINESS] in [LOCATION]. Follow this process — do not skip steps or jump
straight to a visual direction:

1. First, ask me about this specific business: what it actually does, who
   its customers are, what makes it different from competitors, and what
   tone fits it (do not assume — a diagnostic lab and a dance academy need
   different visual languages).
2. Once you understand the business, derive a NEW visual identity for it —
   a specific "world" this business's site should feel like (a concrete
   metaphor, not a generic style label), its own color story, its own
   typography pairing, and a one-sentence thesis for why a nervous
   first-time visitor should trust it.
3. Hard constraint: do NOT reuse FlowForge's own amber/green "recharge-shop
   counter" identity (the LED digits, receipt-paper cards, forge/flow
   imagery) for this client. That belongs to FlowForge's own brand. This
   business needs its own identity, derived from steps 1-2, even if the
   end result happens to share a color by coincidence.
4. Use the `design` skill for the logo and any visual assets, `impeccable`
   for the UI critique/redesign process itself, and `ui-ux-pro-max` for
   palette and type-pairing reference data — but the actual direction
   must come from steps 1-2, not from picking something off a shelf.
5. Every visitor-facing claim must be literally true for this specific
   business — no invented numbers, testimonials, or capabilities. If I
   haven't given you a fact, ask, don't fabricate one.
6. Keep WCAG AA as the accessibility floor.
7. Ask me for approval at each major step (identity direction, logo,
   layout) before moving to the next — do not build the whole site and
   then ask.
```

- [ ] **Step 2: Commit**

```bash
cd "Documents/flowforge-site"
git add docs/flowforge-design-process-prompt.md
git commit -m "docs: add reusable client-site design-process prompt template"
```

---

## Task 5: Full-site verification pass

**Files:** none (verification only)

- [ ] **Step 1: Cross-page check**

Open each of the 10 live pages at `localhost:4173` in Chrome (skip `quote.html` — not a site page). For each: confirm the Forge Spark logo renders correctly (favicon, header, footer), confirm no console errors, confirm any approved motion items behave correctly, confirm dark/light theme toggle still works and the badge stays legible in both.

- [ ] **Step 2: Reduced-motion check**

With Chrome DevTools "Emulate CSS prefers-reduced-motion: reduce" active, re-check `index.html` — confirm all motion (existing `.rev` reveals AND any new items from Task 3) is fully suppressed, nothing flashes or animates.

- [ ] **Step 3: Report back**

Summarize to Aarav: what shipped (logo everywhere + which of the 4 motion items), what got dropped (any items not approved in Task 2), and confirm the reusable prompt template file's location for future use.
