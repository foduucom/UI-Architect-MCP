/**
 * MCP Tool: explore_components
 *
 * Discovers animated UI components using a LOCAL-FIRST strategy:
 *  1. Searches the 3800+ built-in local registry (src/components/*)
 *  2. Optionally supplements with live GitHub fetches from UIverse.io
 *
 * Features:
 * - LOCAL-FIRST: Instant results from 3800+ pre-indexed components
 * - Animation detection and scoring (prefer components with @keyframes, transitions, transforms)
 * - Keyword search across tags, name, and description
 * - GitHub supplement for fresh community components (rate-limited, optional)
 * - In-memory caching for GitHub results
 */

import { LOCAL_COMPONENTS } from '../engine/local-library.js';
import type { ComponentDefinition } from '../engine/types.js';
import { getStyleConstraints, scoreComponentFit } from '../engine/style-classifier.js';

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
  /** Industry for style-aware filtering (e.g., 'luxury', 'restaurant', 'corporate') */
  industry?: string;
  /** Tone for style-aware filtering (e.g., 'elegant', 'minimal', 'bold') */
  tone?: string;
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

// ─── Local Registry Category Mapping ────────────────────────────────────────
// Maps explore-tool category names → local registry category field values
const LOCAL_CATEGORY_MAP: Record<string, string[]> = {
  'buttons':         ['button-primary', 'button-secondary'],
  'cards':           ['card'],
  'inputs':          ['input'],
  'checkboxes':      ['checkbox'],
  'toggle-switches': ['toggle'],
  'radio-buttons':   ['radio'],
  'tooltips':        ['tooltip'],
  'loaders':         ['loader'],
  'forms':           ['form', 'input'],  // forms may use input components too
  'navigation':      ['navigation'],
  'badges':          ['badge'],
  'modals':          ['modal'],
  'dropdowns':       ['dropdown'],
  'notifications':   ['notification'],
};

/**
 * Searches the local 3800+ component registry.
 * Filters by category, optional keyword, industry/tone style constraints,
 * and scores by animation + style fit.
 */
