/**
 * Shared Business Model Classifier
 *
 * Single source of truth for classifying ANY industry into one of 4 business models:
 * product, service, saas, venue.
 *
 * Used by: analyze-project.ts, generate-content.ts, generate-full-page.ts
 * to ensure consistent industry classification across the pipeline.
 */

export type BusinessModel = 'product' | 'service' | 'saas' | 'venue';

export type VenueSubtype = 'food' | 'fitness' | 'wellness' | 'hospitality' | 'entertainment' | 'general';

export const VENUE_SUBTYPE_KEYWORDS: Record<VenueSubtype, string[]> = {
  food: [
    'restaurant', 'cafe', 'coffee', 'bakery', 'bar', 'pub', 'brewery',
    'bistro', 'pizzeria', 'sushi', 'steakhouse', 'winery', 'food',
    'dining', 'catering', 'deli', 'patisserie', 'food truck',
  ],
  fitness: [
    'gym', 'fitness', 'yoga', 'crossfit', 'pilates', 'martial arts',
    'boxing', 'personal training', 'workout', 'bodybuilding', 'spin',
    'fitness center', 'sports club', 'athletic',
  ],
  wellness: [
    'salon', 'spa', 'barbershop', 'beauty salon', 'nail salon',
    'massage', 'medspa', 'skincare clinic', 'wellness center',
    'hair salon', 'aesthetics', 'dermatology', 'tattoo',
  ],
  hospitality: [
    'hotel', 'resort', 'motel', 'hostel', 'bed and breakfast',
    'lodge', 'inn', 'event space', 'wedding venue', 'conference center',
    'banquet hall', 'vacation rental',
  ],
  entertainment: [
    'cinema', 'theater', 'museum', 'gallery', 'club', 'arcade',
    'bowling', 'gaming lounge', 'play room', 'escape room',
    'amusement', 'ott', 'streaming', 'nightclub', 'karaoke',
    'trampoline park', 'laser tag',
  ],
  general: ['coworking', 'venue', 'community center'],
};

export const MODEL_KEYWORDS: Record<BusinessModel, string[]> = {
  product: [
    'supplement', 'vitamin', 'ecommerce', 'shop', 'store', 'retail', 'fashion',
    'clothing', 'apparel', 'jewelry', 'beauty', 'cosmetics', 'skincare',
    'electronics', 'furniture', 'grocery', 'pet', 'toy', 'book', 'craft',
    'organic', 'nutrition', 'nutraceutical', 'merchandise', 'gadget',
    'shoe', 'accessory', 'watch', 'fragrance', 'candle', 'home decor',
    'plant', 'flower', 'art supply', 'sporting goods', 'outdoor gear',
  ],
  service: [
    'healthcare', 'health', 'medical', 'clinic', 'hospital', 'dental',
    'legal', 'law', 'attorney', 'consulting', 'agency', 'insurance',
    'accounting', 'financial', 'advisor', 'therapy', 'counseling',
    'veterinary', 'plumbing', 'electrical', 'cleaning', 'landscaping',
    'moving', 'photography', 'tutoring', 'coaching', 'coach', 'mentor', 'recruiting',
    'architecture', 'engineering', 'logistics', 'security', 'repair',
  ],
  saas: [
    'saas', 'software', 'platform', 'app', 'fintech', 'edtech', 'proptech',
    'martech', 'devtools', 'analytics', 'crm', 'erp', 'automation',
    'ai', 'machine learning', 'cloud', 'api', 'developer', 'startup',
    'tech', 'technology', 'data', 'cyber', 'iot', 'blockchain',
  ],
  venue: [
    'restaurant', 'cafe', 'coffee', 'bakery', 'bar', 'pub', 'brewery',
    'hotel', 'resort', 'spa', 'gym', 'fitness center', 'fitness', 'yoga',
    'salon', 'barbershop', 'cinema', 'theater', 'museum', 'gallery',
    'club', 'coworking', 'event space', 'wedding venue', 'winery',
    'food', 'dining', 'bistro', 'pizzeria', 'sushi', 'steakhouse',
    'entertainment', 'wellness', 'hospitality',
  ],
};

export function classifyBusinessModel(industry: string): BusinessModel {
  const lower = industry.toLowerCase();

  // Score each model by how many keywords match
  let bestModel: BusinessModel = 'service'; // default fallback
  let bestScore = 0;

  for (const [model, keywords] of Object.entries(MODEL_KEYWORDS) as [BusinessModel, string[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw) || kw.includes(lower)) {
        // Exact match gets more weight than substring
        score += (lower === kw) ? 10 : 5;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestModel = model;
    }
  }

  return bestModel;
}

export function classifyVenueSubtype(industry: string): VenueSubtype {
  const lower = industry.toLowerCase();
  let bestSubtype: VenueSubtype = 'general';
  let bestScore = 0;

  for (const [subtype, keywords] of Object.entries(VENUE_SUBTYPE_KEYWORDS) as [VenueSubtype, string[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw) || kw.includes(lower)) {
        score += (lower === kw) ? 10 : 5;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestSubtype = subtype;
    }
  }

  return bestSubtype;
}
