/**
 * MCP Tool: explore_components
 *
 * Fetches REAL animated UI components from UIverse.io's GitHub repository
 * (https://github.com/uiverse-io/galaxy) via GitHub's REST API.
 *
 * Makes the MCP server HYBRID — uses both built-in library AND fresh UIverse components.
 * Provides production-ready, animated components for adaptation into the design system.
 *
 * Features:
 * - GitHub REST API integration with rate-limit handling
 * - Animation detection and scoring (prefer components with @keyframes, transitions, transforms)
 * - In-memory caching to minimize API calls
 * - Component parsing (HTML + CSS extraction from self-contained files)
 * - Filtering by animation level, keyword search, and availability
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExploreComponentsInput {
  /** Categories to fetch: 'buttons', 'cards', 'loaders', 'inputs', 'checkboxes', 'toggles', 'forms', etc. */
  categories: string[];
  /** Prefer animated components (default: true) */
  preferAnimated?: boolean;
  /** Max components per category (default: 5) */
  maxPerCategory?: number;
  /** Optional keyword filter: 'neon', 'glow', 'gradient', 'bounce', etc. */
  searchQuery?: string;
  /** Min animation count required (default: 1 if preferAnimated, else 0) */
  minAnimations?: number;
}

export interface UIverseComponent {
  /** Filename without extension */
  name: string;
  /** Category: button, card, loader, input, etc. */
  category: string;
  /** Raw HTML code (pre-formatted, ready to adapt) */
  html: string;
  /** Raw CSS code (with @keyframes, transitions, etc.) */
  css: string;
  /** True if contains @keyframes or animation properties */
  hasAnimations: boolean;
  /** Number of distinct animations detected */
  animationCount: number;
  /** CSS animation names found */
  animationNames: string[];
  /** True if has transition declarations */
  hasTransitions: boolean;
  /** Source: 'uiverse-github' to distinguish from built-in */
  source: string;
  /** Full GitHub raw content URL */
  sourceUrl: string;
  /** Animation richness score (0-100) for sorting */
  animationScore: number;
}

export interface ExploreComponentsOutput {
  /** Array of discovered components */
  components: UIverseComponent[];
  /** Total components found across all categories */
  totalFound: number;
  /** Categories that were searched */
  categoriesSearched: string[];
  /** Human-readable summary of results */
  summary: string;
  /** Whether all results came from cache */
  fromCache: boolean;
  /** Any errors encountered (non-blocking) */
  errors: string[];
}

// ─── GitHub API Configuration ───────────────────────────────────────────────

const GITHUB_REPO = 'uiverse-io/galaxy';
const GITHUB_BRANCH = 'main';
const API_BASE = 'https://api.github.com/repos';
const RAW_BASE = 'https://raw.githubusercontent.com';
const API_DELAY_MS = 100; // respectful delay between GitHub API calls

// Category mapping: user input → GitHub folder name
const CATEGORY_MAP: Record<string, string> = {
  'button': 'buttons',
  'buttons': 'buttons',
  'btn': 'buttons',
  'card': 'cards',
  'cards': 'cards',
  'loader': 'loaders',
  'loaders': 'loaders',
  'spinner': 'loaders',
  'spinners': 'loaders',
  'input': 'inputs',
  'inputs': 'inputs',
  'text-field': 'inputs',
  'textfield': 'inputs',
  'checkbox': 'checkboxes',
  'checkboxes': 'checkboxes',
  'toggle': 'toggle-switches',
  'toggles': 'toggle-switches',
  'toggle-switch': 'toggle-switches',
  'switch': 'toggle-switches',
  'radio': 'radio-buttons',
  'radio-button': 'radio-buttons',
  'radio-buttons': 'radio-buttons',
  'form': 'forms',
  'forms': 'forms',
  'dropdown': 'dropdowns',
  'dropdowns': 'dropdowns',
  'select': 'dropdowns',
  'menu': 'dropdowns',
  'navigation': 'navigation',
  'nav': 'navigation',
  'navbar': 'navigation',
  'navbars': 'navigation',
  'header': 'navigation',
  'tooltip': 'tooltips',
  'tooltips': 'tooltips',
  'badge': 'badges',
  'badges': 'badges',
  'tag': 'badges',
  'tags': 'badges',
  'modal': 'modals',
  'modals': 'modals',
  'dialog': 'modals',
  'popup': 'modals',
};

// ─── In-Memory Cache ────────────────────────────────────────────────────────

