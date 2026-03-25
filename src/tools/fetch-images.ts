/**
 * MCP Tool: fetch_images
 *
 * 3-Layer Image Resolution System:
 *   Layer 1: Unsplash API  (high-quality stock photos, needs UNSPLASH_ACCESS_KEY)
 *   Layer 2: Pexels API    (fallback stock photos, needs PEXELS_API_KEY)
 *   Layer 3: Lorem Picsum  (always works, zero config, real photos)
 *   Icons:   Lucide CDN    (always works, zero config, 1500+ SVG icons)
 *
 * Every section gets real images — hero photos, team portraits, feature icons,
 * testimonial avatars, gallery shots — matched to the project industry.
 */

// ─── Constants ──────────────────────────────────────────────────────────────

const LUCIDE_CDN = 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons';
const UNSPLASH_API = 'https://api.unsplash.com';
const PEXELS_API = 'https://api.pexels.com/v1';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ResolvedImage {
  url: string;
  alt: string;
  width: number;
  height: number;
  source: 'unsplash' | 'pexels' | 'picsum' | 'lucide';
  photographer?: string;
  photographerUrl?: string;
  sourceUrl?: string;
  isIcon: boolean;
  svgContent?: string;
}

export interface SectionImageRequest {
  sectionType: string;
  industry?: string;
  count?: number;
  keywords?: string[];
}

export interface FetchImagesInput {
  sections: SectionImageRequest[];
  industry?: string;
  preferIcons?: boolean;
}

export interface FetchImagesOutput {
  images: Record<string, ResolvedImage[]>;
  summary: string;
  totalImages: number;
  sources: Record<string, number>;
  attributions: string[];
}

// ─── Section → Image Strategy ───────────────────────────────────────────────

interface ImageStrategy {
  style: 'photo' | 'icon' | 'avatar' | 'background';
  defaultCount: number;
  width: number;
  height: number;
  searchTerms: (industry: string) => string[];
  altBase: string;
}

const SECTION_IMAGE_STRATEGY: Record<string, ImageStrategy> = {
  'hero': {
    style: 'photo', defaultCount: 1, width: 1200, height: 600,
    searchTerms: (i) => [`${i} professional modern`, `${i} technology business`, `${i} workspace`],
    altBase: 'Hero image',
  },
  'features': {
    style: 'icon', defaultCount: 6, width: 64, height: 64,
    searchTerms: () => ['technology', 'innovation'],
    altBase: 'Feature icon',
  },
  'team': {
    style: 'avatar', defaultCount: 4, width: 400, height: 400,
    searchTerms: () => ['professional headshot portrait', 'business person portrait'],
    altBase: 'Team member',
  },
  'testimonials': {
    style: 'avatar', defaultCount: 3, width: 80, height: 80,
    searchTerms: () => ['professional headshot', 'business portrait face'],
    altBase: 'Customer',
  },
  'about': {
    style: 'photo', defaultCount: 1, width: 800, height: 500,
    searchTerms: (i) => [`${i} team office`, `${i} company culture`, 'modern workplace'],
    altBase: 'About our company',
  },
  'services': {
    style: 'icon', defaultCount: 4, width: 64, height: 64,
    searchTerms: (i) => [`${i} service`],
    altBase: 'Service icon',
  },
  'pricing': {
    style: 'icon', defaultCount: 3, width: 48, height: 48,
    searchTerms: () => ['pricing plan'],
    altBase: 'Plan icon',
  },
  'gallery': {
    style: 'photo', defaultCount: 6, width: 600, height: 400,
    searchTerms: (i) => [`${i} portfolio`, `${i} project showcase`],
    altBase: 'Gallery image',
  },
  'product-grid': {
    style: 'photo', defaultCount: 6, width: 400, height: 400,
    searchTerms: (i) => [`${i} product`, 'product photography'],
    altBase: 'Product',
  },
  'featured-products': {
    style: 'photo', defaultCount: 3, width: 400, height: 400,
    searchTerms: (i) => [`${i} product`, 'featured product'],
    altBase: 'Featured product',
  },
  'clients': {
    style: 'icon', defaultCount: 6, width: 120, height: 40,
    searchTerms: () => ['company logo'],
    altBase: 'Client logo',
  },
  'blog': {
    style: 'photo', defaultCount: 3, width: 600, height: 400,
    searchTerms: (i) => [`${i} article`, `${i} blog`],
    altBase: 'Blog post cover',
  },
  'how-it-works': {
    style: 'icon', defaultCount: 3, width: 64, height: 64,
    searchTerms: () => ['process step'],
    altBase: 'Step icon',
  },
  'stats': {
    style: 'icon', defaultCount: 4, width: 48, height: 48,
    searchTerms: () => ['statistics'],
    altBase: 'Stat icon',
  },
  'cta': {
    style: 'background', defaultCount: 1, width: 1400, height: 400,
    searchTerms: (i) => [`${i} abstract`, 'gradient abstract'],
    altBase: 'Call to action background',
  },
  'contact-form': {
    style: 'photo', defaultCount: 1, width: 600, height: 400,
    searchTerms: (i) => [`${i} customer support`, 'contact office'],
    altBase: 'Contact us',
  },
  'newsletter': {
    style: 'icon', defaultCount: 1, width: 64, height: 64,
    searchTerms: () => ['email newsletter'],
    altBase: 'Newsletter icon',
  },
  'navigation': {
    style: 'icon', defaultCount: 0, width: 0, height: 0,
    searchTerms: () => [],
    altBase: '',
  },
  'navbar': {
    style: 'icon', defaultCount: 0, width: 0, height: 0,
    searchTerms: () => [],
    altBase: '',
  },
  'footer': {
    style: 'icon', defaultCount: 0, width: 0, height: 0,
    searchTerms: () => [],
    altBase: '',
  },
  'faq': {
    style: 'icon', defaultCount: 0, width: 0, height: 0,
    searchTerms: () => [],
    altBase: '',
  },
};

