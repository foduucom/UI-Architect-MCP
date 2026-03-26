/**
 * MCP Tool: analyze_project
 *
 * Phase 1 — Senior Project Manager Analysis
 *
 * Analyzes user requirements and produces a structured project scope.
 * Identifies ambiguities and generates clarifying questions.
 * This is the FIRST tool that should be called in the pipeline.
 */

import type { Industry, Tone, Framework } from '../engine/types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnalyzeProjectInput {
  description: string;
  audience?: string;
  industry?: string;
  framework?: string;
  pageCount?: number;
  /** Brand/company name — propagated to navigation, footer, and content */
  brandName?: string;
  /** Explicit page names — overrides auto-detected template pages.
   *  Example: ["Home", "About", "Menu", "Contact"] */
  pageNames?: string[];
}

export interface PageDefinition {
  name: string;
  slug: string;
  sections: string[];
  isHomepage: boolean;
  description: string;
}

export interface ProjectScope {
  projectType: string;
  industry: Industry;
  tone: Tone;
  targetAudience: string;
  framework: Framework;
  pages: PageDefinition[];
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  features: string[];
  accessibilityLevel: 'AA' | 'AAA';
  responsiveBreakpoints: string[];
  browserSupport: string;
  /** Brand/company name — propagated throughout the pipeline */
  brandName?: string;
}

export interface AnalyzeProjectOutput {
  scope: ProjectScope;
  clarifyingQuestions: string[];
  riskAssessment: string[];
  summary: string;
  needsClarification: boolean;
}

// ─── Page Type Detection ────────────────────────────────────────────────────