/**
 * Module-level cache: persists for the MCP session lifetime.
 * Key: category name (e.g., 'buttons')
 * Value: array of parsed UIverse components
 */
const componentCache = new Map<string, UIverseComponent[]>();

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Normalizes category input to GitHub folder name.
 * 'button' → 'buttons', 'toggle-switch' → 'toggle-switches', etc.
 */
function normalizeCategory(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  return CATEGORY_MAP[normalized] || null;
}

/**
 * Delays execution for API rate limiting.
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parses HTML/CSS from UIverse component file.
 * UIverse files are self-contained: HTML outside <style>, CSS inside.
 *
 * Example structure:
 * ```html
 * <div class="button">Click me</div>
 * <style>
 * .button { ... }
 * </style>
 * ```
 */
function parseComponent(rawContent: string): { html: string; css: string } {
  const styleMatch = rawContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const css = styleMatch ? styleMatch[1].trim() : '';
  const html = rawContent.replace(/<style[^>]*>[\s\S]*?<\/style>/i, '').trim();

  return { html, css };
}

/**
 * Detects and scores animations in CSS.
 * Returns: { hasAnimations, animationCount, animationNames, hasTransitions, score }
 */
function analyzeAnimations(css: string): {
  hasAnimations: boolean;
  animationCount: number;
  animationNames: string[];
  hasTransitions: boolean;
  score: number;
} {
  let score = 0;

  // Detect @keyframes
  const keyframesRegex = /@keyframes\s+([a-zA-Z0-9\-_]+)/g;
  const animationMatches = [...css.matchAll(keyframesRegex)];
  const animationNames = animationMatches.map(m => m[1]);

  score += animationNames.length * 20;

  // Detect animation property usage
  const animationUsageRegex = /animation(?:-name)?:\s*([a-zA-Z0-9\-_,\s]+)(?:;|\s)/g;
  const animationUsages = [...css.matchAll(animationUsageRegex)].length;
  score += animationUsages * 15;

  // Detect transitions
  const hasTransitions = /transition\s*:/i.test(css);
  if (hasTransitions) score += 10;

  // Detect transforms
  const transformCount = (css.match(/transform\s*:/g) || []).length;
  score += Math.min(transformCount * 5, 15);

  // Detect hover/focus/active animations
  const interactiveRegex = /:(hover|focus|active|visited)\s*{[^}]*(?:animation|transition|transform)[^}]*}/gi;
  const interactiveCount = [...css.matchAll(interactiveRegex)].length;
  score += interactiveCount * 8;

  // Detect filters, shadows, glows (visual enhancements)
  const filterCount = (css.match(/filter\s*:/g) || []).length;
  const shadowCount = (css.match(/(?:box-)?shadow\s*:/g) || []).length;
  score += (filterCount + shadowCount) * 3;

  // Cap score at 100
  score = Math.min(score, 100);

  return {
    hasAnimations: animationNames.length > 0 || animationUsages > 0 || hasTransitions,
    animationCount: animationNames.length,
    animationNames,
    hasTransitions,
    score,
  };
}

/**
 * Fetches component file list from GitHub for a given category.
 * Returns array of filenames (e.g., ['button-01.html', 'button-02.html'])
 */
