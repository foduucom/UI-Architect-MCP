/**
 * MCP Tool: design_consistency_check
 *
 * Validates design consistency across multiple pages of a website.
 * Ensures that a multi-page site looks like it was designed by ONE designer —
 * consistent header, footer, typography, colors, component styles, spacing,
 * and overall design language.
 *
 * This tool identifies inconsistencies across pages and provides a consistency
 * score (0-100) with detailed issue reports and remediation suggestions.
 */

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface PageInput {
  name: string;         // Human-readable page name (e.g., "Landing Page")
  slug: string;         // URL slug (e.g., "index", "about", "pricing")
  html: string;         // Full HTML content of the page
  css: string;          // All CSS (combined from all stylesheets)
}

export interface DesignConsistencyInput {
  pages: PageInput[];
  designTokens?: {      // Optional — if provided, check CSS variables match tokens
    colors?: Record<string, string>;
    typography?: Record<string, string>;
    spacing?: Record<string, string>;
    shadows?: Record<string, string>;
    radius?: Record<string, string>;
    transitions?: Record<string, string>;
  };
}

export interface ConsistencyIssue {
  severity: 'error' | 'warning' | 'info';
  category:
    | 'header'
    | 'footer'
    | 'typography'
    | 'colors'
    | 'spacing'
    | 'components'
    | 'layout'
    | 'animations'
    | 'navigation'
    | 'stylesheets';
  message: string;
  affectedPages: string[];  // Page slugs that have this issue
  fix: string;
}

export interface PageReport {
  name: string;
  slug: string;
  consistencyScore: number;  // 0-100
  issueCount: number;
  issues: ConsistencyIssue[];
}

export interface DesignConsistencyOutput {
  score: number;              // 0-100 overall consistency score
  passed: boolean;            // true if score >= 80 and no errors
  issues: ConsistencyIssue[]; // Deduplicated list of all issues across pages
  summary: string;
  pageReport: PageReport[];
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Normalize HTML for comparison: strip whitespace, lowercase tags, normalize structure
 */
function normalizeHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')  // Collapse whitespace
    .replace(/>\s+</g, '><')  // Remove spaces between tags
    .toLowerCase();
}

/**
 * Extract element by selector, handling multiple possible selectors
 */
function extractElement(html: string, selectors: string[]): string {
  const normalized = normalizeHtml(html);

  for (const selector of selectors) {
    // Simple regex-based extraction for common selectors
    if (selector.startsWith('<')) {
      const tagName = selector.replace(/[<>/]/g, '').split(/[\s.#]/)[0];
      const regex = new RegExp(`<${tagName}[^>]*>.*?</${tagName}>`, 'i');
      const match = normalized.match(regex);
      if (match) return match[0];
    } else {
      // Class-based selector
      const classMatch = selector.replace('.', '');
      const regex = new RegExp(`<[^>]*class="[^"]*${classMatch}[^"]*"[^>]*>.*?</[^>]+>`, 'i');
      const match = normalized.match(regex);
      if (match) return match[0];
    }
  }

  return '';
}

/**
 * Extract DOM structure as simplified tree (tag names + key classes)
 */
/** Classes that vary per page and should be stripped before structural comparison */
const PAGE_SPECIFIC_CLASSES = ['active', 'current', 'is-active', 'selected', 'current-page', 'active-link'];

function extractDomStructure(element: string): string {
  if (!element) return 'NOT_FOUND';

  const normalized = normalizeHtml(element);
  // Extract opening tags with their key attributes
  const tags = normalized.match(/<[^>]+>/g) || [];
  return tags
    .map((tag) => {
      const tagName = tag.match(/<(\w+)/)?.[1] || 'unknown';
      const rawClasses = tag.match(/class="([^"]+)"/)?.[1] || '';
      const id = tag.match(/id="([^"]+)"/)?.[1] || '';
      // Strip page-specific classes that legitimately differ between pages
      const classes = rawClasses
        .split(' ')
        .filter(c => !PAGE_SPECIFIC_CLASSES.includes(c))
        .join('.');
      return `<${tagName}${id ? `#${id}` : ''}${classes ? `.${classes}` : ''}`;
    })
    .join(' > ');
}

