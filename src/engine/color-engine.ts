/**
 * Color Intelligence Engine
 *
 * Generates business-context-aware color palettes.
 * Never defaults to dark/light — always decides based on industry + tone.
 * Never produces the infamous purple-to-blue AI gradient.
 */

import type { Industry, Tone, ThemeMode, ColorPalette } from './types.js';

// ─── Industry → Color Associations ───────────────────────────────────────────

interface IndustryColorProfile {
  primaries: string[];       // hex candidates for primary
  secondaries: string[];     // hex candidates for secondary
  accents: string[];         // hex candidates for accent
  recommendedTheme: ThemeMode;
  avoid: string[];           // hex values to NEVER use
}

const INDUSTRY_PROFILES: Record<Industry, IndustryColorProfile> = {
  finance: {
    primaries: ['#1B365D', '#0A2540', '#1A3A5C', '#0D2137'],
    secondaries: ['#2D6A4F', '#1B7A4A', '#196B3E', '#3A7D5C'],
    accents: ['#D4A843', '#C5932A', '#B8860B', '#DAA520'],
    recommendedTheme: 'light',
    avoid: ['#667eea', '#764ba2', '#FF0000'],
  },
  healthcare: {
    primaries: ['#0D9488', '#0891B2', '#0EA5E9', '#06B6D4'],
    secondaries: ['#059669', '#10B981', '#34D399', '#6EE7B7'],
    accents: ['#7C3AED', '#8B5CF6', '#6366F1', '#818CF8'],
    recommendedTheme: 'light',
    avoid: ['#DC2626', '#B91C1C', '#000000'],
  },
  technology: {
    primaries: ['#2563EB', '#3B82F6', '#1D4ED8', '#6366F1', '#4F46E5'],
    secondaries: ['#06B6D4', '#0891B2', '#10B981', '#0EA5E9', '#8B5CF6'],
    accents: ['#F59E0B', '#EAB308', '#FBBF24', '#F43F5E', '#EC4899'],
    recommendedTheme: 'auto',
    avoid: ['#667eea', '#764ba2'],
  },
  ecommerce: {
    primaries: ['#EA580C', '#DC2626', '#2563EB', '#059669'],
    secondaries: ['#0891B2', '#7C3AED', '#0D9488', '#6366F1'],
    accents: ['#F59E0B', '#EF4444', '#10B981', '#EC4899'],
    recommendedTheme: 'light',
    avoid: ['#808080', '#A0A0A0'],
  },
  education: {
    primaries: ['#2563EB', '#059669', '#7C3AED', '#0891B2'],
    secondaries: ['#F59E0B', '#10B981', '#6366F1', '#EC4899'],
    accents: ['#EF4444', '#F97316', '#8B5CF6', '#14B8A6'],
    recommendedTheme: 'light',
    avoid: ['#1A1A2E', '#0A0A0A'],
  },
  food: {
    primaries: ['#DC2626', '#EA580C', '#B45309', '#92400E'],
    secondaries: ['#059669', '#65A30D', '#16A34A', '#4D7C0F'],
    accents: ['#F59E0B', '#FBBF24', '#FDE68A', '#FCD34D'],
    recommendedTheme: 'auto',
    avoid: ['#3B82F6', '#6366F1', '#60A5FA'],
  },
  realestate: {
    primaries: ['#1B365D', '#14532D', '#1C1917', '#292524'],
    secondaries: ['#D4A843', '#B8860B', '#92400E', '#78350F'],
    accents: ['#059669', '#0D9488', '#2563EB', '#0891B2'],
    recommendedTheme: 'light',
    avoid: ['#FF00FF', '#00FF00', '#667eea'],
  },
  legal: {
    primaries: ['#7F1D1D', '#1B365D', '#292524', '#1C1917'],
    secondaries: ['#D4A843', '#B8860B', '#78350F', '#92400E'],
    accents: ['#1B365D', '#0A2540', '#0D2137', '#14532D'],
    recommendedTheme: 'light',
    avoid: ['#EC4899', '#F472B6', '#A855F7', '#667eea'],
  },
  creative: {
    primaries: ['#EC4899', '#8B5CF6', '#F97316', '#FF0080', '#D946EF'],
    secondaries: ['#10B981', '#6366F1', '#EF4444', '#14B8A6', '#F43F5E'],
    accents: ['#FBBF24', '#22D3EE', '#A855F7', '#C026D3', '#06B6D4'],
    recommendedTheme: 'auto',
    avoid: ['#3B82F6'],   // too generic
  },
  environmental: {
    primaries: ['#059669', '#16A34A', '#15803D', '#166534'],
    secondaries: ['#0D9488', '#0891B2', '#65A30D', '#4D7C0F'],
    accents: ['#F59E0B', '#FBBF24', '#0EA5E9', '#22D3EE'],
    recommendedTheme: 'light',
    avoid: ['#6B7280', '#9CA3AF'],
  },
  gaming: {
    primaries: ['#7C3AED', '#DC2626', '#059669', '#EC4899'],
    secondaries: ['#06B6D4', '#F97316', '#10B981', '#6366F1'],
    accents: ['#FBBF24', '#22D3EE', '#F43F5E', '#A3E635'],
    recommendedTheme: 'dark',
    avoid: ['#F5F5F5', '#E5E5E5'],
  },
  nonprofit: {
    primaries: ['#0891B2', '#059669', '#2563EB', '#D97706'],
    secondaries: ['#10B981', '#F59E0B', '#7C3AED', '#0D9488'],
    accents: ['#EF4444', '#EC4899', '#F97316', '#6366F1'],
    recommendedTheme: 'light',
    avoid: ['#000000', '#1A1A1A'],
  },
  luxury: {
    primaries: ['#1C1917', '#292524', '#0A0A0A', '#1A1A2E', '#2D2926'],
    secondaries: ['#D4A843', '#B8860B', '#C5932A', '#A37E2C', '#E6C200'],
    accents: ['#F5F0E8', '#FFFBF0', '#FFF8E7', '#F8F0E3', '#FAF9F6'],
    recommendedTheme: 'dark',
    avoid: ['#3B82F6', '#22C55E', '#667eea'],
  },
  startup: {
    primaries: ['#2563EB', '#7C3AED', '#059669', '#EC4899', '#6366F1'],
    secondaries: ['#06B6D4', '#F59E0B', '#10B981', '#F43F5E', '#F97316'],
    accents: ['#FBBF24', '#22D3EE', '#A855F7', '#FF0080', '#00DFD8'],
    recommendedTheme: 'light',
    avoid: ['#667eea', '#764ba2'],
  },
  corporate: {
    primaries: ['#1B365D', '#1E40AF', '#0A2540', '#0D2137'],
    secondaries: ['#059669', '#0891B2', '#2D6A4F', '#1B7A4A'],
    accents: ['#F59E0B', '#D4A843', '#0EA5E9', '#22D3EE'],
    recommendedTheme: 'light',
    avoid: ['#EC4899', '#F472B6', '#667eea', '#764ba2'],
  },
  fitness: {
    primaries: ['#E63946', '#DC2626', '#F97316', '#EA580C'],
    secondaries: ['#1D4ED8', '#2563EB', '#0D9488', '#059669'],
    accents: ['#FBBF24', '#F59E0B', '#22D3EE', '#06B6D4'],
    recommendedTheme: 'dark',
    avoid: ['#EC4899', '#F472B6', '#A78BFA', '#C084FC'],
  },
  coaching: {
    primaries: ['#7C3AED', '#6D28D9', '#2563EB', '#1D4ED8'],
    secondaries: ['#059669', '#0D9488', '#0891B2', '#0EA5E9'],
    accents: ['#F59E0B', '#FBBF24', '#F97316', '#FB923C'],
    recommendedTheme: 'light',
    avoid: ['#EF4444', '#DC2626', '#000000', '#111111'],
  },
  consulting: {
    primaries: ['#1E3A5F', '#1E40AF', '#0A2540', '#1B365D'],
    secondaries: ['#059669', '#0891B2', '#2D6A4F', '#1B7A4A'],
    accents: ['#F59E0B', '#D4A843', '#0EA5E9', '#22D3EE'],
    recommendedTheme: 'light',
    avoid: ['#EC4899', '#F472B6', '#667eea', '#764ba2'],
  },
  wellness: {
    primaries: ['#7C3AED', '#8B5CF6', '#D946EF', '#A855F7'],
    secondaries: ['#059669', '#0D9488', '#14B8A6', '#10B981'],
    accents: ['#F59E0B', '#FBBF24', '#F0ABFC', '#E879F9'],
    recommendedTheme: 'light',
    avoid: ['#EF4444', '#DC2626', '#000000', '#111111'],
  },
  hospitality: {
    primaries: ['#92400E', '#B45309', '#1E3A5F', '#1E40AF'],
    secondaries: ['#059669', '#0891B2', '#D4A843', '#C2956B'],
    accents: ['#F59E0B', '#FBBF24', '#0EA5E9', '#22D3EE'],
    recommendedTheme: 'light',
    avoid: ['#EF4444', '#EC4899', '#667eea', '#764ba2'],
  },
  entertainment: {
    primaries: ['#7C3AED', '#6D28D9', '#DC2626', '#E11D48'],
    secondaries: ['#F59E0B', '#FBBF24', '#0EA5E9', '#06B6D4'],
    accents: ['#22D3EE', '#A855F7', '#F97316', '#FB923C'],
    recommendedTheme: 'dark',
    avoid: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB'],
  },
};