// ─── Keyword → Lucide Icon Map (200+ entries) ──────────────────────────────

const KEYWORD_ICON_MAP: Record<string, string> = {
  // Technology & Computing
  'technology': 'cpu',
  'computer': 'monitor',
  'code': 'code-2',
  'programming': 'terminal',
  'software': 'app-window',
  'hardware': 'hard-drive',
  'cloud': 'cloud',
  'server': 'server',
  'database': 'database',
  'api': 'plug',
  'ai': 'brain',
  'artificial intelligence': 'brain',
  'machine learning': 'brain-circuit',
  'automation': 'bot',
  'cybersecurity': 'shield-check',
  'security': 'lock',
  'privacy': 'eye-off',
  'encryption': 'key-round',
  'network': 'network',
  'wifi': 'wifi',
  'mobile': 'smartphone',
  'app': 'app-window',
  'web': 'globe',
  'website': 'globe',
  'search': 'search',
  'data': 'database',
  'storage': 'hard-drive',
  'backup': 'save',
  'download': 'download',
  'upload': 'upload',
  'sync': 'refresh-cw',
  'integration': 'plug-zap',
  'plugin': 'puzzle',

  // Business & Finance
  'money': 'dollar-sign',
  'finance': 'trending-up',
  'fintech': 'wallet',
  'payment': 'credit-card',
  'invoice': 'receipt',
  'budget': 'piggy-bank',
  'investment': 'trending-up',
  'banking': 'landmark',
  'stock': 'candlestick-chart',
  'crypto': 'bitcoin',
  'revenue': 'bar-chart-3',
  'profit': 'trending-up',
  'sales': 'shopping-cart',
  'marketing': 'megaphone',
  'advertising': 'megaphone',
  'analytics': 'bar-chart-3',
  'metrics': 'activity',
  'dashboard': 'layout-dashboard',
  'report': 'file-text',
  'business': 'briefcase',
  'enterprise': 'building-2',
  'startup': 'rocket',
  'company': 'building',
  'office': 'building-2',
  'corporate': 'building-2',

  // Communication
  'email': 'mail',
  'message': 'message-circle',
  'chat': 'message-square',
  'phone': 'phone',
  'call': 'phone-call',
  'video': 'video',
  'conference': 'users',
  'meeting': 'calendar',
  'notification': 'bell',
  'alert': 'bell-ring',
  'announcement': 'megaphone',
  'newsletter': 'mail-open',
  'inbox': 'inbox',
  'send': 'send',
  'share': 'share-2',
  'social': 'share-2',
  'community': 'users',
  'feedback': 'message-square-plus',
  'review': 'star',
  'rating': 'star',
  'comment': 'message-circle',

  // E-commerce
  'shopping': 'shopping-bag',
  'cart': 'shopping-cart',
  'store': 'store',
  'product': 'package',
  'order': 'clipboard-list',
  'shipping': 'truck',
  'delivery': 'truck',
  'package': 'package',
  'inventory': 'boxes',
  'discount': 'percent',
  'coupon': 'ticket',
  'gift': 'gift',
  'wishlist': 'heart',
  'returns': 'undo-2',
  'checkout': 'credit-card',
  'ecommerce': 'shopping-cart',

  // Healthcare
  'health': 'heart-pulse',
  'healthcare': 'heart-pulse',
  'medical': 'stethoscope',
  'hospital': 'hospital',
  'doctor': 'stethoscope',
  'patient': 'user-round',
  'medicine': 'pill',
  'pharmacy': 'pill',
  'fitness': 'dumbbell',
  'wellness': 'leaf',
  'nutrition': 'apple',
  'mental health': 'brain',
  'therapy': 'heart-handshake',
  'insurance': 'shield-plus',

  // Supplements & Vitamins
  'vitamin': 'pill',
  'vitamins': 'pill',
  'supplement': 'flask-conical',
  'supplements': 'flask-conical',
  'organic': 'leaf',
  'protein': 'dumbbell',
  'mineral': 'gem',
  'minerals': 'gem',
  'probiotic': 'microscope',
  'probiotics': 'microscope',
  'collagen': 'droplets',
  'omega': 'fish',
  'antioxidant': 'shield-plus',
  'immunity': 'shield-check',
  'superfood': 'salad',
  'superfoods': 'salad',
  'herbal': 'flower-2',
  'capsule': 'pill',

  // Education
  'education': 'graduation-cap',
  'learning': 'book-open',
  'school': 'school',
  'university': 'graduation-cap',
  'course': 'book-open-text',
  'training': 'presentation',
  'tutorial': 'play-circle',
  'certificate': 'award',
  'library': 'library',
  'research': 'microscope',
  'science': 'flask-conical',
  'student': 'user',
  'teacher': 'presentation',

  // Creative & Design
  'design': 'palette',
  'creative': 'lightbulb',
  'art': 'paintbrush',
  'photo': 'camera',
  'photography': 'camera',
  'image': 'image',
  'music': 'music',
  'audio': 'headphones',
  'podcast': 'mic',
  'writing': 'pen-tool',
  'blog': 'pen-line',
  'content': 'file-text',
  'branding': 'palette',
  'portfolio': 'folder-open',
  'animation': 'play',

  // General Features
  'speed': 'zap',
  'fast': 'zap',
  'performance': 'gauge',
  'quality': 'badge-check',
  'reliable': 'shield-check',
  'trust': 'shield',
  'support': 'headphones',
  'help': 'life-buoy',
  'customer service': 'headset',
  'customize': 'settings',
  'settings': 'settings',
  'configure': 'sliders-horizontal',
  'flexible': 'move',
  'scalable': 'maximize-2',
  'growth': 'trending-up',
  'innovation': 'lightbulb',
  'solution': 'puzzle',
  'feature': 'sparkles',
  'premium': 'crown',
  'pro': 'gem',
  'free': 'gift',
  'trial': 'timer',
  'demo': 'play-circle',
  'easy': 'thumbs-up',
  'simple': 'minimize-2',
  'powerful': 'zap',
  'secure': 'lock',
  'global': 'globe',
  'worldwide': 'globe-2',
  'local': 'map-pin',
  'location': 'map-pin',
  'map': 'map',
  'navigate': 'compass',
  'direction': 'navigation',
  'route': 'route',

  // People & Team
  'team': 'users',
  'user': 'user',
  'people': 'users',
  'collaboration': 'users',
  'teamwork': 'handshake',
  'leadership': 'crown',
  'management': 'kanban',
  'project': 'folder-kanban',
  'task': 'check-square',
  'workflow': 'git-branch',
  'process': 'workflow',
  'organization': 'sitemap',

  // Time & Scheduling
  'time': 'clock',
  'schedule': 'calendar',
  'calendar': 'calendar-days',
  'deadline': 'alarm-clock',
  'timer': 'timer',
  'history': 'history',
  'booking': 'calendar-check',
  'appointment': 'calendar-clock',
  'event': 'calendar-heart',
  'reminder': 'bell',
  'plan': 'list-todo',

  // Environment
  'environment': 'leaf',
  'green': 'leaf',
  'sustainable': 'recycle',
  'eco': 'trees',
  'nature': 'tree-pine',
  'solar': 'sun',
  'energy': 'zap',
  'water': 'droplets',
  'recycle': 'recycle',

  // Food & Restaurant
  'food': 'utensils',
  'restaurant': 'utensils-crossed',
  'cooking': 'chef-hat',
  'recipe': 'book-open',
  'menu': 'menu',
  'dining': 'wine',
  'coffee': 'coffee',
  'drink': 'glass-water',

  // Travel
  'travel': 'plane',
  'flight': 'plane-takeoff',
  'hotel': 'hotel',
  'vacation': 'palmtree',
  'tourism': 'map',
  'car': 'car',
  'transport': 'bus',
  'logistics': 'container',

  // Real Estate
  'real estate': 'home',
  'property': 'building',
  'house': 'home',
  'apartment': 'building',
  'construction': 'hard-hat',
  'architecture': 'ruler',
  'interior': 'sofa',
  'rent': 'key',

  // Legal
  'legal': 'scale',
  'law': 'gavel',
  'contract': 'file-signature',
  'compliance': 'check-circle',
  'regulation': 'book-open-check',
  'policy': 'scroll',

  // Actions
  'check': 'check',
  'add': 'plus',
  'edit': 'pencil',
  'delete': 'trash-2',
  'save': 'save',
  'copy': 'copy',
  'link': 'link',
  'attach': 'paperclip',
  'filter': 'filter',
  'sort': 'arrow-up-down',
  'refresh': 'refresh-cw',
  'print': 'printer',
  'export': 'download',
  'import': 'upload',
  'play': 'play',
  'pause': 'pause',
  'lock': 'lock',
  'unlock': 'unlock',
  'eye': 'eye',
  'hide': 'eye-off',
  'like': 'thumbs-up',
  'favorite': 'heart',
  'bookmark': 'bookmark',
  'tag': 'tag',
  'flag': 'flag',
  'pin': 'pin',
  'archive': 'archive',
  'folder': 'folder',
  'file': 'file',
  'document': 'file-text',
  'chart': 'bar-chart-3',
  'graph': 'line-chart',
  'table': 'table',
  'list': 'list',
  'grid': 'grid-3x3',
  'layout': 'layout',
  'color': 'palette',
  'font': 'type',
  'layer': 'layers',
  'component': 'component',

  // Pricing tier icons
  'basic': 'circle',
  'starter': 'circle',
  'standard': 'hexagon',
  'professional': 'gem',
  'enterprise plan': 'building-2',
  'unlimited': 'infinity',

  // Stats icons
  'users stat': 'users',
  'projects stat': 'folder-kanban',
  'downloads stat': 'download',
  'countries stat': 'globe',
  'revenue stat': 'dollar-sign',
  'uptime stat': 'activity',
  'satisfaction': 'smile',
  'clients stat': 'handshake',

  // Step icons
  'step 1': 'circle-1',
  'step 2': 'circle-2',
  'step 3': 'circle-3',
  'step 4': 'circle-4',
  'sign up': 'user-plus',
  'register': 'user-plus',
  'login': 'log-in',
  'choose': 'check-circle',
  'select': 'pointer',
  'launch': 'rocket',
  'deploy': 'rocket',
  'start': 'play',
  'begin': 'arrow-right',
  'complete': 'check-circle',
  'finish': 'flag-triangle-right',
  'done': 'circle-check',
};

