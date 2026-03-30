/**
 * Section Pattern Classifier
 *
 * Maps ANY section name to a structural rendering pattern.
 * This allows the system to render unknown section types with
 * rich, appropriate HTML instead of a generic <h2> + <p> fallback.
 *
 * Used by: generate-section.ts (renderer selection) and generate-content.ts (content selection)
 */

export type SectionPattern =
  | 'grid'
  | 'detail'
  | 'gallery'
  | 'review'
  | 'form'
  | 'list'
  | 'stats'
  | 'nav'
  | 'hero'
  | 'pricing'
  | 'faq'
  | 'cta'
  | 'table';

/**
 * Explicit overrides for known section types where keyword matching
 * would be ambiguous or incorrect. Checked first before keyword scoring.
 */
const EXPLICIT_PATTERN: Record<string, SectionPattern> = {
  // E-commerce
  'product-gallery': 'gallery',
  'product-info': 'detail',
  'reviews': 'review',
  'related-products': 'grid',
  'cart-items': 'table',
  'cart-summary': 'detail',
  'recommended': 'grid',
  'filters': 'nav',
  'pagination': 'nav',
  'checkout-form': 'form',
  'order-summary': 'detail',
  'order-review': 'detail',
  'shipping-form': 'form',
  'payment-form': 'form',

  // Corporate
  'mission-values': 'list',
  'company-story': 'detail',
  'case-studies': 'grid',
  'office-locations': 'list',

  // Blog
  'article-content': 'detail',
  'author-bio': 'detail',
  'related-posts': 'grid',
  'comments': 'review',
  'social-links': 'list',

  // SaaS
  'feature-comparison': 'table',
  'support-info': 'faq',

  // Dashboard
  'user-table': 'table',
  'quick-actions': 'stats',
  'recent-activity': 'list',
  'chart-grid': 'stats',
  'date-range': 'nav',
  'export': 'nav',
  'profile-form': 'form',
  'preferences': 'form',
  'notifications': 'list',
  'security': 'form',
  'search': 'form',
  'sidebar': 'nav',

  // Portfolio
  'bio': 'detail',
  'experience': 'list',
  'skills': 'stats',

  // General
  'mission': 'detail',
  'values': 'list',
  'milestones': 'list',
  'process': 'list',
  'deals': 'cta',
  'special-offers': 'cta',

  // Fitness / Gym
  'class-schedule': 'grid',
  'schedule-grid': 'grid',
  'membership-pricing': 'pricing',
  'trainer-grid': 'grid',
  'workout-programs': 'grid',

  // Wellness / Salon / Spa
  'service-menu': 'grid',
  'treatment-list': 'grid',
  'treatment-grid': 'grid',
  'stylist-grid': 'grid',
  'appointment-form': 'form',

  // Hospitality / Hotel
  'room-types': 'grid',
  'room-grid': 'grid',
  'amenities': 'list',
  'check-in-form': 'form',

  // Entertainment / Cinema
  'showtimes': 'grid',
  'event-calendar': 'grid',
  'now-showing': 'grid',
  'screenings': 'grid',
};

/**
 * Keyword → pattern scoring rules.
 * Each keyword awards points to a pattern when found in the section name.
 * Higher score wins. Ordered by specificity (more specific keywords first).
 */