const PAGE_TYPE_KEYWORDS: Record<string, { sections: string[]; pages: PageDefinition[] }> = {
  'landing': {
    sections: ['hero', 'features', 'testimonials', 'pricing', 'cta', 'faq', 'footer'],
    pages: [
      {
        name: 'Home',
        slug: 'index',
        sections: ['hero', 'features', 'testimonials', 'pricing', 'cta', 'faq'],
        isHomepage: true,
        description: 'Main landing page with all key sections',
      },
    ],
  },
  'ecommerce': {
    sections: ['hero', 'featured-products', 'categories', 'testimonials', 'newsletter', 'footer'],
    pages: [
      {
        name: 'Home',
        slug: 'index',
        sections: ['hero', 'featured-products', 'categories', 'testimonials', 'newsletter'],
        isHomepage: true,
        description: 'Storefront with featured products and categories',
      },
      {
        name: 'Products',
        slug: 'products',
        sections: ['product-grid', 'filters', 'pagination'],
        isHomepage: false,
        description: 'Product listing with filters and search',
      },
      {
        name: 'Product Detail',
        slug: 'product-detail',
        sections: ['product-gallery', 'product-info', 'reviews', 'related-products'],
        isHomepage: false,
        description: 'Single product view with gallery and reviews',
      },
      {
        name: 'Cart',
        slug: 'cart',
        sections: ['cart-items', 'cart-summary', 'recommended'],
        isHomepage: false,
        description: 'Shopping cart with item management',
      },
      {
        name: 'Contact',
        slug: 'contact',
        sections: ['contact-form', 'map', 'info'],
        isHomepage: false,
        description: 'Contact page with form and company info',
      },
    ],
  },
  'portfolio': {
    sections: ['hero', 'about', 'projects', 'skills', 'testimonials', 'contact', 'footer'],
    pages: [
      {
        name: 'Home',
        slug: 'index',
        sections: ['hero', 'about', 'featured-projects', 'skills'],
        isHomepage: true,
        description: 'Personal/agency showcase with featured work',
      },
      {
        name: 'Projects',
        slug: 'projects',
        sections: ['project-grid', 'filters'],
        isHomepage: false,
        description: 'All projects with category filters',
      },
      {
        name: 'About',
        slug: 'about',
        sections: ['bio', 'experience', 'skills', 'testimonials'],
        isHomepage: false,
        description: 'Detailed about page with experience',
      },
      {
        name: 'Contact',
        slug: 'contact',
        sections: ['contact-form', 'social-links'],
        isHomepage: false,
        description: 'Contact form with social media links',
      },
    ],
  },
  'saas': {
    sections: ['hero', 'features', 'how-it-works', 'pricing', 'testimonials', 'faq', 'cta', 'footer'],
    pages: [
      {
        name: 'Home',
        slug: 'index',
        sections: ['hero', 'features', 'how-it-works', 'testimonials', 'cta'],
        isHomepage: true,
        description: 'SaaS product landing with feature showcase',
      },
      {
        name: 'Pricing',
        slug: 'pricing',
        sections: ['pricing-table', 'feature-comparison', 'faq'],
        isHomepage: false,
        description: 'Pricing plans with feature comparison',
      },
      {
        name: 'About',
        slug: 'about',
        sections: ['mission', 'team', 'values'],
        isHomepage: false,
        description: 'Company story and team',
      },
      {
        name: 'Contact',
        slug: 'contact',
        sections: ['contact-form', 'support-info'],
        isHomepage: false,
        description: 'Contact and support page',
      },
    ],
  },
  'blog': {
    sections: ['hero', 'featured-posts', 'categories', 'newsletter', 'footer'],
    pages: [
      {
        name: 'Home',
        slug: 'index',
        sections: ['hero', 'featured-posts', 'categories', 'newsletter'],
        isHomepage: true,
        description: 'Blog homepage with featured articles',
      },
      {
        name: 'Blog',
        slug: 'blog',
        sections: ['post-grid', 'sidebar', 'pagination'],
        isHomepage: false,
        description: 'All posts with search and categories',
      },
      {
        name: 'Post',
        slug: 'post',
        sections: ['article-content', 'author-bio', 'related-posts', 'comments'],
        isHomepage: false,
        description: 'Single article view',
      },
      {
        name: 'About',
        slug: 'about',
        sections: ['bio', 'newsletter'],
        isHomepage: false,
        description: 'Author/publication about page',
      },
    ],
  },
  'dashboard': {
    sections: ['sidebar', 'header', 'stats', 'charts', 'tables', 'activity-feed'],
    pages: [
      {
        name: 'Dashboard',
        slug: 'index',
        sections: ['stats-cards', 'charts', 'recent-activity', 'quick-actions'],
        isHomepage: true,
        description: 'Main dashboard with KPIs and charts',
      },
      {
        name: 'Analytics',
        slug: 'analytics',
        sections: ['chart-grid', 'date-range', 'export'],
        isHomepage: false,
        description: 'Detailed analytics with date filtering',
      },
      {
        name: 'Settings',
        slug: 'settings',
        sections: ['profile-form', 'preferences', 'notifications', 'security'],
        isHomepage: false,
        description: 'User settings and preferences',
      },
      {
        name: 'Users',
        slug: 'users',
        sections: ['user-table', 'search', 'filters', 'pagination'],
        isHomepage: false,
        description: 'User management table',
      },
    ],
  },
  'corporate': {
    sections: ['hero', 'services', 'about', 'team', 'testimonials', 'clients', 'contact', 'footer'],
    pages: [
      {
        name: 'Home',
        slug: 'index',
        sections: ['hero', 'services', 'about-preview', 'clients', 'testimonials', 'cta'],
        isHomepage: true,
        description: 'Corporate homepage with services and credibility',
      },
      {
        name: 'About',
        slug: 'about',
        sections: ['company-story', 'mission-values', 'team', 'milestones'],
        isHomepage: false,
        description: 'Company history and team',
      },
      {
        name: 'Services',
        slug: 'services',
        sections: ['services-grid', 'process', 'case-studies'],
        isHomepage: false,
        description: 'Detailed services and methodology',
      },
      {
        name: 'Contact',
        slug: 'contact',
        sections: ['contact-form', 'office-locations', 'map'],
        isHomepage: false,
        description: 'Contact with office locations',
      },
    ],
  },
  'restaurant': {
    sections: ['hero', 'menu-preview', 'about', 'gallery', 'testimonials', 'reservation', 'footer'],
    pages: [
      {
        name: 'Home',
        slug: 'index',
        sections: ['hero', 'menu-preview', 'about', 'gallery', 'testimonials'],
        isHomepage: true,
        description: 'Restaurant landing with ambiance and menu preview',
      },
      {
        name: 'Menu',
        slug: 'menu',
        sections: ['menu-categories', 'menu-items', 'specials'],
        isHomepage: false,
        description: 'Full menu with categories',
      },
      {
        name: 'Reservation',
        slug: 'reservation',
        sections: ['reservation-form', 'hours', 'location'],
        isHomepage: false,
        description: 'Table reservation with hours and map',
      },
      {
        name: 'Gallery',
        slug: 'gallery',
        sections: ['photo-grid', 'lightbox'],
        isHomepage: false,
        description: 'Photo gallery of food and venue',
      },
    ],
  },
};

