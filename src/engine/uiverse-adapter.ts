/**
 * UIverse Component Adapter
 *
 * Takes raw UIverse components (HTML + CSS) fetched from GitHub and adapts them
 * for use in generated pages:
 *   1. Remaps all hardcoded colors to CSS custom properties
 *   2. Normalizes class names to match the project's naming convention
 *   3. Extracts reusable base CSS per component category
 *   4. Preserves animations, transitions, and keyframes
 *
 * Built by FODUU (https://foduu.com) — India's Web Design Company
 */
import { LOCAL_COMPONENTS } from './local-library.js';
import type { ComponentStyle } from './types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UIverseComponent {
  name: string;
  category: string;
  html: string;
  css: string;
  hasAnimations: boolean;
  animationCount: number;
  animationNames: string[];
  hasTransitions: boolean;
  source: string;
  sourceUrl: string;
  animationScore: number;
}

export interface AdaptedUIverseComponent {
  /** Original UIverse component name */
  originalName: string;
  /** Category: buttons, cards, inputs, etc. */
  category: string;
  /** Adapted HTML with normalized class names */
  html: string;
  /** Adapted CSS with CSS variable references */
  css: string;
  /** Extracted @keyframes rules */
  keyframes: string;
  /** The project class name this maps to (e.g., .btn, .card, .input-field) */
  projectClassName: string;
  /** Animation score from UIverse */
  animationScore: number;
  /** Source URL */
  sourceUrl: string;
}

export interface UIverseComponentMap {
  /** Best UIverse component per category, adapted for project use */
  buttons?: AdaptedUIverseComponent;
  cards?: AdaptedUIverseComponent;
  inputs?: AdaptedUIverseComponent;
  checkboxes?: AdaptedUIverseComponent;
  toggles?: AdaptedUIverseComponent;
  loaders?: AdaptedUIverseComponent;
  radios?: AdaptedUIverseComponent;
  tooltips?: AdaptedUIverseComponent;
  badges?: AdaptedUIverseComponent;
  navigation?: AdaptedUIverseComponent;
  /** Combined CSS for all adapted components (ready to inject) */
  combinedCss: string;
  /** Combined keyframes for all adapted components */
  combinedKeyframes: string;
  /** Summary of what was adapted */
  summary: string;
}

// ─── Color Remapping ────────────────────────────────────────────────────────

/**
 * Common color patterns found in UIverse components that need remapping.
 * Maps regex patterns to CSS custom property replacements.
 */