/**
 * Parse CSS to extract property-value pairs by selector category
 */
function parseCss(css: string): Map<string, Map<string, string>> {
  const result = new Map<string, Map<string, string>>();

  // Remove comments
  let cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Extract rule sets
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cleaned)) !== null) {
    const selector = match[1].trim().toLowerCase();
    const declarationBlock = match[2];

    // Extract property: value pairs
    const declarations = new Map<string, string>();
    const declRegex = /([^:;]+):\s*([^;]+);?/g;
    let declMatch;

    while ((declMatch = declRegex.exec(declarationBlock)) !== null) {
      const property = declMatch[1].trim();
      const value = declMatch[2].trim();
      declarations.set(property, value);
    }

    result.set(selector, declarations);
  }

  return result;
}

/**
 * Categorize CSS selectors for comparison
 */
function categorizeSelector(selector: string): string {
  const lower = selector.toLowerCase();

  if (lower.includes('header') || lower.includes('nav')) return 'header';
  if (lower.includes('footer')) return 'footer';
  if (lower.includes('button') || lower.includes('btn')) return 'button';
  if (lower.includes('card')) return 'card';
  if (lower.includes('input') || lower.includes('field')) return 'input';
  if (lower.includes('checkbox')) return 'checkbox';
  if (lower.includes('toggle')) return 'toggle';
  if (lower.includes('radio')) return 'radio';
  if (lower.includes('h1') || lower.includes('h2') || lower.includes('h3')) return 'heading';
  if (lower.includes('h4') || lower.includes('h5') || lower.includes('h6')) return 'heading';
  if (lower.includes('p') || lower.includes('body') || lower.includes('text')) return 'body-text';
  if (lower.includes('animate') || lower.includes('transition')) return 'animation';
  if (lower.includes('container') || lower.includes('wrapper')) return 'layout';

  return 'other';
}

/**
 * Extract hardcoded color values from CSS
 */
function extractHardcodedColors(css: string): Map<string, string[]> {
  const result = new Map<string, string[]>();

  // Regex for hex colors, rgb, rgba
  const colorRegex = /#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)/gi;
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim().toLowerCase();
    const declarationBlock = match[2];

    // Skip CSS variable declarations — colors in :root are design tokens, not hardcoded
    if (selector.includes(':root') || selector.includes('[data-theme') || selector.includes('--')) continue;

    const colors: string[] = [];
    let colorMatch;
    while ((colorMatch = colorRegex.exec(declarationBlock)) !== null) {
      colors.push(colorMatch[0]);
    }

    if (colors.length > 0) {
      result.set(selector, colors);
    }
  }

  return result;
}

/**
 * Compare CSS values across pages
 */
function compareCssValues(
  allPagesCss: Map<string, Map<string, Map<string, string>>>,
  property: string
): Map<string, Set<string>> {
  const valuesByPage = new Map<string, Set<string>>();

  for (const [pageName, cssMap] of Array.from(allPagesCss.entries())) {
    const values = new Set<string>();
    for (const [, declarations] of Array.from(cssMap.entries())) {
      if (declarations.has(property)) {
        values.add(declarations.get(property)!);
      }
    }
    valuesByPage.set(pageName, values);
  }

  return valuesByPage;
}

// ─── Check Functions ────────────────────────────────────────────────────────