// ─── Industry Detection ─────────────────────────────────────────────────────

const VALID_INDUSTRIES: Industry[] = [
  'finance',
  'healthcare',
  'technology',
  'ecommerce',
  'education',
  'food',
  'realestate',
  'legal',
  'creative',
  'environmental',
  'gaming',
  'nonprofit',
  'luxury',
  'startup',
  'corporate',
];

const INDUSTRY_KEYWORDS: Record<string, Industry> = {
  fintech: 'finance',
  banking: 'finance',
  finance: 'finance',
  insurance: 'finance',
  payment: 'finance',
  investment: 'finance',
  trading: 'finance',
  crypto: 'finance',
  health: 'healthcare',
  medical: 'healthcare',
  pharma: 'healthcare',
  hospital: 'healthcare',
  clinic: 'healthcare',
  dental: 'healthcare',
  wellness: 'healthcare',
  therapy: 'healthcare',
  saas: 'technology',
  tech: 'technology',
  software: 'technology',
  ai: 'technology',
  devtools: 'technology',
  api: 'technology',
  cloud: 'technology',
  app: 'technology',
  ecommerce: 'ecommerce',
  shop: 'ecommerce',
  store: 'ecommerce',
  marketplace: 'ecommerce',
  retail: 'ecommerce',
  product: 'ecommerce',
  fashion: 'luxury',
  education: 'education',
  edtech: 'education',
  school: 'education',
  university: 'education',
  course: 'education',
  learning: 'education',
  tutoring: 'education',
  restaurant: 'food',
  cafe: 'food',
  bakery: 'food',
  food: 'food',
  catering: 'food',
  bar: 'food',
  pizza: 'food',
  sushi: 'food',
  realestate: 'realestate',
  property: 'realestate',
  housing: 'realestate',
  realtor: 'realestate',
  legal: 'legal',
  law: 'legal',
  attorney: 'legal',
  lawyer: 'legal',
  creative: 'creative',
  agency: 'creative',
  design: 'creative',
  photography: 'creative',
  portfolio: 'creative',
  freelance: 'creative',
  studio: 'creative',
  artist: 'creative',
  environmental: 'environmental',
  eco: 'environmental',
  sustainability: 'environmental',
  green: 'environmental',
  solar: 'environmental',
  climate: 'environmental',
  gaming: 'gaming',
  esports: 'gaming',
  game: 'gaming',
  entertainment: 'gaming',
  nonprofit: 'nonprofit',
  ngo: 'nonprofit',
  charity: 'nonprofit',
  foundation: 'nonprofit',
  donation: 'nonprofit',
  volunteer: 'nonprofit',
  luxury: 'luxury',
  premium: 'luxury',
  jewelry: 'luxury',
  watches: 'luxury',
  boutique: 'luxury',
  highend: 'luxury',
  startup: 'startup',
  corporate: 'corporate',
  enterprise: 'corporate',
  b2b: 'corporate',
  business: 'corporate',
  firm: 'corporate',
  fitness: 'fitness',
  gym: 'fitness',
  trainer: 'fitness',
  'personal training': 'fitness',
  workout: 'fitness',
  crossfit: 'fitness',
  bodybuilding: 'fitness',
  coaching: 'coaching',
  coach: 'coaching',
  mentor: 'coaching',
  'life coach': 'coaching',
  consulting: 'consulting',
  consultant: 'consulting',
  advisory: 'consulting',
};

// ─── Tone Detection ─────────────────────────────────────────────────────────

const VALID_TONES: Tone[] = [
  'corporate',
  'modern',
  'playful',
  'minimal',
  'luxury',
  'technical',
  'warm',
  'bold',
  'elegant',
];

