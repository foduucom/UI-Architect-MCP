/**
 * MCP Tool: design_theme
 *
 * Phase 3 — Generates a complete design system (colors, typography, spacing,
 * shadows, radius, transitions) based on business context.
 *
 * This is the foundation tool that all other tools depend on.
 */

import type { DesignTokens, DesignThemeInput, DesignThemeOutput, Industry, Tone, ThemeMode } from '../engine/types.js';
import { generateColorPalette, colorsToCssVariables, resolveThemeMode } from '../engine/color-engine.js';
import {
  generateTypography,
  generateSpacing,
  generateShadows,
  generateRadius,
  generateTransitions,
  typographyToCssVariables,
  spacingToCssVariables,
  shadowsToCssVariables,
  radiusToCssVariables,
  transitionsToCssVariables,
} from '../engine/typography-engine.js';

// ─── Industry & Tone Resolution ──────────────────────────────────────────────

const VALID_INDUSTRIES: Industry[] = [
  'finance', 'healthcare', 'technology', 'ecommerce', 'education',
  'food', 'realestate', 'legal', 'creative', 'environmental',
  'gaming', 'nonprofit', 'luxury', 'startup', 'corporate',
  'fitness', 'wellness', 'hospitality', 'entertainment',
  'coaching', 'consulting',
];

const VALID_TONES: Tone[] = [
  'corporate', 'modern', 'playful', 'minimal', 'luxury',
  'technical', 'warm', 'bold', 'elegant',
];

function resolveIndustry(input: string): Industry {
  const lower = input.toLowerCase().trim();

  // Direct match
  if (VALID_INDUSTRIES.includes(lower as Industry)) {
    return lower as Industry;
  }

  // Fuzzy mapping
  const aliases: Record<string, Industry> = {
    'fintech': 'finance',
    'banking': 'finance',
    'insurance': 'finance',
    'medical': 'healthcare',
    'health': 'healthcare',
    'pharma': 'healthcare',
    'saas': 'technology',
    'tech': 'technology',
    'software': 'technology',
    'ai': 'technology',
    'devtools': 'technology',
    'developer': 'technology',
    'shop': 'ecommerce',
    'store': 'ecommerce',
    'retail': 'ecommerce',
    'marketplace': 'ecommerce',
    'school': 'education',
    'university': 'education',
    'learning': 'education',
    'edtech': 'education',
    'restaurant': 'food',
    'cafe': 'food',
    'bakery': 'food',
    'foodtech': 'food',
    'property': 'realestate',
    'real estate': 'realestate',
    'housing': 'realestate',
    'law': 'legal',
    'attorney': 'legal',
    'law firm': 'legal',
    'agency': 'creative',
    'design': 'creative',
    'photography': 'creative',
    'art': 'creative',
    'portfolio': 'creative',
    'green': 'environmental',
    'eco': 'environmental',
    'sustainability': 'environmental',
    'climate': 'environmental',
    'ngo': 'nonprofit',
    'charity': 'nonprofit',
    'foundation': 'nonprofit',
    'esports': 'gaming',
    'game': 'gaming',
    'fashion': 'luxury',
    'jewelry': 'luxury',
    'premium': 'luxury',
    'high-end': 'luxury',
    'enterprise': 'corporate',
    'b2b': 'corporate',
    'gym': 'fitness',
    'trainer': 'fitness',
    'workout': 'fitness',
    'personal training': 'fitness',
    'crossfit': 'fitness',
    'bodybuilding': 'fitness',
    'coach': 'coaching',
    'life coach': 'coaching',
    'mentor': 'coaching',
    'consultant': 'consulting',
    'advisory': 'consulting',
    // Wellness
    'salon': 'wellness',
    'spa': 'wellness',
    'barbershop': 'wellness',
    'hair salon': 'wellness',
    'nail salon': 'wellness',
    'massage': 'wellness',
    // Hospitality
    'hotel': 'hospitality',
    'resort': 'hospitality',
    'hostel': 'hospitality',
    'bed and breakfast': 'hospitality',
    // Entertainment
    'cinema': 'entertainment',
    'theater': 'entertainment',
    'arcade': 'entertainment',
    'bowling': 'entertainment',
    'escape room': 'entertainment',
    'nightclub': 'entertainment',
  };

  for (const [alias, industry] of Object.entries(aliases)) {
    if (lower.includes(alias)) return industry;
  }

  return (lower as Industry) || 'technology'; // pass through unknown industries
}