function checkHeaderConsistency(pages: PageInput[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  const headerSelectors = [
    '<header>',
    '.header',
    '.navbar',
    '.nav',
    '<nav>',
  ];

  const headers = pages.map((p) => ({
    slug: p.slug,
    structure: extractDomStructure(extractElement(p.html, headerSelectors)),
  }));

  const reference = headers[0];
  const differentPages: string[] = [];

  for (let i = 1; i < headers.length; i++) {
    if (headers[i].structure !== reference.structure) {
      differentPages.push(headers[i].slug);
    }
  }

  if (differentPages.length > 0) {
    issues.push({
      severity: 'error',
      category: 'header',
      message: `Header/navigation structure differs from reference (${reference.slug})`,
      affectedPages: differentPages,
      fix: `Ensure all pages use identical header HTML structure. Reference found on ${reference.slug}.`,
    });
  }

  return issues;
}

function checkFooterConsistency(pages: PageInput[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  const footerSelectors = ['<footer>', '.footer', 'footer'];

  const footers = pages.map((p) => ({
    slug: p.slug,
    structure: extractDomStructure(extractElement(p.html, footerSelectors)),
  }));

  const reference = footers[0];
  const differentPages: string[] = [];

  for (let i = 1; i < footers.length; i++) {
    if (footers[i].structure !== reference.structure) {
      differentPages.push(footers[i].slug);
    }
  }

  if (differentPages.length > 0) {
    issues.push({
      severity: 'error',
      category: 'footer',
      message: `Footer structure differs from reference (${reference.slug})`,
      affectedPages: differentPages,
      fix: `Ensure all pages use identical footer HTML structure. Reference found on ${reference.slug}.`,
    });
  }

  return issues;
}

function checkTypographyConsistency(pages: PageInput[], allPagesCss: Map<string, Map<string, Map<string, string>>>): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  // Check font-family consistency
  const fontFamilies = compareCssValues(allPagesCss, 'font-family');
  const uniqueFonts = new Set<string>();
  for (const fonts of Array.from(fontFamilies.values())) {
    fonts.forEach((f: string) => uniqueFonts.add(f));
  }

  if (uniqueFonts.size > 2) {
    const pagesWithDifferent: string[] = [];
    const reference = pages[0].slug;
    for (let i = 1; i < pages.length; i++) {
      const refFonts = fontFamilies.get(reference) || new Set();
      const pageFonts = fontFamilies.get(pages[i].slug) || new Set();
      if (JSON.stringify(Array.from(refFonts)) !== JSON.stringify(Array.from(pageFonts))) {
        pagesWithDifferent.push(pages[i].slug);
      }
    }
    if (pagesWithDifferent.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'typography',
        message: `Different font-family values detected across pages`,
        affectedPages: pagesWithDifferent,
        fix: `Standardize font-family using CSS variables (var(--font-heading), var(--font-body)). All pages should reference the same font variables.`,
      });
    }
  }

  // Check line-height consistency
  const lineHeights = compareCssValues(allPagesCss, 'line-height');
  const uniqueHeights = new Set<string>();
  for (const heights of Array.from(lineHeights.values())) {
    heights.forEach((h: string) => uniqueHeights.add(h));
  }

  if (uniqueHeights.size > 3) {
    issues.push({
      severity: 'warning',
      category: 'typography',
      message: `Inconsistent line-height values detected (${uniqueHeights.size} unique values)`,
      affectedPages: pages.map((p) => p.slug),
      fix: `Standardize line-heights. Use consistent values: heading 1.2, body 1.6, UI 1.4. Use CSS variables.`,
    });
  }

  return issues;
}