// ─── Industry → Default Feature Icons ───────────────────────────────────────

const INDUSTRY_FEATURE_ICONS: Record<string, string[]> = {
  'finance': ['wallet', 'shield-check', 'trending-up', 'bar-chart-3', 'credit-card', 'piggy-bank'],
  'healthcare': ['heart-pulse', 'stethoscope', 'shield-plus', 'clock', 'users', 'pill'],
  'technology': ['cpu', 'cloud', 'lock', 'zap', 'globe', 'code-2'],
  'ecommerce': ['shopping-cart', 'truck', 'credit-card', 'percent', 'package', 'star'],
  'education': ['graduation-cap', 'book-open', 'presentation', 'award', 'users', 'play-circle'],
  'food': ['utensils', 'clock', 'truck', 'star', 'phone', 'map-pin'],
  'realestate': ['home', 'key', 'map-pin', 'building', 'ruler', 'phone'],
  'legal': ['scale', 'shield', 'file-text', 'clock', 'users', 'check-circle'],
  'creative': ['palette', 'lightbulb', 'pen-tool', 'layers', 'sparkles', 'camera'],
  'environmental': ['leaf', 'sun', 'recycle', 'droplets', 'trees', 'globe'],
  'gaming': ['gamepad-2', 'trophy', 'zap', 'users', 'headphones', 'play'],
  'nonprofit': ['heart-handshake', 'globe', 'users', 'hand-heart', 'megaphone', 'gift'],
  'luxury': ['gem', 'crown', 'sparkles', 'star', 'award', 'diamond'],
  'supplements': ['pill', 'leaf', 'shield-check', 'flask-conical', 'heart-pulse', 'zap'],
  'startup': ['rocket', 'zap', 'trending-up', 'lightbulb', 'users', 'globe'],
  'corporate': ['building-2', 'briefcase', 'bar-chart-3', 'shield', 'users', 'globe'],
  'fitness': ['dumbbell', 'heart-pulse', 'timer', 'flame', 'trophy', 'users'],
  'coaching': ['target', 'compass', 'lightbulb', 'trending-up', 'message-circle', 'award'],
  'consulting': ['briefcase', 'bar-chart-3', 'lightbulb', 'target', 'shield-check', 'users'],
};