function resolveTone(input: string): Tone {
  const lower = input.toLowerCase().trim();

  if (VALID_TONES.includes(lower as Tone)) {
    return lower as Tone;
  }

  const aliases: Record<string, Tone> = {
    'professional': 'corporate',
    'formal': 'corporate',
    'business': 'corporate',
    'clean': 'minimal',
    'simple': 'minimal',
    'sleek': 'minimal',
    'fun': 'playful',
    'creative': 'playful',
    'energetic': 'playful',
    'vibrant': 'bold',
    'strong': 'bold',
    'powerful': 'bold',
    'premium': 'luxury',
    'high-end': 'luxury',
    'sophisticated': 'elegant',
    'refined': 'elegant',
    'classy': 'elegant',
    'friendly': 'warm',
    'approachable': 'warm',
    'inviting': 'warm',
    'techy': 'technical',
    'developer': 'technical',
    'engineering': 'technical',
    'contemporary': 'modern',
    'fresh': 'modern',
    'innovative': 'modern',
    'trendy': 'modern',
  };

  for (const [alias, tone] of Object.entries(aliases)) {
    if (lower.includes(alias)) return tone;
  }

  return 'modern'; // safe default
}

// ─── Main Tool Function ──────────────────────────────────────────────────────

export function designTheme(input: DesignThemeInput): DesignThemeOutput {
  const industry = resolveIndustry(input.industry);
  const tone = resolveTone(input.tone);
  const themePreference = input.themePreference || 'auto';

  // Generate all subsystems
  const { palette, resolvedTheme } = generateColorPalette(industry, tone, themePreference, input.brandColor, input.brandName);
  const typography = generateTypography(industry, tone, input.brandName);
  const spacing = generateSpacing();
  const shadows = generateShadows();
  const radius = generateRadius(tone);
  const transitions = generateTransitions();

  const tokens: DesignTokens = {
    themeMode: resolvedTheme,
    industry,
    tone,
    colors: palette,
    typography,
    spacing,
    shadows,
    radius,
    transitions,
  };

  // Build complete CSS variables block
  const cssVariables = `:root {
${colorsToCssVariables(palette)}

${typographyToCssVariables(typography)}

${spacingToCssVariables(spacing)}

${shadowsToCssVariables(shadows)}

${radiusToCssVariables(radius)}

${transitionsToCssVariables(transitions)}
}`;

  // Build human-readable summary
  const summary = buildSummary(tokens, resolvedTheme);

  return { tokens, cssVariables, summary };
}

// ─── Summary Generator ───────────────────────────────────────────────────────

function buildSummary(tokens: DesignTokens, resolvedTheme: 'light' | 'dark'): string {
  const { colors, typography, industry, tone } = tokens;

  return `## Design System Generated

**Industry:** ${industry} | **Tone:** ${tone} | **Theme:** ${resolvedTheme}

### Color Palette
- **Primary:** ${colors.primary} — Main brand color for CTAs, links, key elements
- **Secondary:** ${colors.secondary} — Supporting actions, highlights
- **Accent:** ${colors.accent} — Attention-grabbing elements (use sparingly, <10% of page)
- **Neutrals:** ${colors.neutral900} (text) → ${colors.neutral50} (background)
- **Semantic:** Success ${colors.success} | Warning ${colors.warning} | Error ${colors.error} | Info ${colors.info}

### Typography
- **Heading font:** ${typography.fonts.heading}
- **Body font:** ${typography.fonts.body}
- **Google Fonts:** ${typography.fonts.googleFontsUrl}
- **Scale:** Display ${typography.scale.display} → Caption ${typography.scale.caption}

### Design Principles Applied
- WCAG AA contrast ratios enforced on all text/background combinations
- No pure black (#000) or pure white (#FFF) — neutrals are tinted toward the primary hue
- 60-30-10 color rule: 60% neutrals, 30% secondary, 10% primary/accent
- 8px grid spacing system for consistent rhythm
- Business-context theme selection (not default dark/light)

### How to Use
1. Add the Google Fonts link to your HTML \`<head>\`
2. Include the CSS variables in your root stylesheet
3. Reference variables like \`var(--color-primary)\`, \`var(--font-heading)\`, etc.
4. Use \`select_components\` next to get framework-adapted UI components themed to this palette`;
}
