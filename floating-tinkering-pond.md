# Plan: Fix UI MCP Server — Missing Images, No UIverse Components, Poor UI Quality

## Context

The UI MCP Server generates web pages via a 13-step pipeline. Despite having sophisticated architecture (UIverse integration, 60+ built-in components, 3-layer image system), the actual output is poor quality with:
- **No UIverse components** — GitHub API rate-limits silently, all components fall back to bare HTML
- **Missing images/SVGs** — No API keys configured, image fetch fails silently, icons render as plain text
- **Generic UI** — Built-in component CSS is never injected into pages, buttons/cards appear unstyled

## Root Causes (5 issues)

### RC1: UIverse GitHub fetch silently fails
- **File:** `src/tools/run-pipeline.ts:239` — `catch {}` swallows all errors
- **File:** `src/tools/explore-components.ts` — No GitHub token = 60 req/hr limit
- **Result:** `adaptedUIverse` stays `null`, every `instantiateButton()`/`instantiateCard()` falls back to bare HTML

### RC2: Built-in component CSS is dead code
- **File:** `src/tools/run-pipeline.ts:259` — `selected` from `select_components` is assigned but NEVER passed to `generateFullPage()`
- The 60+ built-in components with rich animations exist but their CSS never reaches the page output
- `generate-section.ts` only checks `ctx.uiverse` (UIverse map), ignoring built-in library entirely

### RC3: Fallback HTML is too minimal
- **File:** `src/engine/uiverse-adapter.ts:482` — Fallback button: `<a class="btn btn-primary">Text</a>` (no inner structure for shimmer/shine effects)
- **File:** `src/engine/uiverse-adapter.ts:554` — Fallback card: basic `<div class="card">` with no animation-ready structure
- No base CSS for `.btn-primary` (background, padding, border-radius) exists in section output

### RC4: Image system degrades silently
- **File:** `src/tools/run-pipeline.ts:320` — `catch {}` swallows image fetch errors
- No `UNSPLASH_ACCESS_KEY` or `PEXELS_API_KEY` = Picsum random photos or nothing
- Lucide CDN icons used as `<img src>` = can't inherit CSS colors, render as black SVGs

### RC5: Empty bundled component directories
- All 12 dirs under `src/components/` contain only `.gitkeep` — never populated with curated templates

---

## Implementation Plan

### Step 1: Bundle High-Quality Components Locally (Highest Impact)

**Create:** `src/engine/bundled-components.ts`

Bundle 1 curated, richly-animated component per category (buttons, cards, inputs, checkboxes, toggles, loaders, badges, navigation) directly in code. Each component:
- Uses CSS custom properties exclusively
- Includes rich hover/focus/active animations (transforms, shadows, glows, shimmer)
- Uses standard class names (`.btn`, `.card`, `.input-field`)
- Has inner HTML structure supporting icon/title/description slots

**Modify:** `src/engine/uiverse-adapter.ts`
- Add `loadBundledComponents()` function that returns a `UIverseComponentMap` from bundled templates

**Modify:** `src/tools/run-pipeline.ts` (lines 204-255)
- After UIverse fetch fails, fall back to bundled components instead of `null`
- Ensure `adaptedUIverse` is never `null` at step 9

### Step 2: Add Base Component CSS to Section Generators

**Modify:** `src/tools/generate-section.ts`

Add a `getBaseComponentCss()` function that provides complete styling for:
- `.btn`, `.btn-primary`, `.btn-secondary` (background, padding, radius, hover effects, shimmer)
- `.card` base styles (padding, radius, shadow, hover lift)
- `.input-field` base styles (border, focus ring, transitions)
- `.badge` base styles

Append this CSS to every section's output when `ctx.uiverse` is null — ensures buttons/cards always look styled even without UIverse.

### Step 3: Upgrade Fallback HTML Structure

**Modify:** `src/engine/uiverse-adapter.ts`

Upgrade `instantiateButton()` fallback (line 482):
```html
<a href="#" class="btn btn-primary" role="button">
  <span class="btn-text">Get Started</span>
  <span class="btn-shine" aria-hidden="true"></span>
</a>
```

Upgrade `instantiateCard()` fallback (line 554):
- Add proper inner wrappers for icon/title/description
- Include animation-ready class structure

### Step 4: Inject Built-in Component CSS into Page Output

**Modify:** `src/tools/run-pipeline.ts` (lines 259, 337-349)
- Extract CSS from `selected.components` array
- Pass it to `generateFullPage()` as `builtInComponentCss`

**Modify:** `src/tools/generate-full-page.ts`
- Accept `builtInComponentCss` input
- Prepend it to each page's CSS output when UIverse is unavailable

### Step 5: Fix Icon Rendering with Inline SVGs

**Modify:** `src/tools/fetch-images.ts`
- Bundle the top 40 most-used Lucide icons as inline SVG strings
- Add `resolveIconInline()` that returns SVG markup with `currentColor`

**Modify:** `src/tools/generate-section.ts`
- Use inline SVGs instead of `<img src="cdn-url">` in features/services/how-it-works sections
- Icons inherit `color: var(--color-primary)` from parent instead of rendering as black

### Step 6: Add Diagnostic Logging & GitHub Token Support

**Modify:** `src/tools/run-pipeline.ts`
- Replace silent `catch {}` with structured logging (specific error messages, missing env vars)
- Add pre-flight checks for `GITHUB_TOKEN`, `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`

**Modify:** `src/tools/explore-components.ts`
- Add `Authorization: Bearer ${GITHUB_TOKEN}` header when available (5,000 req/hr vs 60)
- Log rate limit headers for debugging

---

## Files to Modify

| File | Changes |
|---|---|
| `src/engine/bundled-components.ts` | **NEW** — Curated animated components |
| `src/engine/uiverse-adapter.ts` | `loadBundledComponents()`, upgrade fallback HTML |
| `src/tools/run-pipeline.ts` | Inject built-in CSS, bundled fallback, diagnostic logging |
| `src/tools/generate-section.ts` | Base component CSS, inline SVG icons |
| `src/tools/generate-full-page.ts` | Accept & inject `builtInComponentCss` |
| `src/tools/fetch-images.ts` | Inline SVG bundle, `resolveIconInline()` |
| `src/tools/explore-components.ts` | GitHub token auth, error propagation |

## Verification

1. **Build:** `npm run build` — ensure TypeScript compiles cleanly
2. **Test without API keys:** Run pipeline with no `GITHUB_TOKEN`, `UNSPLASH_ACCESS_KEY`, or `PEXELS_API_KEY` — output should still produce richly-styled pages with animated components and properly colored icons
3. **Test with GitHub token:** Set `GITHUB_TOKEN` and verify UIverse components are fetched and adapted
4. **Visual check:** Open generated HTML in browser — buttons should have hover effects, cards should lift on hover, icons should be colored, sections should animate on scroll
5. **Pipeline log:** Check that every step reports meaningful status (no silent failures)