function checkColorConsistency(pages: PageInput[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  // Check for hardcoded colors instead of CSS variables
  const hardcodedColors: Map<string, string[]> = new Map();

  for (const page of pages) {
    const colors = extractHardcodedColors(page.css);
    for (const [selector, colorList] of Array.from(colors.entries())) {
      // Skip colors that might be legitimate (gradients, borders)
      const category = categorizeSelector(selector);
      if (['button', 'card', 'input', 'heading', 'body-text'].includes(category)) {
        if (!hardcodedColors.has(page.slug)) {
          hardcodedColors.set(page.slug, []);
        }
        hardcodedColors.get(page.slug)!.push(...colorList);
      }
    }
  }

  const pagesWithHardcodedColors = Array.from(hardcodedColors.keys());
  if (pagesWithHardcodedColors.length > 0) {
    issues.push({
      severity: 'error',
      category: 'colors',
      message: `Hardcoded color values detected instead of CSS variables`,
      affectedPages: pagesWithHardcodedColors,
      fix: `Replace all hardcoded hex/rgb colors with CSS custom properties (var(--color-primary), var(--color-neutral-700), etc.). This ensures consistent theming across all pages.`,
    });
  }

  // Check that semantic colors are used consistently
  const semanticColors = ['success', 'warning', 'error', 'info'];
  for (const semanticColor of semanticColors) {
    const pagesUsing: string[] = [];
    for (const page of pages) {
      if (page.css.includes(`--color-${semanticColor}`) || page.css.includes(`color-${semanticColor}`)) {
        pagesUsing.push(page.slug);
      }
    }

    if (pagesUsing.length > 0 && pagesUsing.length < pages.length) {
      issues.push({
        severity: 'info',
        category: 'colors',
        message: `Semantic color (${semanticColor}) used inconsistently across pages`,
        affectedPages: pages.map((p) => p.slug).filter((s) => !pagesUsing.includes(s)),
        fix: `Ensure all status/semantic colors (success, warning, error, info) are available on all pages for consistent messaging.`,
      });
    }
  }

  return issues;
}

function checkSpacingConsistency(pages: PageInput[], allPagesCss: Map<string, Map<string, Map<string, string>>>): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  // Check for pixel-based spacing vs rem-based
  const spacingUnits: Map<string, Set<string>> = new Map();

  for (const [pageName, cssMap] of Array.from(allPagesCss.entries())) {
    const units = new Set<string>();
    for (const [selector, declarations] of Array.from(cssMap.entries())) {
      for (const [prop, value] of Array.from(declarations.entries())) {
        if (['padding', 'margin', 'gap'].some((p) => prop.includes(p))) {
          if (value.includes('px')) units.add('px');
          if (value.includes('rem')) units.add('rem');
          if (value.includes('em')) units.add('em');
        }
      }
    }
    spacingUnits.set(pageName, units);
  }

  const pagesWithMixedUnits: string[] = [];
  for (const [pageName, units] of Array.from(spacingUnits.entries())) {
    if (units.size > 1) {
      pagesWithMixedUnits.push(pageName);
    }
  }

  if (pagesWithMixedUnits.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'spacing',
      message: `Mixed spacing units (px, rem, em) detected`,
      affectedPages: pagesWithMixedUnits,
      fix: `Standardize on a single spacing unit (recommend rem for scalability). Use CSS variable spacing scale: var(--space-xs), var(--space-sm), var(--space-md), etc.`,
    });
  }

  // Check section padding consistency
  const sectionPadding = compareCssValues(allPagesCss, 'padding');
  const uniquePaddings = new Set<string>();
  for (const paddings of Array.from(sectionPadding.values())) {
    paddings.forEach((p: string) => uniquePaddings.add(p));
  }

  if (uniquePaddings.size > 4) {
    issues.push({
      severity: 'info',
      category: 'spacing',
      message: `Many different padding values detected (${uniquePaddings.size})`,
      affectedPages: pages.map((p) => p.slug),
      fix: `Use a consistent spacing scale (4px grid). Recommend section padding: 4xl/5xl vertical, xl/2xl horizontal. Reference: var(--space-4xl), var(--space-5xl).`,
    });
  }

  return issues;
}