// ─── In-memory Cache ────────────────────────────────────────────────────────

const imageCache = new Map<string, ResolvedImage[]>();

// ─── Unsplash Fetcher ───────────────────────────────────────────────────────

async function fetchFromUnsplash(
  query: string,
  count: number,
  width: number,
  height: number,
): Promise<ResolvedImage[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];

  try {
    const orientation = width > height * 1.3 ? 'landscape' : width < height * 0.7 ? 'portrait' : 'squarish';
    const url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=${Math.min(count, 30)}&orientation=${orientation}`;

    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      results: Array<{
        urls: { raw: string };
        alt_description?: string;
        description?: string;
        user: { name: string; links: { html: string } };
        links: { html: string };
      }>;
    };

    return data.results.slice(0, count).map((photo) => ({
      url: `${photo.urls.raw}&w=${width}&h=${height}&fit=crop&auto=format&q=80`,
      alt: photo.alt_description || photo.description || query,
      width,
      height,
      source: 'unsplash' as const,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      sourceUrl: photo.links.html,
      isIcon: false,
    }));
  } catch {
    return [];
  }
}

// ─── Pexels Fetcher ─────────────────────────────────────────────────────────

async function fetchFromPexels(
  query: string,
  count: number,
  width: number,
  height: number,
): Promise<ResolvedImage[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];

  try {
    const url = `${PEXELS_API}/search?query=${encodeURIComponent(query)}&per_page=${Math.min(count, 15)}`;

    const res = await fetch(url, {
      headers: { Authorization: key },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      photos: Array<{
        src: { large2x: string; large: string; medium: string };
        alt?: string;
        photographer: string;
        photographer_url: string;
        url: string;
      }>;
    };

    return data.photos.slice(0, count).map((photo) => ({
      url: photo.src.large2x || photo.src.large || photo.src.medium,
      alt: photo.alt || query,
      width,
      height,
      source: 'pexels' as const,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      sourceUrl: photo.url,
      isIcon: false,
    }));
  } catch {
    return [];
  }
}

// ─── Lorem Picsum Fallback (always works) ───────────────────────────────────

function generatePicsumImages(
  count: number,
  width: number,
  height: number,
  altBase: string,
  seedOffset: number = 0,
): ResolvedImage[] {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://picsum.photos/seed/uiarch${seedOffset + i + 1}/${width}/${height}`,
    alt: `${altBase} ${i + 1}`,
    width,
    height,
    source: 'picsum' as const,
    photographer: undefined,
    photographerUrl: undefined,
    sourceUrl: `https://picsum.photos/seed/uiarch${seedOffset + i + 1}/${width}/${height}`,
    isIcon: false,
  }));
}