const TONE_KEYWORDS: Record<string, Tone> = {
  professional: 'corporate',
  formal: 'corporate',
  corporate: 'corporate',
  serious: 'corporate',
  modern: 'modern',
  clean: 'modern',
  fresh: 'modern',
  contemporary: 'modern',
  fun: 'playful',
  playful: 'playful',
  vibrant: 'playful',
  colorful: 'playful',
  friendly: 'playful',
  minimal: 'minimal',
  simple: 'minimal',
  minimalist: 'minimal',
  sleek: 'minimal',
  luxury: 'luxury',
  premium: 'luxury',
  upscale: 'luxury',
  exclusive: 'luxury',
  'high-end': 'luxury',
  technical: 'technical',
  developer: 'technical',
  engineering: 'technical',
  code: 'technical',
  warm: 'warm',
  cozy: 'warm',
  inviting: 'warm',
  homey: 'warm',
  welcoming: 'warm',
  bold: 'bold',
  edgy: 'bold',
  striking: 'bold',
  aggressive: 'bold',
  powerful: 'bold',
  elegant: 'elegant',
  sophisticated: 'elegant',
  refined: 'elegant',
  classy: 'elegant',
  graceful: 'elegant',
};

// ─── Framework Detection ────────────────────────────────────────────────────

const VALID_FRAMEWORKS: Framework[] = ['html', 'react', 'nextjs', 'vue', 'nuxt', 'angular', 'svelte', 'astro'];

const FRAMEWORK_KEYWORDS: Record<string, Framework> = {
  html: 'html',
  vanilla: 'html',
  'html/css': 'html',
  plain: 'html',
  static: 'html',
  react: 'react',
  reactjs: 'react',
  jsx: 'react',
  next: 'nextjs',
  nextjs: 'nextjs',
  'next.js': 'nextjs',
  vue: 'vue',
  vuejs: 'vue',
  'vue.js': 'vue',
  nuxt: 'nuxt',
  nuxtjs: 'nuxt',
  'nuxt.js': 'nuxt',
  angular: 'angular',
  ng: 'angular',
  svelte: 'svelte',
  sveltekit: 'svelte',
  astro: 'astro',
};

// ─── Utility Functions ──────────────────────────────────────────────────────

function detectFromKeywords<T>(text: string, keywordMap: Record<string, T>): T | null {
  const lower = text.toLowerCase();
  for (const [keyword, value] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) {
      return value;
    }
  }
  return null;
}

function detectPageType(text: string): string {
  const lower = text.toLowerCase();

  // Scoring-based classification — highest score wins
  const scores: Record<string, number> = {
    ecommerce: 0, portfolio: 0, blog: 0, restaurant: 0,
    dashboard: 0, saas: 0, corporate: 0, landing: 0,
  };

  // Ecommerce — needs explicit commerce intent, not just "product"
  if (lower.includes('shop') || lower.includes('store') || lower.includes('ecommerce') || lower.includes('e-commerce')) scores.ecommerce += 3;
  if (lower.includes('catalog') || lower.includes('cart') || lower.includes('checkout') || lower.includes('inventory')) scores.ecommerce += 2;
  if (lower.includes('product') && (lower.includes('sell') || lower.includes('buy') || lower.includes('price') || lower.includes('order'))) scores.ecommerce += 2;

  // Corporate / Service company
  if (lower.includes('company') || lower.includes('business') || lower.includes('firm')) scores.corporate += 3;
  if (lower.includes('service') || lower.includes('consulting') || lower.includes('agency') || lower.includes('provider')) scores.corporate += 3;
  if (lower.includes('corporate') || lower.includes('enterprise') || lower.includes('solutions')) scores.corporate += 2;
  if (lower.includes('team') || lower.includes('about us') || lower.includes('our mission')) scores.corporate += 1;
  // "product" without commerce context mildly boosts corporate (companies have products)
  if (lower.includes('product') && !lower.includes('shop') && !lower.includes('store') && !lower.includes('cart')) scores.corporate += 1;

  // SaaS
  if (lower.includes('saas') || lower.includes('platform') || lower.includes('subscription')) scores.saas += 3;
  if (lower.includes('software') || lower.includes('app') || lower.includes('dashboard')) scores.saas += 2;
  if (lower.includes('free trial') || lower.includes('sign up') || lower.includes('pricing plan')) scores.saas += 2;
  if (lower.includes('tool') && !lower.includes('restaurant')) scores.saas += 1;

  // Portfolio
  if (lower.includes('portfolio') || lower.includes('freelance') || lower.includes('showcase')) scores.portfolio += 3;
  if (lower.includes('work samples') || lower.includes('case study') || lower.includes('gallery')) scores.portfolio += 1;

  // Blog
  if (lower.includes('blog') || lower.includes('article') || lower.includes('magazine') || lower.includes('publication')) scores.blog += 3;

  // Restaurant
  if (lower.includes('restaurant') || lower.includes('cafe') || lower.includes('food') || lower.includes('dining')) scores.restaurant += 3;
  if (lower.includes('menu') || lower.includes('reservation') || lower.includes('cuisine')) scores.restaurant += 2;

  // Dashboard
  if (lower.includes('admin') || lower.includes('dashboard') || lower.includes('panel') || lower.includes('analytics')) {
    if (!lower.includes('shop') && !lower.includes('store')) scores.dashboard += 3;
  }

  // Find highest score
  let best = 'landing';
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }

  // If no strong signal, try keyword map fallback
  if (bestScore === 0) {
    const types = Object.keys(PAGE_TYPE_KEYWORDS);
    for (const type of types) {
      if (lower.includes(type)) return type;
    }
  }

  return best;
}