async function fetchComponentListFromGitHub(category: string): Promise<string[]> {
  const url = `${API_BASE}/${GITHUB_REPO}/contents/${category}?ref=${GITHUB_BRANCH}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'UIArchitectMCP/1.0',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // Category doesn't exist
      }
      if (response.status === 403) {
        throw new Error('GitHub API rate limited');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    // Filter for HTML files only
    return data
      .filter((item: any) => item.type === 'file' && item.name.endsWith('.html'))
      .map((item: any) => item.name);
  } catch (error) {
    throw new Error(
      `Failed to fetch component list for category "${category}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetches raw component content from GitHub.
 */
async function fetchComponentContentFromGitHub(
  category: string,
  filename: string
): Promise<string> {
  const url = `${RAW_BASE}/${GITHUB_REPO}/${GITHUB_BRANCH}/${category}/${filename}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'UIArchitectMCP/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    throw new Error(
      `Failed to fetch component "${filename}" from category "${category}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetches and parses all components for a single category.
 * Respects GitHub API rate limits with delays.
 * Returns parsed components, sorted by animation score (highest first).
 */
async function fetchComponentsForCategory(
  category: string,
  maxCount: number
): Promise<UIverseComponent[]> {
  // Check cache first
  if (componentCache.has(category)) {
    return componentCache.get(category)!;
  }

  const filenames = await fetchComponentListFromGitHub(category);

  if (filenames.length === 0) {
    return [];
  }

  const components: UIverseComponent[] = [];

  // Fetch each component file (with respectful delay)
  for (let i = 0; i < Math.min(filenames.length, maxCount * 2); i++) {
    const filename = filenames[i];

    try {
      await delay(API_DELAY_MS);

      const rawContent = await fetchComponentContentFromGitHub(category, filename);
      const { html, css } = parseComponent(rawContent);
      const { hasAnimations, animationCount, animationNames, hasTransitions, score } =
        analyzeAnimations(css);

      components.push({
        name: filename.replace('.html', ''),
        category,
        html,
        css,
        hasAnimations,
        animationCount,
        animationNames,
        hasTransitions,
        source: 'uiverse-github',
        sourceUrl: `${RAW_BASE}/${GITHUB_REPO}/${GITHUB_BRANCH}/${category}/${filename}`,
        animationScore: score,
      });
    } catch (error) {
      // Non-blocking: skip this component and continue
      console.error(
        `Skipping component ${filename}: ${error instanceof Error ? error.message : String(error)}`
      );
      continue;
    }
  }

  // Sort by animation score (highest first)
  components.sort((a, b) => b.animationScore - a.animationScore);

  // Cache results
  componentCache.set(category, components);

  return components;
}

/**
 * Filters components by search query (keyword matching in name and CSS).
 */
function filterBySearchQuery(
  components: UIverseComponent[],
  query: string
): UIverseComponent[] {
  const lowerQuery = query.toLowerCase();

  return components.filter(
    comp =>
      comp.name.toLowerCase().includes(lowerQuery) ||
      comp.css.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Main tool function.
 */
export async function exploreComponents(
  input: ExploreComponentsInput
): Promise<ExploreComponentsOutput> {
  const {
    categories,
    preferAnimated = true,
    maxPerCategory = 5,
    searchQuery,
    minAnimations,
  } = input;

  const errors: string[] = [];
  const allComponents: UIverseComponent[] = [];
  const categoriesSearched: string[] = [];
  const fromCache = categories.every(cat => {
    const normalized = normalizeCategory(cat);
    return normalized && componentCache.has(normalized);
  });

  // Normalize and validate categories
  const normalizedCategories = categories
    .map(cat => normalizeCategory(cat))
    .filter((cat): cat is string => cat !== null);

  if (normalizedCategories.length === 0) {
    return {
      components: [],
      totalFound: 0,
      categoriesSearched: [],
      summary:
        'No valid categories provided. Valid categories: buttons, cards, loaders, inputs, checkboxes, toggles, radios, forms, dropdowns, navigation, tooltips, badges, modals.',
      fromCache: false,
      errors: ['No valid categories in input'],
    };
  }

  // Fetch components for each category
  for (const category of normalizedCategories) {
    try {
      const categoryComponents = await fetchComponentsForCategory(
        category,
        maxPerCategory
      );

      if (categoryComponents.length === 0) {
        errors.push(`No components found for category: ${category}`);
        continue;
      }

      categoriesSearched.push(category);

      let filtered = categoryComponents;

      // Filter by animation preference
      if (preferAnimated) {
        const minScore = minAnimations ? minAnimations * 15 : 15; // rough scoring
        filtered = filtered.filter(
          comp =>
            comp.animationScore >= minScore &&
            comp.hasAnimations
        );
      }

      // Filter by search query
      if (searchQuery && searchQuery.trim()) {
        filtered = filterBySearchQuery(filtered, searchQuery);
      }

      // Take top N per category
      allComponents.push(...filtered.slice(0, maxPerCategory));
    } catch (error) {
      const errorMsg = `Error fetching category "${category}": ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  // Sort all results by animation score
  allComponents.sort((a, b) => b.animationScore - a.animationScore);

  // Generate summary
  let summary = `Discovered ${allComponents.length} components from UIverse.io across ${categoriesSearched.length} categories.`;

  if (preferAnimated) {
    const animatedCount = allComponents.filter(c => c.hasAnimations).length;
    summary += ` ${animatedCount} include CSS animations (preferred).`;
  }

  if (searchQuery) {
    summary += ` Filtered by keyword: "${searchQuery}".`;
  }

  if (errors.length > 0) {
    summary += ` (${errors.length} non-blocking errors — see details below)`;
  }

  return {
    components: allComponents,
    totalFound: allComponents.length,
    categoriesSearched,
    summary,
    fromCache,
    errors,
  };
}