// ─── Lucide Icon Resolver ───────────────────────────────────────────────────

function resolveIconByKeyword(keyword: string): string {
  const normalized = keyword.toLowerCase().trim();

  // Exact match
  if (KEYWORD_ICON_MAP[normalized]) return KEYWORD_ICON_MAP[normalized];

  // Partial match — keyword contains a known term
  for (const [key, icon] of Object.entries(KEYWORD_ICON_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }

  return 'sparkles'; // universal fallback
}

async function fetchSvgContent(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const text = await res.text();
    // Basic cleanup: remove xml declaration and set currentColor
    return text
      .replace(/<\?xml[^>]*\?>/gi, '')
      .replace(/<svg/, '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"');
  } catch {
    return undefined;
  }
}

async function generateLucideIcons(
  count: number,
  keywords: string[],
  industry: string,
  altBase: string,
): Promise<ResolvedImage[]> {
  const icons: ResolvedImage[] = [];
  const industryIcons = INDUSTRY_FEATURE_ICONS[industry] || INDUSTRY_FEATURE_ICONS['technology'];

  // Build a deduplicated icon list: resolve keywords first, fill gaps from industry defaults
  const iconPlan: Array<{ iconName: string; label: string }> = [];
  const usedIcons = new Set<string>();

  // Step 1: Resolve keywords to unique icons
  if (keywords.length > 0) {
    for (const kw of keywords) {
      const iconName = resolveIconByKeyword(kw);
      if (!usedIcons.has(iconName)) {
        usedIcons.add(iconName);
        iconPlan.push({ iconName, label: kw });
      }
    }
  }

  // Step 2: Fill remaining slots from industry defaults (skip already-used icons)
  for (const iconName of industryIcons) {
    if (iconPlan.length >= count) break;
    if (!usedIcons.has(iconName)) {
      usedIcons.add(iconName);
      iconPlan.push({ iconName, label: iconName.replace(/-/g, ' ') });
    }
  }

  // Step 3: If still short, cycle through what we have
  const finalPlan: Array<{ iconName: string; label: string }> = [];
  for (let i = 0; i < count; i++) {
    finalPlan.push(iconPlan[i % iconPlan.length]);
  }

  // Step 4: Fetch all icons
  for (const { iconName, label } of finalPlan) {
    const url = `${LUCIDE_CDN}/${iconName}.svg`;
    const svgContent = await fetchSvgContent(url);

    icons.push({
      url,
      alt: `${altBase} — ${label}`,
      width: 24,
      height: 24,
      source: 'lucide' as const,
      isIcon: true,
      svgContent,
    });
  }

  return icons;
}