function detectFeatures(text: string): string[] {
  const features: string[] = [];
  const lower = text.toLowerCase();

  if (
    lower.includes('dark mode') ||
    lower.includes('dark/light') ||
    lower.includes('theme toggle')
  )
    features.push('dark-mode-toggle');
  if (
    lower.includes('form') ||
    lower.includes('contact') ||
    lower.includes('sign up') ||
    lower.includes('login')
  )
    features.push('forms');
  if (lower.includes('animation') || lower.includes('animated') || lower.includes('motion'))
    features.push('rich-animations');
  if (lower.includes('responsive') || lower.includes('mobile')) features.push('responsive');
  if (lower.includes('search')) features.push('search');
  if (lower.includes('filter')) features.push('filters');
  if (lower.includes('modal') || lower.includes('popup') || lower.includes('dialog')) features.push('modals');
  if (lower.includes('slider') || lower.includes('carousel')) features.push('carousel');
  if (lower.includes('map') || lower.includes('location')) features.push('map-integration');
  if (lower.includes('gallery') || lower.includes('lightbox')) features.push('image-gallery');
  if (lower.includes('video')) features.push('video-embed');
  if (lower.includes('testimonial') || lower.includes('review')) features.push('testimonials');
  if (lower.includes('pricing')) features.push('pricing-table');
  if (lower.includes('blog') || lower.includes('article')) features.push('blog-system');
  if (lower.includes('newsletter') || lower.includes('subscribe')) features.push('newsletter');
  if (lower.includes('social')) features.push('social-links');
  if (lower.includes('notification')) features.push('notifications');
  if (lower.includes('chart') || lower.includes('graph') || lower.includes('analytics')) features.push('data-visualization');

  // Always include these
  if (!features.includes('responsive')) features.push('responsive');
  if (!features.includes('rich-animations')) features.push('rich-animations');
  if (!features.includes('accessibility')) features.push('accessibility');

  return Array.from(new Set(features));
}

/**
 * Infers reasonable sections for a page name when the user provides custom page names
 * that don't match any template. Uses the page name + project type for context.
 */
function inferSectionsForPage(pageName: string, projectType: string, isHomepage: boolean): string[] {
  const lower = pageName.toLowerCase();

  // Homepage always gets hero + key sections
  if (isHomepage || lower === 'home' || lower === 'landing') {
    return ['hero', 'features', 'testimonials', 'cta'];
  }

  // Common page name patterns
  if (lower === 'about' || lower === 'about us' || lower === 'story') {
    return ['about', 'team', 'stats'];
  }
  if (lower === 'contact' || lower === 'contact us' || lower === 'get in touch') {
    return ['contact-form', 'location', 'hours'];
  }
  if (lower === 'menu' || lower === 'our menu' || lower === 'food menu') {
    return ['menu-categories', 'menu-items', 'specials'];
  }
  if (lower === 'services' || lower === 'our services') {
    return ['services-grid', 'how-it-works', 'cta'];
  }
  if (lower === 'pricing' || lower === 'plans') {
    return ['pricing', 'faq', 'cta'];
  }
  if (lower === 'gallery' || lower === 'photos' || lower === 'portfolio') {
    return ['gallery', 'photo-grid'];
  }
  if (lower === 'blog' || lower === 'articles' || lower === 'news') {
    return ['blog-grid', 'newsletter'];
  }
  if (lower === 'team' || lower === 'our team') {
    return ['team', 'about'];
  }
  if (lower === 'faq' || lower === 'help') {
    return ['faq', 'contact-form'];
  }
  if (lower === 'reservation' || lower === 'book' || lower === 'booking') {
    return ['reservation-form', 'hours', 'location'];
  }
  if (lower === 'products' || lower === 'shop' || lower === 'store') {
    return ['product-grid', 'newsletter'];
  }
  if (lower === 'testimonials' || lower === 'reviews') {
    return ['testimonials', 'cta'];
  }

  // Fallback: generic sections
  return ['hero', 'features', 'cta'];
}