const COLOR_REMAP_RULES: Array<{ pattern: RegExp; replacement: string; description: string }> = [
  // Primary-ish colors (blues, purples, indigos)
  { pattern: /(?:#(?:667eea|764ba2|6366f1|4f46e5|4338ca|3b82f6|2563eb|1d4ed8|818cf8|7c3aed|8b5cf6|6d28d9|5b21b6))\b/gi, replacement: 'var(--color-primary)', description: 'primary color' },
  // Green / success colors
  { pattern: /(?:#(?:22c55e|16a34a|15803d|10b981|059669|047857|34d399|4ade80))\b/gi, replacement: 'var(--color-success)', description: 'success color' },
  // Red / error colors
  { pattern: /(?:#(?:ef4444|dc2626|b91c1c|f87171|fb7185|e11d48|be123c))\b/gi, replacement: 'var(--color-error)', description: 'error color' },
  // Orange / warning colors
  { pattern: /(?:#(?:f59e0b|d97706|b45309|fbbf24|f97316|ea580c))\b/gi, replacement: 'var(--color-warning)', description: 'warning color' },
  // Pure white backgrounds → neutral-50
  { pattern: /#fff(?:fff)?\b(?!\s*[0-9])/gi, replacement: 'var(--color-neutral-50)', description: 'white → neutral-50' },
  // Very light grays → neutral-100
  { pattern: /(?:#(?:f8f9fa|f9fafb|f3f4f6|f1f5f9|fafafa|f5f5f5))\b/gi, replacement: 'var(--color-neutral-100)', description: 'light gray → neutral-100' },
  // Light grays → neutral-300
  { pattern: /(?:#(?:d1d5db|d4d4d8|e2e8f0|e5e7eb|d6d3d1|cbd5e1))\b/gi, replacement: 'var(--color-neutral-300)', description: 'gray → neutral-300' },
  // Medium grays → neutral-500
  { pattern: /(?:#(?:6b7280|71717a|737373|78716c|64748b|9ca3af))\b/gi, replacement: 'var(--color-neutral-500)', description: 'medium gray → neutral-500' },
  // Dark grays → neutral-700
  { pattern: /(?:#(?:374151|3f3f46|404040|44403c|334155|4b5563))\b/gi, replacement: 'var(--color-neutral-700)', description: 'dark gray → neutral-700' },
  // Very dark / near-black → neutral-900
  { pattern: /(?:#(?:111827|18181b|171717|1c1917|0f172a|1e293b|1a1a2e|0a0a0a|000000))\b/gi, replacement: 'var(--color-neutral-900)', description: 'near-black → neutral-900' },
];

/**
 * Remap RGB/RGBA color values that use common component colors.
 */
const RGBA_REMAP_RULES: Array<{ pattern: RegExp; replacement: string }> = [
  // rgba with blue-ish primary colors
  { pattern: /rgba\(\s*(?:99|102|103),\s*(?:102|126|106),\s*(?:234|241|245),/gi, replacement: 'rgba(var(--color-primary-rgb),' },
  { pattern: /rgba\(\s*(?:59|37|67),\s*(?:130|99|56),\s*(?:246|243|236),/gi, replacement: 'rgba(var(--color-primary-rgb),' },
  // White with opacity
  { pattern: /rgba\(\s*255,\s*255,\s*255,/gi, replacement: 'rgba(var(--color-neutral-50-rgb, 255, 255, 255),' },
  // Black with opacity
  { pattern: /rgba\(\s*0,\s*0,\s*0,/gi, replacement: 'rgba(var(--color-neutral-900-rgb, 0, 0, 0),' },
];

function remapColors(css: string): string {
  let result = css;

  // Apply hex color remapping
  for (const rule of COLOR_REMAP_RULES) {
    result = result.replace(rule.pattern, rule.replacement);
  }

  // Apply RGBA remapping
  for (const rule of RGBA_REMAP_RULES) {
    result = result.replace(rule.pattern, rule.replacement);
  }

  // Catch remaining hardcoded hex values that look like accent/primary usage
  // and remap generic bright colors to accent
  result = result.replace(
    /(?:background(?:-color)?|border(?:-color)?|color|fill|stroke)\s*:\s*#([0-9a-f]{3,8})\b/gi,
    (match, hex) => {
      // Skip if already a var() reference
      if (match.includes('var(')) return match;
      // Skip transparent/inherit keywords that matched
      if (['000', 'fff', '0000', 'ffff'].includes(hex.toLowerCase())) return match;
      // For unmatched colors, keep them (they may be intentional decorative colors)
      return match;
    }
  );

  return result;
}

// ─── Class Name Normalization ───────────────────────────────────────────────

/** Maps UIverse category to project class convention.
 *  Uses 'uiverse-' prefix to prevent UIverse CSS (pseudo-elements, animations)
 *  from leaking into the project's own .card / .btn base classes. */
const CATEGORY_CLASS_MAP: Record<string, string> = {
  'buttons': 'uiverse-btn',
  'cards': 'uiverse-card',
  'inputs': 'uiverse-input',
  'checkboxes': 'uiverse-checkbox',
  'toggle-switches': 'uiverse-toggle',
  'radio-buttons': 'uiverse-radio',
  'loaders': 'uiverse-loader',
  'tooltips': 'uiverse-tooltip',
  'badges': 'uiverse-badge',
  'navigation': 'uiverse-nav',
  'forms': 'uiverse-form',
  'dropdowns': 'uiverse-dropdown',
  'modals': 'uiverse-modal',
};

/**
 * Extract the primary class name from UIverse component HTML.
 * UIverse components typically wrap everything in a single root element.
 */
function extractPrimaryClass(html: string): string | null {
  const match = html.match(/class=["']([^"']+)["']/);
  if (!match) return null;
  return match[1].split(/\s+/)[0]; // First class name
}

/**
 * Rename the primary UIverse class to the project's convention.
 * E.g., UIverse "button-87" → project "btn"
 */
function normalizeClassNames(
  html: string,
  css: string,
  originalClass: string,
  projectClass: string
): { html: string; css: string } {
  if (!originalClass || originalClass === projectClass) return { html, css };

  // Escape for regex
  const escaped = originalClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Replace in CSS selectors
  const newCss = css.replace(new RegExp(`\\.${escaped}\\b`, 'g'), `.${projectClass}`);
  // Replace in HTML class attributes
  const newHtml = html.replace(new RegExp(`\\b${escaped}\\b`, 'g'), projectClass);

  return { html: newHtml, css: newCss };
}

// ─── Branded Content Sanitization ───────────────────────────────────────────

/**
 * Strips hardcoded brand names, logos, and product-specific text from UIverse
 * component HTML. UIverse components are community-built and often contain
 * text like "Microsoft", "Get it from", "Windows XP", etc. that must be
 * removed before injecting into a user's project.
 */
function sanitizeBrandedContent(html: string): string {
  // Remove entire branded text spans/divs (e.g. "Get it from" + "Microsoft")
  // Pattern: <span>Get it from</span> or <span>Microsoft</span>
  const BRANDED_TEXTS = [
    'Microsoft', 'Google', 'Apple', 'Amazon', 'Facebook', 'Twitter',
    'Instagram', 'GitHub', 'Windows', 'Windows XP', 'macOS', 'Linux',
    'Get it from', 'Download from', 'Available on', 'Sign in with',
    'Login with', 'Continue with', 'Powered by',
  ];

  let result = html;

  for (const brand of BRANDED_TEXTS) {
    // Replace text content inside tags: <span>Microsoft</span> → <span></span>
    const textPattern = new RegExp(
      `(>\\s*)${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*<)`,
      'gi'
    );
    result = result.replace(textPattern, '$1$2');
  }

  // Remove logo wrapper divs (e.g. ms-logo with child squares)
  result = result.replace(
    /<div\s+class=["']ms-logo["'][^>]*>[\s\S]*?<\/div>\s*(?=<div|<\/)/gi,
    ''
  );

  // Clean up empty button-text wrappers left behind
  result = result.replace(
    /<div\s+class=["']button-text["'][^>]*>\s*<span>\s*<\/span>\s*<span>\s*<\/span>\s*<\/div>/gi,
    ''
  );

  // Remove Windows-specific branding in loaders
  result = result.replace(/<p\s+class=["']top["'][^>]*>\s*Microsoft\s*<\/p>/gi, '');
  result = result.replace(/<p\s+class=["']mid["'][^>]*>\s*Windows\s*<span>XP<\/span>\s*<\/p>/gi, '');
  result = result.replace(/<p\s+class=["']bottom["'][^>]*>\s*Professional\s*<\/p>/gi, '');

  return result;
}

// ─── Keyframe Extraction ────────────────────────────────────────────────────

function extractKeyframes(css: string): { keyframes: string; cssWithoutKeyframes: string } {
  const keyframeRegex = /@keyframes\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g;
  const keyframes: string[] = [];
  const cssWithoutKeyframes = css.replace(keyframeRegex, (match) => {
    keyframes.push(match);
    return '';
  });

  return {
    keyframes: keyframes.join('\n\n'),
    cssWithoutKeyframes: cssWithoutKeyframes.trim(),
  };
}

// ─── Component Adaptation ───────────────────────────────────────────────────

function adaptSingleComponent(
  component: UIverseComponent,
  projectClassName: string
): AdaptedUIverseComponent {
  // Step 1: Remap colors
  let css = remapColors(component.css);
  let html = component.html;

  // Step 2: Extract keyframes
  const { keyframes, cssWithoutKeyframes } = extractKeyframes(css);
  css = cssWithoutKeyframes;

  // Step 3: Normalize class names
  const originalClass = extractPrimaryClass(html);
  if (originalClass) {
    const normalized = normalizeClassNames(html, css, originalClass, projectClassName);
    html = normalized.html;
    css = normalized.css;
  }

  // Step 4: Sanitize branded/hardcoded text from HTML
  html = sanitizeBrandedContent(html);

  // Step 5: Add project-level base properties if missing
  if (projectClassName === 'btn' && !css.includes('cursor:') && !css.includes('cursor :')) {
    css = css.replace(`.${projectClassName} {`, `.${projectClassName} {\n  cursor: pointer;`);
  }

  // Step 6: Add CSS comment header
  css = `/* UIverse Component: ${component.name} (${component.category}) */\n/* Source: ${component.sourceUrl} */\n/* Animation Score: ${component.animationScore}/100 */\n${css}`;

  return {
    originalName: component.name,
    category: component.category,
    html,
    css,
    keyframes,
    projectClassName,
    animationScore: component.animationScore,
    sourceUrl: component.sourceUrl,
  };
}

// ─── Primary/Secondary Button Variant ───────────────────────────────────────

/**
 * Generate btn-primary and btn-secondary variants from the base UIverse button.
 * UIverse gives us ONE button style — we derive the primary (filled) and
 * secondary (outlined/ghost) variants from it.
 */
function generateButtonVariants(adapted: AdaptedUIverseComponent): string {
  let variantCss = `\n/* --- Button Variants (derived from UIverse ${adapted.originalName}) --- */\n`;

  // btn-primary: inherit the UIverse style as-is but enforce primary color
  variantCss += `.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-neutral-50);
  border: 2px solid var(--color-primary);
}
.btn-primary:hover {
  background-color: var(--color-primary-dark, var(--color-primary));
  border-color: var(--color-primary-dark, var(--color-primary));
}

`;

  // btn-secondary: outlined/ghost variant
  variantCss += `.btn-secondary {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}
.btn-secondary:hover {
  background-color: var(--color-primary);
  color: var(--color-neutral-50);
}
`;

  return variantCss;
}

/**
 * Generate card hover enhancement that preserves UIverse animations
 * but adds project-level hover behavior.
 */
function generateCardEnhancements(adapted: AdaptedUIverseComponent): string {
  // Only add if the UIverse card doesn't already have hover transforms
  if (adapted.css.includes(':hover') && adapted.css.includes('transform')) {
    return ''; // UIverse already provides hover — don't override
  }

  return `\n/* Card hover enhancement */
.card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
}
`;
}

// ─── Main Adapter Function ──────────────────────────────────────────────────

/**
 * Takes an array of UIverse components and produces a complete
 * adapted component map ready for injection into generated pages.
 *
 * For each category, picks the component with the highest animation score.
 */
export function adaptUIverseComponents(
  components: UIverseComponent[]
): UIverseComponentMap {
  if (!components || components.length === 0) {
    return {
      combinedCss: '',
      combinedKeyframes: '',
      summary: 'No UIverse components to adapt.',
    };
  }

  // Group by category and pick the best (highest animation score) per category
  const byCategory: Record<string, UIverseComponent[]> = {};
  for (const comp of components) {
    const cat = comp.category.toLowerCase();
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(comp);
  }

  // Sort each category by animation score, pick the best
  const result: UIverseComponentMap = {
    combinedCss: '',
    combinedKeyframes: '',
    summary: '',
  };

  const allCss: string[] = [];
  const allKeyframes: string[] = [];
  const adaptedCategories: string[] = [];

  for (const [category, comps] of Object.entries(byCategory)) {
    // Sort by animation score descending
    comps.sort((a, b) => b.animationScore - a.animationScore);
    const best = comps[0];

    const projectClass = CATEGORY_CLASS_MAP[category] || category.replace(/s$/, '');

    const adapted = adaptSingleComponent(best, projectClass);

    // Store in the map
    const mapKey = category.replace(/-/g, '') as keyof UIverseComponentMap;
    if (mapKey === 'buttons' || mapKey === 'cards' || mapKey === 'inputs' ||
        mapKey === 'checkboxes' || mapKey === 'loaders' || mapKey === 'tooltips' ||
        mapKey === 'badges' || mapKey === 'navigation') {
      (result as any)[mapKey] = adapted;
    }
    // Also handle normalized keys
    if (category === 'toggle-switches') (result as any).toggles = adapted;
    if (category === 'radio-buttons') (result as any).radios = adapted;

    allCss.push(adapted.css);

    // Add button variants
    if (category === 'buttons') {
      allCss.push(generateButtonVariants(adapted));
    }

    // Add card enhancements
    if (category === 'cards') {
      allCss.push(generateCardEnhancements(adapted));
    }

    if (adapted.keyframes) {
      allKeyframes.push(adapted.keyframes);
    }

    adaptedCategories.push(`${category} (${best.name}, score: ${best.animationScore})`);
  }

  result.combinedCss = `/* ═══════════════════════════════════════════════════════════════════════ */\n/* UIverse Components — Adapted from uiverse.io open-source library      */\n/* Colors remapped to project CSS custom properties                      */\n/* ═══════════════════════════════════════════════════════════════════════ */\n\n${allCss.join('\n\n')}`;

  result.combinedKeyframes = allKeyframes.length > 0
    ? `/* UIverse Component Keyframes */\n${allKeyframes.join('\n\n')}`
    : '';

  result.summary = `Adapted ${adaptedCategories.length} UIverse component categories:\n${adaptedCategories.map((c) => `  - ${c}`).join('\n')}`;

  return result;
}

/**
 * Checks whether a specific component category has a UIverse adaptation.
 */
export function hasUIverseComponent(
  map: UIverseComponentMap | null | undefined,
  category: string
): boolean {
  if (!map) return false;
  const key = category.replace(/-/g, '') as keyof UIverseComponentMap;
  return !!(map as any)[key];
}

/**
 * Gets the adapted CSS for a specific category from the UIverse map.
 * Returns empty string if not available.
 */
export function getUIverseCss(
  map: UIverseComponentMap | null | undefined,
  category: string
): string {
  if (!map) return '';
  const key = category.replace(/-/g, '') as keyof UIverseComponentMap;
  const adapted = (map as any)[key] as AdaptedUIverseComponent | undefined;
  return adapted?.css || '';
}

/**
 * Gets the adapted HTML template for a specific category.
 * Returns null if not available.
 */
export function getUIverseHtml(
  map: UIverseComponentMap | null | undefined,
  category: string
): string | null {
  if (!map) return null;
  const key = category.replace(/-/g, '') as keyof UIverseComponentMap;
  const adapted = (map as any)[key] as AdaptedUIverseComponent | undefined;
  return adapted?.html || null;
}

// ─── Template Instantiation System ──────────────────────────────────────────
// Takes UIverse component HTML and injects real content into it.

/**
 * Instantiate a UIverse button with custom text and variant.
 * Falls back to a standard button if no UIverse button is available.
 */
export function instantiateButton(
  map: UIverseComponentMap | null | undefined,
  text: string,
  options?: {
    variant?: 'primary' | 'secondary';
    href?: string;
    extraClasses?: string;
  }
): string {
  const variant = options?.variant || 'primary';
  const href = options?.href || '#';
  const extraClasses = options?.extraClasses || '';
  const variantClass = `btn-${variant}`;

  const uiverseHtml = getUIverseHtml(map, 'buttons');
  if (uiverseHtml) {
    // UIverse button exists — adapt it
    let html = uiverseHtml;

    // Replace the innermost text content with our text
    // UIverse buttons can be <button class="btn">Text</button>
    // or <button class="btn"><span>Text</span></button>
    // or more complex structures
    html = replaceInnerText(html, text);

    // Add variant class to the root element
    html = addClassToRoot(html, variantClass);
    if (extraClasses) html = addClassToRoot(html, extraClasses);

    // Convert <button> to <a> if href is provided (for CTA buttons)
    if (href && href !== '#') {
      html = html.replace(/^<button\b/, `<a href="${href}"`).replace(/<\/button>$/, '</a>');
    } else if (!html.includes('href')) {
      html = html.replace(/^<button\b/, `<a href="${href}"`).replace(/<\/button>$/, '</a>');
    }

    return html;
  }

  // Fallback: Use high-quality local component if available
  const local = LOCAL_COMPONENTS.find(c => c.category === 'button-primary' && c.style === 'animated')
    || LOCAL_COMPONENTS.find(c => c.category === 'button-primary');

  if (local) {
    let html = local.html;
    html = replaceInnerText(html, text);
    html = addClassToRoot(html, variantClass);
    if (extraClasses) html = addClassToRoot(html, extraClasses);
    if (href && href !== '#') {
      html = html.replace(/^<button\b/, `<a href="${href}"`).replace(/<\/button>$/, '</a>');
    }
    return html;
  }

  // Last resort: primitive fallback
  return `<a href="${href}" class="btn ${variantClass} ${extraClasses}">${text}</a>`;
}

/**
 * Instantiate a UIverse card with custom content.
 * Falls back to a standard card if no UIverse card is available.
 */
export function instantiateCard(
  map: UIverseComponentMap | null | undefined,
  content: {
    title: string;
    description: string;
    icon?: string;
    image?: string;
    badge?: string;
    price?: string;
    link?: string;
    index?: number;
  },
  options?: {
    extraClasses?: string;
    animateDelay?: number;
  }
): string {
  const extraClasses = options?.extraClasses || '';
  const delay = options?.animateDelay ?? 0;
  const delayAttr = delay > 0 ? ` style="transition-delay: ${delay}ms"` : '';

  const uiverseHtml = getUIverseHtml(map, 'cards');
  if (uiverseHtml) {
    // UIverse card exists — build a hybrid: UIverse wrapper + our content
    // We extract the outer wrapper (class, tag, animations) and inject our content
    const outerMatch = uiverseHtml.match(/^<(\w+)([^>]*)>([\s\S]*)<\/\1>$/);
    if (outerMatch) {
      const tag = outerMatch[1];
      let attrs = outerMatch[2];

      // Use project's card class only — UIverse wrapper styles (::before/::after blobs,
      // padding overrides) break product/category grid cards. Strip UIverse class.
      if (attrs.includes('class="')) {
        // Remove any uiverse- prefixed class and replace with project classes
        attrs = attrs.replace(/class="[^"]*"/, `class="card ${extraClasses} animate-on-scroll"`);
      } else {
        attrs += ` class="card ${extraClasses} animate-on-scroll"`;
      }

      // Build inner content from our data
      const iconHtml = content.icon
        ? content.icon.startsWith('<svg')
          ? `<div class="card-icon">${content.icon}</div>`
          : content.icon.startsWith('http')
            ? `<div class="card-icon"><img src="${content.icon}" alt="${content.title} icon" width="28" height="28" loading="lazy"></div>`
            : `<div class="card-icon"><span>${content.icon}</span></div>`
        : '';
      const imageHtml = content.image
        ? `<div class="card-image"><img src="${content.image}" alt="${content.title}" width="400" height="300" loading="lazy"></div>`
        : '';
      const badgeHtml = content.badge
        ? `<span class="badge">${content.badge}</span>`
        : '';
      const priceHtml = content.price
        ? `<div class="card-price">${content.price}</div>`
        : '';

      return `<${tag}${attrs}${delayAttr}>
  ${badgeHtml}
  ${imageHtml}
  ${iconHtml}
  <h3 class="card-title">${content.title}</h3>
  <p class="card-description">${content.description}</p>
  ${priceHtml}
  ${content.link ? `<a href="${content.link}" class="card-link">Learn more</a>` : ''}
</${tag}>`;
    }
  }

  // Fallback: Use high-quality local component — try to extract its wrapper
  const local = LOCAL_COMPONENTS.find(c => c.category === 'card' && c.style === 'animated')
    || LOCAL_COMPONENTS.find(c => c.category === 'card');

  if (local) {
    const localMatch = local.html.match(/^<(\w+)([^>]*)>([\s\S]*)<\/\1>$/);
    if (localMatch) {
      const tag = localMatch[1];
      let attrs = localMatch[2];
      // Use project card class only — strip local component's original class
      if (attrs.includes('class="')) {
        attrs = attrs.replace(/class="[^"]*"/, `class="card ${extraClasses} animate-on-scroll"`);
      } else {
        attrs += ` class="card ${extraClasses} animate-on-scroll"`;
      }
      const badgeHtml = content.badge ? `<span class="badge">${content.badge}</span>` : '';
      const imageHtml = content.image
        ? `<div class="card-image"><img src="${content.image}" alt="${content.title}" width="400" height="300" loading="lazy"></div>`
        : '';
      const iconHtml = content.icon
        ? content.icon.startsWith('<svg')
          ? `<div class="card-icon">${content.icon}</div>`
          : content.icon.startsWith('http')
            ? `<div class="card-icon"><img src="${content.icon}" alt="${content.title} icon" width="28" height="28" loading="lazy"></div>`
            : `<div class="card-icon"><span>${content.icon}</span></div>`
        : '';
      const priceHtml = content.price ? `<div class="card-price">${content.price}</div>` : '';
      return `<${tag}${attrs}${delayAttr}>
  ${badgeHtml}
  ${imageHtml}
  ${iconHtml}
  <h3 class="card-title">${content.title}</h3>
  <p class="card-description">${content.description}</p>
  ${priceHtml}
  ${content.link ? `<a href="${content.link}" class="card-link">Learn more</a>` : ''}
</${tag}>`;
    }
    // Local component HTML too complex to parse — fall through to primitive
  }

  // Last resort: primitive fallback
  const iconHtml = content.icon
    ? content.icon.startsWith('http')
      ? `<div class="card-icon"><img src="${content.icon}" alt="${content.title} icon" width="28" height="28" loading="lazy"></div>`
      : `<div class="card-icon"><span>${content.icon}</span></div>`
    : '';

  return `<div class="card ${extraClasses} animate-on-scroll"${delayAttr}>
  ${content.badge ? `<span class="badge">${content.badge}</span>` : ''}
  ${content.image ? `<div class="card-image"><img src="${content.image}" alt="${content.title}" width="400" height="300" loading="lazy"></div>` : ''}
  ${iconHtml}
  <h3 class="card-title">${content.title}</h3>
  <p class="card-description">${content.description}</p>
  ${content.price ? `<div class="card-price">${content.price}</div>` : ''}
  ${content.link ? `<a href="${content.link}" class="card-link">Learn more</a>` : ''}
</div>`;
}

/**
 * Instantiate a UIverse input with custom attributes.
 * Falls back to a standard input if no UIverse input is available.
 */
export function instantiateInput(
  map: UIverseComponentMap | null | undefined,
  attrs: {
    type?: string;
    name: string;
    placeholder?: string;
    label?: string;
    required?: boolean;
    id?: string;
  }
): string {
  const id = attrs.id || attrs.name;
  const type = attrs.type || 'text';
  const required = attrs.required ? ' required aria-required="true"' : '';

  const uiverseHtml = getUIverseHtml(map, 'inputs');
  if (uiverseHtml) {
    // UIverse input components can be complex search widgets with wrappers,
    // glow effects, result panels, etc. We only want the <input> element
    // and apply UIverse CSS class to a clean wrapper — NOT the full component.
    const inputMatch = uiverseHtml.match(/<input[^>]*>/i);
    if (inputMatch) {
      let inputTag = inputMatch[0];

      // Replace/add attributes on the extracted <input>
      if (inputTag.includes('placeholder=')) {
        inputTag = inputTag.replace(/placeholder="[^"]*"/, `placeholder="${attrs.placeholder || ''}"`);
      } else {
        inputTag = inputTag.replace('<input', `<input placeholder="${attrs.placeholder || ''}"`);
      }
      if (inputTag.includes('name=')) {
        inputTag = inputTag.replace(/name="[^"]*"/, `name="${attrs.name}"`);
      } else {
        inputTag = inputTag.replace('<input', `<input name="${attrs.name}"`);
      }
      if (inputTag.includes('type=')) {
        inputTag = inputTag.replace(/type="[^"]*"/, `type="${type}"`);
      } else {
        inputTag = inputTag.replace('<input', `<input type="${type}"`);
      }
      // Set id
      inputTag = inputTag.includes('id=')
        ? inputTag.replace(/id="[^"]*"/, `id="${id}"`)
        : inputTag.replace('<input', `<input id="${id}"`);

      // Ensure it has the form-input class
      if (inputTag.includes('class="')) {
        inputTag = inputTag.replace(/class="([^"]*)"/, `class="$1 form-input"`);
      } else {
        inputTag = inputTag.replace('<input', '<input class="form-input"');
      }

      // Add required if needed
      if (attrs.required && !inputTag.includes('required')) {
        inputTag = inputTag.replace('<input', '<input required aria-required="true"');
      }

      // Add label
      const labelHtml = attrs.label ? `<label for="${id}" class="form-label">${attrs.label}</label>\n` : '';

      return `${labelHtml}${inputTag}`;
    }
    // If no <input> found in UIverse HTML, fall through to standard input
  }

  // Fallback: standard input
  return `${attrs.label ? `<label for="${id}" class="form-label">${attrs.label}</label>` : ''}
<input type="${type}" id="${id}" name="${attrs.name}" class="form-input" placeholder="${attrs.placeholder || ''}"${required}>`;
}

// ─── HTML Manipulation Helpers ──────────────────────────────────────────────

/** Replace the innermost text content of an HTML element */
function replaceInnerText(html: string, newText: string): string {
  // Try to find a <span> inside and replace its text
  if (html.includes('<span')) {
    return html.replace(/>([^<]+)<\/span>/, `>${newText}</span>`);
  }
  // Otherwise replace the deepest text node
  // Match text between > and </ at the innermost level
  return html.replace(/>([^<>]+)<\//, `>${newText}</`);
}

/** Add a CSS class to the root element of an HTML string */
function addClassToRoot(html: string, className: string): string {
  if (html.match(/class="[^"]*"/)) {
    return html.replace(/class="([^"]*)"/, (match, existing) => {
      if (existing.includes(className)) return match;
      return `class="${existing} ${className}"`;
    });
  }
  // No class attribute — add one
  return html.replace(/^<(\w+)/, `<$1 class="${className}"`);
}
/**
 * Loads a UIverseComponentMap using only high-quality local components.
 * Used as a fallback when GitHub API is unavailable.
 */
export function loadLocalUIverseMap(categories: string[]): UIverseComponentMap {
  const result: UIverseComponentMap = {
    combinedCss: '',
    combinedKeyframes: '',
    summary: 'Loaded from local component library.',
  };

  const allCss: string[] = [];
  const adaptedCategories: string[] = [];

  for (const category of categories) {
    // Map internal folder names to engine categories with robust aliasing
    const folder = category.toLowerCase();
    const engineCategory = folder.replace(/s$/, '') as any;
    
    // Find highest animation level local component
    // Try both the exact category and mapped aliases
    const best = LOCAL_COMPONENTS.find(c => {
      const cat = c.category.toLowerCase();
      const match = cat === folder || 
                   cat === engineCategory || 
                   (folder === 'buttons' && cat.startsWith('button')) ||
                   (folder === 'cards' && cat.includes('card')) ||
                   (folder === 'inputs' && cat.includes('input'));
      return match && (c as any).animationLevel === 'high';
    }) || LOCAL_COMPONENTS.find(c => {
      const cat = c.category.toLowerCase();
      return cat === folder || 
             cat === engineCategory || 
             (folder === 'buttons' && cat.startsWith('button')) ||
             (folder === 'cards' && cat.includes('card')) ||
             (folder === 'inputs' && cat.includes('input'));
    });

    if (best) {
      const projectClass = CATEGORY_CLASS_MAP[category] || category.replace(/s$/, '');
      const adapted = adaptSingleComponent(best as any, projectClass);

      const mapKey = category.replace(/-/g, '') as keyof UIverseComponentMap;
      if (mapKey === 'buttons' || mapKey === 'cards' || mapKey === 'inputs' ||
          mapKey === 'checkboxes' || mapKey === 'loaders' || mapKey === 'tooltips' ||
          mapKey === 'badges' || mapKey === 'navigation') {
        (result as any)[mapKey] = adapted;
      }
      if (category === 'toggle-switches') (result as any).toggles = adapted;
      if (category === 'radio-buttons') (result as any).radios = adapted;

      allCss.push(adapted.css);
      if (category === 'buttons') allCss.push(generateButtonVariants(adapted));
      if (category === 'cards') allCss.push(generateCardEnhancements(adapted));
      
      adaptedCategories.push(`${category} (local: ${best.id})`);
    }
  }

  result.combinedCss = `/* Local UIverse Fallback */\n\n${allCss.join('\n\n')}`;
  result.summary = `Loaded ${adaptedCategories.length} local component categories:\n${adaptedCategories.map((c) => `  - ${c}`).join('\n')}`;

  return result;
}