// ─── Photo Resolver (Unsplash → Pexels → Picsum) ───────────────────────────

async function resolvePhotos(
  query: string,
  count: number,
  width: number,
  height: number,
  altBase: string,
  seedOffset: number,
): Promise<ResolvedImage[]> {
  const cacheKey = `${query}|${count}|${width}x${height}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  // Layer 1: Unsplash
  let images = await fetchFromUnsplash(query, count, width, height);

  // Layer 2: Pexels
  if (images.length < count) {
    const pexelsImages = await fetchFromPexels(query, count - images.length, width, height);
    images = [...images, ...pexelsImages];
  }

  // Layer 3: Picsum fallback
  if (images.length < count) {
    const picsumImages = generatePicsumImages(count - images.length, width, height, altBase, seedOffset);
    images = [...images, ...picsumImages];
  }

  imageCache.set(cacheKey, images);
  return images;
}

// ─── Exported Helpers (for use by generate_section) ─────────────────────────

/**
 * Resolve a keyword to a Lucide CDN icon URL.
 * Use in generate_section for feature/service/how-it-works icons.
 */
export function resolveIconForKeyword(keyword: string): string {
  const iconName = resolveIconByKeyword(keyword);
  return `${LUCIDE_CDN}/${iconName}.svg`;
}

/**
 * Get industry-specific feature icons as Lucide CDN URLs.
 */
export function getIndustryIcons(industry: string, count: number = 6): string[] {
  const icons = INDUSTRY_FEATURE_ICONS[industry] || INDUSTRY_FEATURE_ICONS['technology'];
  return Array.from({ length: count }, (_, i) => `${LUCIDE_CDN}/${icons[i % icons.length]}.svg`);
}

/**
 * Generate a Lorem Picsum URL (always works, no API key).
 */
export function resolvePicsumUrl(width: number, height: number, seed?: number): string {
  return seed
    ? `https://picsum.photos/seed/uiarch${seed}/${width}/${height}`
    : `https://picsum.photos/${width}/${height}`;
}