function estimateComplexity(
  pages: PageDefinition[],
  features: string[]
): 'simple' | 'medium' | 'complex' | 'enterprise' {
  const totalSections = pages.reduce((acc, p) => acc + p.sections.length, 0);

  if (pages.length <= 1 && totalSections <= 5) return 'simple';
  if (pages.length <= 3 && totalSections <= 15) return 'medium';
  if (pages.length <= 6 && totalSections <= 30) return 'complex';
  return 'enterprise';
}

function generateClarifyingQuestions(
  description: string,
  detectedIndustry: Industry | null,
  detectedFramework: Framework | null,
  detectedPageType: string,
  pages: PageDefinition[]
): string[] {
  const decisions: string[] = [];
  const lower = description.toLowerCase();

  if (!lower.includes('color') && !lower.includes('brand') && !lower.includes('#')) {
    decisions.push(
      `No brand colors specified — a palette will be auto-generated based on the detected industry. Override: pass "brandColor" parameter to design_theme.`
    );
  }

  if (!detectedFramework) {
    decisions.push(
      `No framework specified — defaulting to vanilla HTML/CSS/JS. Override: pass "framework" parameter.`
    );
  }

  if (pages.length > 1 && !lower.includes('page') && !lower.includes('multi')) {
    decisions.push(
      `Auto-planned ${pages.length} pages (${pages.map((p) => p.name).join(', ')}). Override: pass "pageNames" or "pageCount" to customize.`
    );
  }

  if (!lower.includes('content') && !lower.includes('copy') && !lower.includes('text')) {
    decisions.push(
      `No content provided — realistic placeholder text will be generated. Override: call generate_content before generate_full_page.`
    );
  }

  if (lower.includes('dashboard') && !lower.includes('chart') && !lower.includes('data')) {
    decisions.push('Dashboard detected without data context — defaulting to generic analytics metrics. Specify data types in the description to customize.');
  }

  if (detectedPageType === 'ecommerce' && !lower.includes('product')) {
    decisions.push('E-commerce site detected without product details — using generic product categories. Specify products in the description to customize.');
  }

  return decisions;
}

// ─── Main Tool Function ─────────────────────────────────────────────────────