const KEYWORD_RULES: Array<{ keywords: string[]; pattern: SectionPattern; score: number }> = [
  // Gallery — must come before "grid" since "photo-grid" should be gallery
  { keywords: ['gallery', 'photo', 'lightbox', 'images', 'slideshow'], pattern: 'gallery', score: 10 },

  // Review
  { keywords: ['review', 'comment', 'feedback', 'rating', 'testimonial'], pattern: 'review', score: 10 },

  // Form
  { keywords: ['form', 'reservation', 'booking', 'profile', 'preferences', 'security', 'register', 'login', 'signup', 'appointment', 'check-in'], pattern: 'form', score: 10 },

  // Nav
  { keywords: ['pagination', 'filter', 'sidebar', 'breadcrumb', 'tab', 'date-range', 'export', 'sort', 'toolbar'], pattern: 'nav', score: 10 },

  // Table
  { keywords: ['table', 'cart-item', 'cart-summary', 'order', 'inventory', 'comparison', 'spreadsheet'], pattern: 'table', score: 10 },

  // Stats
  { keywords: ['stats', 'metric', 'analytics', 'overview', 'kpi', 'dashboard', 'counter'], pattern: 'stats', score: 8 },

  // List
  { keywords: ['process', 'milestone', 'experience', 'skills', 'steps', 'timeline', 'roadmap', 'history', 'journey', 'values', 'locations'], pattern: 'list', score: 8 },

  // Detail
  { keywords: ['info', 'detail', 'story', 'bio', 'article', 'content', 'about', 'mission', 'description', 'summary', 'specification'], pattern: 'detail', score: 7 },

  // Grid — broad catch-all for card-based sections
  { keywords: ['grid', 'products', 'cards', 'projects', 'posts', 'items', 'recommended', 'related', 'featured', 'case-stud', 'blog', 'portfolio', 'team-grid', 'service-grid', 'schedule', 'classes', 'trainers', 'rooms', 'treatments', 'showtimes', 'events', 'programs'], pattern: 'grid', score: 6 },

  // Pricing
  { keywords: ['pricing', 'plan', 'tier', 'package', 'subscription', 'membership'], pattern: 'pricing', score: 10 },

  // FAQ
  { keywords: ['faq', 'help', 'support', 'question', 'knowledge-base'], pattern: 'faq', score: 10 },

  // CTA
  { keywords: ['cta', 'deal', 'offer', 'promo', 'banner', 'subscribe', 'newsletter', 'signup-banner'], pattern: 'cta', score: 7 },

  // Hero
  { keywords: ['hero', 'landing', 'splash', 'jumbotron', 'masthead'], pattern: 'hero', score: 10 },
];

/**
 * Classify a section type string into a structural rendering pattern.
 *
 * Resolution order:
 * 1. Explicit override map (exact match)
 * 2. Keyword scoring (highest score wins)
 * 3. Default fallback: 'grid' (most versatile pattern)
 */
export function classifySection(sectionType: string): SectionPattern {
  const normalized = sectionType.toLowerCase().trim();

  // 1. Check explicit overrides first
  if (EXPLICIT_PATTERN[normalized]) {
    return EXPLICIT_PATTERN[normalized];
  }

  // 2. Score each pattern by keyword matches
  let bestPattern: SectionPattern = 'grid'; // default fallback
  let bestScore = 0;

  for (const rule of KEYWORD_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (normalized.includes(kw) || kw.includes(normalized)) {
        // Exact match gets bonus
        score += (normalized === kw) ? rule.score * 2 : rule.score;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestPattern = rule.pattern;
    }
  }

  return bestPattern;
}

/**
 * Maps a structural pattern to an appropriate content generator section type.
 * Used by generate-content.ts to pick content when a section type has no
 * direct content generator.
 *
 * @param pattern - The classified structural pattern
 * @param businessModel - The business model (product, service, saas, venue)
 * @returns A section type that has a known content generator
 */
export function getContentFallbackForPattern(
  pattern: SectionPattern,
  businessModel: string
): string {
  const isProduct = businessModel === 'product';

  const PATTERN_CONTENT_MAP: Record<SectionPattern, string> = {
    'grid': isProduct ? 'product-grid' : 'features',
    'detail': 'about',
    'gallery': 'features',
    'review': 'testimonials',
    'form': 'features',       // form renderer handles UI; content provides field labels
    'list': 'how-it-works',
    'stats': 'features',
    'nav': 'features',        // nav renderer handles UI; content is minimal
    'pricing': 'pricing',
    'faq': 'faq',
    'cta': 'cta',
    'hero': 'hero',
    'table': isProduct ? 'product-grid' : 'features',
  };

  return PATTERN_CONTENT_MAP[pattern] || 'features';
}