// ─── Color Utility Functions ─────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r: rRaw, g: gRaw, b: bRaw } = hexToRgb(hex);
  const r = rRaw / 255;
  const g = gRaw / 255;
  const b = bRaw / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
}

/** Lighten a hex color by a percentage (0-100) */
function lighten(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + amount));
}

/** Darken a hex color by a percentage (0-100) */
function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - amount));
}

/**
 * Generate a neutral gray scale tinted toward the primary hue.
 * Warm primaries → warm grays. Cool primaries → cool grays.
 */
function generateTintedNeutrals(
  primaryHex: string,
  mode: ThemeMode
): Pick<
  ColorPalette,
  'neutral900' | 'neutral700' | 'neutral500' | 'neutral300' | 'neutral200' | 'neutral100' | 'neutral50'
> {
  const { h, s } = hexToHsl(primaryHex);
  const tintSaturation = Math.min(s, 8); // subtle tint

  if (mode === 'dark') {
    return {
      neutral900: hslToHex(h, tintSaturation, 95),
      neutral700: hslToHex(h, tintSaturation, 80),
      neutral500: hslToHex(h, tintSaturation, 55),
      neutral300: hslToHex(h, tintSaturation, 30),
      neutral200: hslToHex(h, tintSaturation, 20),
      neutral100: hslToHex(h, tintSaturation, 12),
      neutral50: hslToHex(h, tintSaturation, 7),
    };
  }

  // Light mode (default)
  return {
    neutral900: hslToHex(h, tintSaturation, 10),
    neutral700: hslToHex(h, tintSaturation, 25),
    neutral500: hslToHex(h, tintSaturation, 45),
    neutral300: hslToHex(h, tintSaturation, 72),
    neutral200: hslToHex(h, tintSaturation, 82),
    neutral100: hslToHex(h, tintSaturation, 93),
    neutral50: hslToHex(h, tintSaturation, 97),
  };
}