function checkComponentConsistency(pages: PageInput[], allPagesCss: Map<string, Map<string, Map<string, string>>>): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  const componentTypes = ['button', 'card', 'input', 'checkbox', 'toggle', 'badge'];

  for (const componentType of componentTypes) {
    const componentStyles: Map<string, Map<string, string>> = new Map();

    for (const [pageName, cssMap] of Array.from(allPagesCss.entries())) {
      const pageComponentStyles = new Map<string, string>();
      for (const [selector, declarations] of Array.from(cssMap.entries())) {
        if (selector.includes(componentType)) {
          const styleString = Array.from(declarations.entries() as IterableIterator<[string, string]>)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([k, v]) => `${k}:${v}`)
            .join(';');
          pageComponentStyles.set(selector, styleString);
        }
      }
      if (pageComponentStyles.size > 0) {
        componentStyles.set(pageName, pageComponentStyles);
      }
    }

    // Compare component styles across pages
    if (componentStyles.size > 1) {
      const stylesList = Array.from(componentStyles.values());
      const reference = stylesList[0];

      let isConsistent = true;
      for (let i = 1; i < stylesList.length; i++) {
        if (JSON.stringify(reference) !== JSON.stringify(stylesList[i])) {
          isConsistent = false;
          break;
        }
      }

      if (!isConsistent) {
        const affectedPages = Array.from(componentStyles.keys()) as string[];
        issues.push({
          severity: 'error',
          category: 'components',
          message: `${componentType} component styling differs across pages`,
          affectedPages: affectedPages,
          fix: `Ensure ${componentType} components use identical CSS across all pages. Extract to a shared component stylesheet. Use the Design Token Registry pattern: ONE style per component type, reused everywhere.`,
        });
      }
    }
  }

  // Check hover/focus/active states
  const hoverStates: Map<string, boolean> = new Map();
  for (const [pageName, cssMap] of Array.from(allPagesCss.entries())) {
    let hasHoverStates = false;
    for (const [selector] of Array.from(cssMap.entries())) {
      if (selector.includes(':hover') || selector.includes(':focus') || selector.includes(':active')) {
        hasHoverStates = true;
        break;
      }
    }
    hoverStates.set(pageName, hasHoverStates);
  }

  const pagesWithoutInteractiveStates = Array.from(hoverStates.entries())
    .filter(([, hasStates]) => !hasStates)
    .map(([pageName]) => pageName);

  if (pagesWithoutInteractiveStates.length > 0 && pagesWithoutInteractiveStates.length < pages.length) {
    issues.push({
      severity: 'warning',
      category: 'components',
      message: `Interactive states (hover, focus, active) inconsistently applied`,
      affectedPages: pagesWithoutInteractiveStates,
      fix: `Add hover/focus/active states to all interactive elements (buttons, links, inputs). Ensure visual feedback is consistent and indicates interactivity.`,
    });
  }

  return issues;
}

function checkLayoutConsistency(pages: PageInput[], allPagesCss: Map<string, Map<string, Map<string, string>>>): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  // Check for consistent page structure (header → main → footer)
  const pageStructures: Map<string, boolean> = new Map();

  for (const page of pages) {
    const normalized = normalizeHtml(page.html);
    const hasHeader = /<header|class="[^"]*header/.test(normalized) || /<nav/.test(normalized);
    const hasMain = /<main|class="[^"]*main/.test(normalized);
    const hasFooter = /<footer|class="[^"]*footer/.test(normalized);

    const isStructured = hasHeader && hasMain && hasFooter;
    pageStructures.set(page.slug, isStructured);
  }

  const unstructuredPages = Array.from(pageStructures.entries())
    .filter(([, isStructured]) => !isStructured)
    .map(([slug]) => slug);

  if (unstructuredPages.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'layout',
      message: `Inconsistent page structure detected (missing header/main/footer)`,
      affectedPages: unstructuredPages,
      fix: `Ensure all pages follow semantic structure: <header> for navigation, <main> for content, <footer> for links. This creates consistency and improves accessibility.`,
    });
  }

  // Check max-width consistency
  const maxWidths = compareCssValues(allPagesCss, 'max-width');
  const uniqueMaxWidths = new Set<string>();
  for (const widths of Array.from(maxWidths.values())) {
    widths.forEach((w: string) => uniqueMaxWidths.add(w));
  }

  if (uniqueMaxWidths.size > 2) {
    issues.push({
      severity: 'info',
      category: 'layout',
      message: `Multiple max-width values detected`,
      affectedPages: pages.map((p) => p.slug),
      fix: `Standardize container max-width. Recommend: 1280px for desktop, 100% for mobile. Use CSS variable: var(--container-max-width).`,
    });
  }

  return issues;
}