/**
 * Get the full KEYWORD_ICON_MAP for other tools to reference.
 */
export function getKeywordIconMap(): Record<string, string> {
  return { ...KEYWORD_ICON_MAP };
}

// ─── Main Function ──────────────────────────────────────────────────────────

export async function fetchImages(input: FetchImagesInput): Promise<FetchImagesOutput> {
  const globalIndustry = input.industry || 'technology';
  const images: Record<string, ResolvedImage[]> = {};
  const sources: Record<string, number> = { unsplash: 0, pexels: 0, picsum: 0, lucide: 0 };
  const attributions: string[] = [];
  let totalImages = 0;
  let seedCounter = 0;

  for (const section of input.sections) {
    const strategy = SECTION_IMAGE_STRATEGY[section.sectionType];

    if (!strategy || strategy.defaultCount === 0) {
      if (strategy && strategy.style === 'icon') { // Only process icons if strategy exists and is icon-based
        const keywords = section.keywords || [];
        const industry = section.industry || globalIndustry;
        const iconImages = await generateLucideIcons(
          section.count || strategy.defaultCount, // Use section.count or defaultCount (which is 0 here)
          keywords,
          industry,
          strategy.altBase
        );
        images[section.sectionType] = iconImages;
        sources.lucide += iconImages.length;
        totalImages += iconImages.length;
      } else {
        images[section.sectionType] = [];
      }
      continue;
    }

    const industry = section.industry || globalIndustry;
    const count = section.count || strategy.defaultCount;

    let sectionImages: ResolvedImage[];

    if (strategy.style === 'icon' || input.preferIcons) {
      // Use Lucide icons
      sectionImages = await generateLucideIcons(
        count,
        section.keywords || [],
        industry,
        strategy.altBase,
      );
    } else {
      // Use photos (Unsplash → Pexels → Picsum)
      const searchTerms = strategy.searchTerms(industry);
      const query = section.keywords?.length
        ? section.keywords.join(' ')
        : searchTerms[0] || `${industry} professional`;

      seedCounter += count;
      sectionImages = await resolvePhotos(
        query,
        count,
        strategy.width,
        strategy.height,
        strategy.altBase,
        seedCounter,
      );
    }

    images[section.sectionType] = sectionImages;
    totalImages += sectionImages.length;

    // Count sources
    for (const img of sectionImages) {
      sources[img.source] = (sources[img.source] || 0) + 1;

      // Collect attributions
      if (img.photographer && img.source !== 'picsum') {
        const credit = `Photo by ${img.photographer}${img.photographerUrl ? ` (${img.photographerUrl})` : ''} on ${img.source === 'unsplash' ? 'Unsplash' : 'Pexels'}`;
        if (!attributions.includes(credit)) {
          attributions.push(credit);
        }
      }
    }
  }

  // Build summary
  const sourceBreakdown = Object.entries(sources)
    .filter(([, count]) => count > 0)
    .map(([source, count]) => `${count} from ${source}`)
    .join(', ');

  const hasApiKeys = !!(process.env.UNSPLASH_ACCESS_KEY || process.env.PEXELS_API_KEY);

  let summary = `Resolved ${totalImages} image(s) for ${input.sections.length} section(s). Sources: ${sourceBreakdown || 'none needed'}.`;

  if (!hasApiKeys && sources.picsum > 0) {
    summary += '\n\nNote: No Unsplash/Pexels API keys configured. Using Lorem Picsum placeholders for photos. To get keyword-matched, high-quality stock photos, add UNSPLASH_ACCESS_KEY or PEXELS_API_KEY to your MCP environment variables.';
  }

  if (attributions.length > 0) {
    summary += `\n\n${attributions.length} photographer attribution(s) collected.`;
  }

  return {
    images,
    summary,
    totalImages,
    sources,
    attributions,
  };
}