/**
 * Calculate WCAG 2.1 relative luminance contrast ratio.
 */
function contrastRatio(hex1: string, hex2: string): number {
  const luminance = (hex: string): number => {
    const { r, g, b } = hexToRgb(hex);
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const sRGB = c / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Seeded Randomness (deterministic by industry+tone) ──────────────────────

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h ^= h >>> 16;
    return (h >>> 0) / 0x100000000;
  };
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── Main Palette Generator ──────────────────────────────────────────────────

export function resolveThemeMode(industry: Industry, preference?: ThemeMode): 'light' | 'dark' {
  if (preference === 'light' || preference === 'dark') return preference;

  const profile = INDUSTRY_PROFILES[industry];
  if (profile.recommendedTheme === 'light' || profile.recommendedTheme === 'dark') {
    return profile.recommendedTheme;
  }

  // 'auto' — default to light for most industries
  const darkIndustries: Industry[] = ['gaming', 'luxury'];
  return darkIndustries.includes(industry) ? 'dark' : 'light';
}

export function generateColorPalette(
  industry: Industry,
  tone: Tone,
  themePreference?: ThemeMode,
  brandColor?: string,
  brandName?: string
): { palette: ColorPalette; resolvedTheme: 'light' | 'dark' } {
  const profile = INDUSTRY_PROFILES[industry];
  const resolvedTheme = resolveThemeMode(industry, themePreference);
  // Include brandName in seed so different brands in the same industry get different palettes
  const rng = seededRandom(`${industry}-${tone}-${resolvedTheme}-${brandName || ''}`);

  // Pick primary (or use brand color if provided)
  const primary = brandColor || pickRandom(profile.primaries, rng);
  const secondary = pickRandom(profile.secondaries, rng);
  const accent = pickRandom(profile.accents, rng);

  // Generate light/dark variants
  const primaryLight = lighten(primary, 35);
  const primaryDark = darken(primary, 12);
  const secondaryLight = lighten(secondary, 30);
  const secondaryDark = darken(secondary, 12);
  const accentLight = lighten(accent, 30);

  // Generate tinted neutrals
  const neutrals = generateTintedNeutrals(primary, resolvedTheme);

  // Validate contrast — primary text on background must be ≥ 4.5:1
  const bgColor = resolvedTheme === 'dark' ? neutrals.neutral50 : neutrals.neutral50;
  const textColor = neutrals.neutral900;
  const ratio = contrastRatio(textColor, bgColor);

  // If contrast fails, adjust neutral900 darker
  let adjustedNeutral900 = neutrals.neutral900;
  if (ratio < 4.5) {
    adjustedNeutral900 = resolvedTheme === 'dark'
      ? lighten(neutrals.neutral900, 10)
      : darken(neutrals.neutral900, 10);
  }

  const { r, g, b } = hexToRgb(primary);
  const n900 = hexToRgb(adjustedNeutral900);
  const n50 = hexToRgb(neutrals.neutral50);

  const palette: ColorPalette = {
    primary,
    primaryLight,
    primaryDark,
    primaryRgb: `${r}, ${g}, ${b}`,
    secondary,
    secondaryLight,
    secondaryDark,
    accent,
    accentLight,
    neutral900: adjustedNeutral900,
    neutral900Rgb: `${n900.r}, ${n900.g}, ${n900.b}`,
    neutral700: neutrals.neutral700,
    neutral500: neutrals.neutral500,
    neutral300: neutrals.neutral300,
    neutral200: neutrals.neutral200,
    neutral100: neutrals.neutral100,
    neutral50: neutrals.neutral50,
    neutral50Rgb: `${n50.r}, ${n50.g}, ${n50.b}`,
    success: '#22C55E',
    successLight: '#DCFCE7',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
  };

  return { palette, resolvedTheme };
}

/**
 * Generate a complete CSS custom properties string from a color palette.
 */
export function colorsToCssVariables(palette: ColorPalette): string {
  return `  /* Colors — Generated by UI Architect Color Engine */
  --color-primary: ${palette.primary};
  --color-primary-light: ${palette.primaryLight};
  --color-primary-dark: ${palette.primaryDark};
  --color-primary-rgb: ${palette.primaryRgb};
  --color-secondary: ${palette.secondary};
  --color-secondary-light: ${palette.secondaryLight};
  --color-secondary-dark: ${palette.secondaryDark};
  --color-accent: ${palette.accent};
  --color-accent-light: ${palette.accentLight};
  --color-neutral-900: ${palette.neutral900};
  --color-neutral-900-rgb: ${palette.neutral900Rgb};
  --color-neutral-700: ${palette.neutral700};
  --color-neutral-500: ${palette.neutral500};
  --color-neutral-300: ${palette.neutral300};
  --color-neutral-200: ${palette.neutral200};
  --color-neutral-100: ${palette.neutral100};
  --color-neutral-50: ${palette.neutral50};
  --color-neutral-50-rgb: ${palette.neutral50Rgb};
  --color-success: ${palette.success};
  --color-success-light: ${palette.successLight};
  --color-warning: ${palette.warning};
  --color-warning-light: ${palette.warningLight};
  --color-error: ${palette.error};
  --color-error-light: ${palette.errorLight};
  --color-info: ${palette.info};
  --color-info-light: ${palette.infoLight};`;
}