function checkAnimationConsistency(pages: PageInput[], allPagesCss: Map<string, Map<string, Map<string, string>>>): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  const animationSelectors = ['.animate-on-scroll', '.animate-from-left', '.animate-from-right', '.animate-scale-in'];
  const pagesWithAnimations: Map<string, number> = new Map();

  for (const page of pages) {
    let animationCount = 0;
    for (const selector of animationSelectors) {
      if (page.css.includes(selector)) {
        animationCount++;
      }
    }
    pagesWithAnimations.set(page.slug, animationCount);
  }

  const animated = Array.from(pagesWithAnimations.values()).filter((count: number) => count > 0).length;
  const unAnimated = pages.length - animated;

  if (unAnimated > 0 && animated > 0) {
    const unAnimatedPages = Array.from(pagesWithAnimations.entries())
      .filter(([, count]) => count === 0)
      .map(([slug]) => slug);

    issues.push({
      severity: 'warning',
      category: 'animations',
      message: `Scroll animations present on some pages but not others`,
      affectedPages: unAnimatedPages,
      fix: `Apply consistent scroll-triggered entrance animations on all pages. Add classes like .animate-on-scroll, .animate-from-left to content sections.`,
    });
  }

  // Check transition timing consistency
  const transitions = compareCssValues(allPagesCss, 'transition');
  const uniqueTransitions = new Set<string>();
  for (const trans of Array.from(transitions.values())) {
    trans.forEach((t: string) => uniqueTransitions.add(t));
  }

  if (uniqueTransitions.size > 3) {
    issues.push({
      severity: 'info',
      category: 'animations',
      message: `Many different transition values detected (${uniqueTransitions.size})`,
      affectedPages: pages.map((p) => p.slug),
      fix: `Standardize transition timing. Use CSS variables: var(--transition-fast: 150ms), var(--transition-base: 250ms), var(--transition-slow: 350ms), var(--transition-spring: 500ms).`,
    });
  }

  return issues;
}

function checkNavigationConsistency(pages: PageInput[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  // Extract all nav links from each page
  const navLinks: Map<string, Set<string>> = new Map();

  for (const page of pages) {
    const normalized = normalizeHtml(page.html);
    const linkRegex = /href=["']([^"']+)["']/g;
    const links = new Set<string>();

    let match;
    while ((match = linkRegex.exec(normalized)) !== null) {
      const href = match[1];
      // Only internal links
      if (!href.startsWith('http') && !href.startsWith('//')) {
        links.add(href);
      }
    }

    navLinks.set(page.slug, links);
  }

  // Check that navigation includes all pages
  const allPageSlugs = new Set(pages.map((p) => p.slug));

  for (const [pageName, links] of Array.from(navLinks.entries())) {
    const missingPages = Array.from(allPageSlugs).filter(
      (slug: string) => !Array.from(links).some((link: string) => link.includes(slug))
    );

    if (missingPages.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'navigation',
        message: `Navigation missing links to pages: ${missingPages.join(', ')}`,
        affectedPages: [pageName],
        fix: `Update navigation to include links to all pages. Ensure consistent navigation across all pages.`,
      });
    }
  }

  return issues;
}

// ─── Stylesheet & Font Consistency ──────────────────────────────────────────