function searchLocalComponents(
  category: string,
  searchQuery?: string,
  preferAnimated?: boolean,
  maxCount: number = 5,
  industry?: string,
  tone?: string
): UIverseComponent[] {
  const localCategories = LOCAL_CATEGORY_MAP[category];
  if (!localCategories || localCategories.length === 0) {
    return [];
  }

  // Resolve style constraints from industry + tone
  const constraints = (industry || tone)
    ? getStyleConstraints(industry, tone)
    : null;

  // Filter local components by matching categories
  let matched: ComponentDefinition[] = LOCAL_COMPONENTS.filter(
    comp => localCategories.includes(comp.category)
  );

  // Filter by search query (match against tags, name, description)
  if (searchQuery && searchQuery.trim()) {
    const lowerQuery = searchQuery.toLowerCase().trim();
    matched = matched.filter(comp =>
      comp.name.toLowerCase().includes(lowerQuery) ||
      comp.description.toLowerCase().includes(lowerQuery) ||
      comp.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Convert to UIverseComponent format with animation + style scoring
  const results: Array<UIverseComponent & { styleFitScore: number }> = [];

  for (const comp of matched) {
    const animInfo = analyzeAnimations(comp.css || '');

    // Apply industry/tone style filter if constraints exist
    let styleFit = 50; // neutral score when no constraints
    if (constraints) {
      styleFit = scoreComponentFit(comp.css || '', comp.tags, constraints);
      if (styleFit === -1) continue; // rejected by forbid tags
    }

    results.push({
      name: comp.name,
      category,
      html: comp.html || '',
      css: comp.css || '',
      hasAnimations: animInfo.hasAnimations,
      animationCount: animInfo.animationCount,
      animationNames: animInfo.animationNames,
      hasTransitions: animInfo.hasTransitions,
      source: 'local-registry',
      sourceUrl: `built-in://${comp.id}`,
      animationScore: animInfo.score,
      styleFitScore: styleFit,
    });
  }

  // Sort by combined score: style fit (primary) + animation score (secondary)
  if (constraints) {
    results.sort((a, b) => {
      const diff = b.styleFitScore - a.styleFitScore;
      if (diff !== 0) return diff;
      return preferAnimated ? b.animationScore - a.animationScore : 0;
    });
  } else if (preferAnimated) {
    results.sort((a, b) => b.animationScore - a.animationScore);
  }

  return results.slice(0, maxCount);
}

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
    const headers: Record<string, string> = {
      'User-Agent': 'UIArchitectMCP/1.0',
      'Accept': 'application/vnd.github.v3+json',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });

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
    const headers: Record<string, string> = {
      'User-Agent': 'UIArchitectMCP/1.0',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });

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
    industry,
    tone,
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

  // LOCAL-FIRST: Search local registries, then optionally supplement from GitHub
  for (const category of normalizedCategories) {
    try {
      // Step 1: Search local registry (instant, reliable)
      const localResults = searchLocalComponents(
        category,
        searchQuery,
        preferAnimated,
        maxPerCategory,
        industry,
        tone
      );

      if (localResults.length > 0) {
        categoriesSearched.push(category);
        allComponents.push(...localResults);
      }

      // Step 2: If local didn't fill quota, try GitHub as supplement
      if (localResults.length < maxPerCategory) {
        try {
          const githubComponents = await fetchComponentsForCategory(
            category,
            maxPerCategory - localResults.length
          );

          let filtered = githubComponents;

          // Filter by animation preference
          if (preferAnimated) {
            const minScore = minAnimations ? minAnimations * 15 : 15;
            filtered = filtered.filter(
              comp => comp.animationScore >= minScore && comp.hasAnimations
            );
          }

          // Filter by search query
          if (searchQuery && searchQuery.trim()) {
            filtered = filterBySearchQuery(filtered, searchQuery);
          }

          // Apply industry/tone style constraints to GitHub components too
          if (industry || tone) {
            const constraints = getStyleConstraints(industry, tone);
            if (constraints) {
              filtered = filtered.filter(comp => {
                // Extract tags from CSS comment line (UIverse components have tags in comments)
                const tagMatch = comp.css.match(/Tags:\s*([^\n*]+)/i);
                const tags = tagMatch ? tagMatch[1].split(',').map(t => t.trim().toLowerCase()) : [];
                const fitScore = scoreComponentFit(comp.css, tags, constraints);
                return fitScore !== -1; // reject forbidden components
              });
            }
          }

          const remaining = maxPerCategory - localResults.length;
          if (filtered.length > 0) {
            allComponents.push(...filtered.slice(0, remaining));
            if (!categoriesSearched.includes(category)) {
              categoriesSearched.push(category);
            }
          }
        } catch (githubError) {
          // GitHub is optional — local results are sufficient
          const msg = `GitHub supplement skipped for "${category}": ${githubError instanceof Error ? githubError.message : String(githubError)}`;
          errors.push(msg);
        }
      }

      if (localResults.length === 0 && !categoriesSearched.includes(category)) {
        errors.push(`No components found for category: ${category}`);
      }
    } catch (error) {
      const errorMsg = `Error searching category "${category}": ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  // Sort all results by animation score
  allComponents.sort((a, b) => b.animationScore - a.animationScore);

  // Generate summary
  const localCount = allComponents.filter(c => c.source === 'local-registry').length;
  const githubCount = allComponents.filter(c => c.source === 'uiverse-github').length;
  let summary = `Discovered ${allComponents.length} components across ${categoriesSearched.length} categories (${localCount} local, ${githubCount} GitHub).`;

  if (preferAnimated) {
    const animatedCount = allComponents.filter(c => c.hasAnimations).length;
    summary += ` ${animatedCount} include CSS animations (preferred).`;
  }

  if (searchQuery) {
    summary += ` Filtered by keyword: "${searchQuery}".`;
  }

  if (industry || tone) {
    const styleLabel = [industry, tone].filter(Boolean).join('/');
    summary += ` Style-filtered for ${styleLabel} (incompatible components excluded).`;
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