export function analyzeProject(input: AnalyzeProjectInput): AnalyzeProjectOutput {
  const description = input.description;

  // Detect industry — explicit param takes priority, then description, then fallback
  let detectedIndustry: Industry;
  if (input.industry) {
    detectedIndustry =
      detectFromKeywords(input.industry, INDUSTRY_KEYWORDS) ||
      (input.industry.toLowerCase().trim() as Industry);
  } else {
    detectedIndustry =
      detectFromKeywords(description, INDUSTRY_KEYWORDS) ||
      ('technology' as Industry);
  }

  const detectedTone =
    detectFromKeywords(description, TONE_KEYWORDS) ||
    (detectedIndustry === 'corporate'
      ? ('corporate' as Tone)
      : detectedIndustry === 'luxury'
        ? ('elegant' as Tone)
        : detectedIndustry === 'gaming'
          ? ('bold' as Tone)
          : detectedIndustry === 'food'
            ? ('warm' as Tone)
            : detectedIndustry === 'healthcare'
              ? ('modern' as Tone)
              : ('modern' as Tone));

  const detectedFramework =
    (input.framework ? detectFromKeywords(input.framework, FRAMEWORK_KEYWORDS) : null) ||
    detectFromKeywords(description, FRAMEWORK_KEYWORDS) ||
    null;

  const pageType = detectPageType(description);
  const pageTemplate = PAGE_TYPE_KEYWORDS[pageType] || PAGE_TYPE_KEYWORDS['landing'];

  // Use explicit page names if provided; otherwise use detected template pages
  let pages: PageDefinition[];

  if (input.pageNames && input.pageNames.length > 0) {
    // User specified exact page names — build pages from those
    pages = input.pageNames.map((name, index) => {
      const slug = index === 0 ? 'index' : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      // Try to match sections from template pages with similar names
      const templateMatch = pageTemplate.pages.find(
        (tp) => tp.name.toLowerCase() === name.toLowerCase() || tp.slug === slug
      );
      // Infer sections from the page name if no template match
      const inferredSections = inferSectionsForPage(name, pageType, index === 0);
      return {
        name,
        slug,
        sections: templateMatch ? templateMatch.sections : inferredSections,
        isHomepage: index === 0,
        description: templateMatch ? templateMatch.description : `${name} page`,
      };
    });
  } else {
    pages = [...pageTemplate.pages];
    if (input.pageCount && input.pageCount < pages.length) {
      pages = pages.slice(0, input.pageCount);
    }
  }

  const featuresArray = detectFeatures(description);
  const features = Array.from(new Set(featuresArray));
  const complexity = estimateComplexity(pages, features);

  const clarifyingQuestions = generateClarifyingQuestions(
    description,
    detectedIndustry,
    detectedFramework,
    pageType,
    pages
  );

  // Risk assessment
  const risks: string[] = [];
  if (complexity === 'enterprise') {
    risks.push('SCOPE: Enterprise-level project with many pages — consider phased delivery.');
  }
  if (features.includes('data-visualization')) {
    risks.push('PERFORMANCE: Charts/graphs may need a library (Chart.js, Recharts) — adds bundle size.');
  }
  if (features.includes('map-integration')) {
    risks.push('DEPENDENCY: Map integration requires an external API key (Google Maps, Mapbox).');
  }
  if (pages.length > 4) {
    risks.push('NAVIGATION: With many pages, ensure the navigation system is clear and well-structured.');
  }
  if (features.includes('carousel')) {
    risks.push('ACCESSIBILITY: Carousels need careful keyboard/screen-reader handling.');
  }
  if (detectedFramework === 'html' && pages.length > 1) {
    risks.push(
      'MAINTENANCE: Multi-page vanilla HTML means duplicated navigation/footer code across files. Consider using a templating system or framework for DRY code.'
    );
  }

  const scope: ProjectScope = {
    projectType: pageType,
    industry: detectedIndustry,
    tone: detectedTone,
    targetAudience: input.audience || 'General audience',
    framework: detectedFramework || 'html',
    pages,
    complexity,
    features,
    accessibilityLevel: 'AA',
    responsiveBreakpoints: ['375px (mobile)', '768px (tablet)', '1024px (desktop)', '1280px (wide)'],
    browserSupport: 'Modern evergreen browsers + Safari 15+',
    brandName: input.brandName,
  };

  // Build summary
  const pageList = pages.map((p, i) => `${i + 1}. **${p.name}** (${p.slug}.html) — ${p.description}`).join('\n');
  const sectionsList = pages.map((p) => `- **${p.name}:** ${p.sections.join(', ')}`).join('\n');
  const featuresList = features.map((f) => `- ${f}`).join('\n');
  const riskList =
    risks.length > 0 ? risks.map((r) => `- ⚠️ ${r}`).join('\n') : '- ✅ No significant risks identified.';
  const questionsSection =
    clarifyingQuestions.length > 0
      ? `### Design Decisions\n${clarifyingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '### Ready to Proceed\nAll requirements are clear. Proceed to `plan_architecture` next.';

  const summary = `## Project Analysis Complete

**Project Type:** ${pageType.charAt(0).toUpperCase() + pageType.slice(1)} Website
**Industry:** ${(detectedIndustry as string).charAt(0).toUpperCase() + (detectedIndustry as string).slice(1)}
**Tone:** ${detectedTone.charAt(0).toUpperCase() + detectedTone.slice(1)}
**Framework:** ${detectedFramework || 'Not specified — will ask'}
**Complexity:** ${complexity.toUpperCase()}

### Pages Planned (${pages.length})
${pageList}

### Sections Per Page
${sectionsList}

### Features Detected
${featuresList}

### Risk Assessment
${riskList}

${questionsSection}`;

  return {
    scope,
    clarifyingQuestions,
    riskAssessment: risks,
    summary,
    needsClarification: clarifyingQuestions.length > 0,
  };
}