function checkStylesheetConsistency(pages: PageInput[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  if (pages.length < 2) return issues;

  const stylesheetsByPage = new Map<string, string[]>();
  const fontsByPage = new Map<string, string[]>();

  for (const page of pages) {
    const sheets: string[] = [];
    const fonts: string[] = [];
    const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(page.html)) !== null) {
      const href = match[1];
      if (href.includes('googleapis') || href.includes('gstatic')) {
        fonts.push(href);
      } else if (match[0].includes('stylesheet')) {
        sheets.push(href);
      }
    }
    stylesheetsByPage.set(page.slug, sheets.sort());
    fontsByPage.set(page.slug, fonts.sort());
  }

  const refSheets = stylesheetsByPage.get(pages[0].slug) || [];
  const diffSheetPages = pages.slice(1).filter(p =>
    JSON.stringify(stylesheetsByPage.get(p.slug)) !== JSON.stringify(refSheets)
  ).map(p => p.slug);

  if (diffSheetPages.length > 0) {
    issues.push({
      severity: 'error',
      category: 'stylesheets',
      message: 'Stylesheet <link> tags differ across pages — some pages may be missing shared CSS',
      affectedPages: diffSheetPages,
      fix: `Ensure all pages link the same CSS files. Reference page "${pages[0].slug}" has: ${refSheets.join(', ') || 'none'}.`,
    });
  }

  const refFonts = fontsByPage.get(pages[0].slug) || [];
  const diffFontPages = pages.slice(1).filter(p =>
    JSON.stringify(fontsByPage.get(p.slug)) !== JSON.stringify(refFonts)
  ).map(p => p.slug);

  if (diffFontPages.length > 0) {
    issues.push({
      severity: 'error',
      category: 'typography',
      message: 'Google Fonts links differ across pages — some pages may render with fallback fonts',
      affectedPages: diffFontPages,
      fix: `All pages must include identical Google Fonts links. Reference: ${refFonts[0] || 'none found'}.`,
    });
  }

  return issues;
}

// ─── Heading Hierarchy ──────────────────────────────────────────────────────

function checkHeadingHierarchy(pages: PageInput[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  for (const page of pages) {
    const h1Count = (page.html.match(/<h1[\s>]/gi) || []).length;
    if (h1Count === 0) {
      issues.push({
        severity: 'warning',
        category: 'typography',
        message: `Page "${page.name}" is missing an <h1> tag`,
        affectedPages: [page.slug],
        fix: 'Every page should have exactly one <h1> for SEO and accessibility.',
      });
    } else if (h1Count > 1) {
      issues.push({
        severity: 'warning',
        category: 'typography',
        message: `Page "${page.name}" has ${h1Count} <h1> tags (should be exactly 1)`,
        affectedPages: [page.slug],
        fix: 'Use exactly one <h1> per page. Use <h2>-<h6> for section headings.',
      });
    }
  }

  return issues;
}

// ─── Main Tool Function ──────────────────────────────────────────────────────

export function designConsistencyCheck(input: DesignConsistencyInput): DesignConsistencyOutput {
  const { pages, designTokens } = input;

  if (pages.length === 0) {
    return {
      score: 100,
      passed: true,
      issues: [],
      summary: 'No pages to check.',
      pageReport: [],
    };
  }

  // Parse all CSS across pages
  const allPagesCss: Map<string, Map<string, Map<string, string>>> = new Map();
  for (const page of pages) {
    allPagesCss.set(page.slug, parseCss(page.css));
  }

  // Run all consistency checks
  const allIssues: ConsistencyIssue[] = [];

  allIssues.push(...checkHeaderConsistency(pages));
  allIssues.push(...checkFooterConsistency(pages));
  allIssues.push(...checkTypographyConsistency(pages, allPagesCss));
  allIssues.push(...checkColorConsistency(pages));
  allIssues.push(...checkSpacingConsistency(pages, allPagesCss));
  allIssues.push(...checkComponentConsistency(pages, allPagesCss));
  allIssues.push(...checkLayoutConsistency(pages, allPagesCss));
  allIssues.push(...checkAnimationConsistency(pages, allPagesCss));
  allIssues.push(...checkNavigationConsistency(pages));
  allIssues.push(...checkStylesheetConsistency(pages));
  allIssues.push(...checkHeadingHierarchy(pages));

  // Deduplicate issues (same message across multiple checks)
  const issueMap = new Map<string, ConsistencyIssue>();
  for (const issue of allIssues) {
    const key = `${issue.category}:${issue.message}`;
    if (issueMap.has(key)) {
      const existing = issueMap.get(key)!;
      const combined = new Set([...existing.affectedPages, ...issue.affectedPages]);
      existing.affectedPages = Array.from(combined);
    } else {
      issueMap.set(key, issue);
    }
  }

  const deduplicatedIssues = Array.from(issueMap.values());

  // Calculate per-page consistency scores
  const pageReports: PageReport[] = pages.map((page) => {
    const pageIssues = deduplicatedIssues.filter((issue) => issue.affectedPages.includes(page.slug));
    const errorCount = pageIssues.filter((i) => i.severity === 'error').length;
    const warningCount = pageIssues.filter((i) => i.severity === 'warning').length;
    const infoCount = pageIssues.filter((i) => i.severity === 'info').length;

    const score = Math.max(
      0,
      100 - errorCount * 10 - warningCount * 4 - infoCount * 1
    );

    return {
      name: page.name,
      slug: page.slug,
      consistencyScore: score,
      issueCount: pageIssues.length,
      issues: pageIssues,
    };
  });

  // Calculate overall score
  const avgScore = pageReports.reduce((sum, r) => sum + r.consistencyScore, 0) / pages.length;
  const errorCount = deduplicatedIssues.filter((i) => i.severity === 'error').length;
  // No double-penalty — per-page scores already account for errors
  const finalScore = Math.round(avgScore);

  const passed = finalScore >= 80 && errorCount === 0;

  // Build summary
  const summary = buildSummary(finalScore, passed, deduplicatedIssues, pageReports);

  return {
    score: finalScore,
    passed,
    issues: deduplicatedIssues,
    summary,
    pageReport: pageReports,
  };
}

// ─── Summary Builder ─────────────────────────────────────────────────────────

function buildSummary(
  score: number,
  passed: boolean,
  issues: ConsistencyIssue[],
  pageReports: PageReport[]
): string {
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  let summary = `## Design Consistency Report\n\n`;
  summary += `**Overall Score: ${score}/100** — ${passed ? '✅ PASSED' : '❌ NEEDS WORK'}\n\n`;

  summary += `### Issue Summary\n`;
  summary += `- **Errors:** ${errorCount} (structural inconsistencies)\n`;
  summary += `- **Warnings:** ${warningCount} (style inconsistencies)\n`;
  summary += `- **Info:** ${infoCount} (minor improvements)\n\n`;

  summary += `### Per-Page Scores\n`;
  for (const report of pageReports) {
    const status = report.consistencyScore >= 80 ? '✅' : '⚠️';
    summary += `- **${report.name}** (${report.slug}): ${report.consistencyScore}/100 ${status}\n`;
  }

  if (issues.length > 0) {
    summary += `\n### Top Issues to Fix\n`;
    const topIssues = issues
      .sort((a, b) => {
        const severityOrder = { error: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 5);

    for (const issue of topIssues) {
      const severityBadge = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
      summary += `\n${severityBadge} **${issue.category.toUpperCase()}** — ${issue.message}\n`;
      summary += `   - Affected pages: ${issue.affectedPages.join(', ')}\n`;
      summary += `   - Fix: ${issue.fix}\n`;
    }
  } else {
    summary += `\n✅ No inconsistencies detected!\n`;
  }

  summary += `\n### Recommendations\n`;
  summary += `1. **Extract shared components** into a single stylesheet (buttons, cards, inputs)\n`;
  summary += `2. **Use CSS custom properties** for all colors, spacing, and typography\n`;
  summary += `3. **Implement the Design Token Registry pattern** — one style per component type\n`;
  summary += `4. **Apply scroll animations** consistently across all pages\n`;
  summary += `5. **Test responsive behavior** at all breakpoints (375px, 768px, 1024px, 1440px)\n`;

  return summary;
}
