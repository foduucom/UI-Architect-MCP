/**
 * Typography & Spacing Engine
 *
 * Selects font pairings based on industry/tone,
 * generates modular type scales, and builds the spacing system.
 */

import type { Industry, Tone, TypographySystem, SpacingSystem, ShadowSystem, RadiusSystem, TransitionSystem, FontPairing } from './types.js';

// ─── Font Pairing Database ───────────────────────────────────────────────────

interface FontPairingEntry extends FontPairing {
  bestFor: Industry[];
  toneMatch: Tone[];
}

const FONT_PAIRINGS: FontPairingEntry[] = [
  {
    heading: 'Inter',
    body: 'Inter',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    bestFor: ['technology', 'corporate', 'ecommerce', 'startup'],
    toneMatch: ['modern', 'minimal', 'corporate', 'technical'],
  },
  {
    heading: 'DM Sans',
    body: 'DM Sans',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
    bestFor: ['education', 'healthcare', 'nonprofit', 'startup'],
    toneMatch: ['warm', 'playful', 'modern'],
  },
  {
    heading: 'Plus Jakarta Sans',
    body: 'Inter',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    bestFor: ['technology', 'startup', 'ecommerce'],
    toneMatch: ['modern', 'bold', 'technical'],
  },
  {
    heading: 'Playfair Display',
    body: 'Source Sans 3',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap',
    bestFor: ['luxury', 'legal', 'realestate', 'food'],
    toneMatch: ['luxury', 'elegant', 'warm'],
  },
  {
    heading: 'Space Grotesk',
    body: 'DM Sans',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap',
    bestFor: ['technology', 'gaming', 'creative'],
    toneMatch: ['technical', 'bold', 'modern'],
  },
  {
    heading: 'Sora',
    body: 'Inter',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    bestFor: ['startup', 'technology', 'finance'],
    toneMatch: ['modern', 'corporate', 'minimal'],
  },
  {
    heading: 'Outfit',
    body: 'Work Sans',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap',
    bestFor: ['education', 'nonprofit', 'healthcare', 'environmental'],
    toneMatch: ['warm', 'playful', 'modern'],
  },
  {
    heading: 'Manrope',
    body: 'Manrope',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap',
    bestFor: ['finance', 'corporate', 'realestate', 'legal'],
    toneMatch: ['corporate', 'minimal', 'elegant'],
  },
  {
    heading: 'Syne',
    body: 'Inter',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap',
    bestFor: ['creative', 'gaming', 'luxury', 'startup'],
    toneMatch: ['bold', 'modern', 'playful'],
  },
  {
    heading: 'Libre Baskerville',
    body: 'Source Sans 3',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600&display=swap',
    bestFor: ['legal', 'corporate', 'education'],
    toneMatch: ['luxury', 'elegant', 'corporate'],
  },
  {
    heading: 'Bricolage Grotesque',
    body: 'Inter',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    bestFor: ['creative', 'food', 'environmental'],
    toneMatch: ['warm', 'playful', 'bold'],
  },
];

// ─── Font Selection Logic ────────────────────────────────────────────────────

export function selectFontPairing(industry: Industry, tone: Tone): FontPairing {
  // Score each pairing by how well it matches
  const scored = FONT_PAIRINGS.map((fp) => {
    let score = 0;
    if (fp.bestFor.includes(industry)) score += 3;
    if (fp.toneMatch.includes(tone)) score += 2;
    return { ...fp, score };
  });

  // Sort by score descending, pick the best
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  return {
    heading: best.heading,
    body: best.body,
    googleFontsUrl: best.googleFontsUrl,
  };
}

// ─── Typography System Generator ─────────────────────────────────────────────

export function generateTypography(industry: Industry, tone: Tone): TypographySystem {
  const fonts = selectFontPairing(industry, tone);

  return {
    fonts,
    scale: {
      display: '3rem',       // 48px
      h1: '2.25rem',         // 36px
      h2: '1.875rem',        // 30px
      h3: '1.5rem',          // 24px
      h4: '1.25rem',         // 20px
      body: '1rem',          // 16px
      small: '0.875rem',     // 14px
      caption: '0.75rem',    // 12px
    },
    lineHeights: {
      heading: '1.2',
      body: '1.65',
      ui: '1.4',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  };
}

// ─── Spacing System ──────────────────────────────────────────────────────────

export function generateSpacing(): SpacingSystem {
  return {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
    '5xl': '8rem',    // 128px
  };
}

// ─── Shadow System ───────────────────────────────────────────────────────────

export function generateShadows(): ShadowSystem {
  return {
    sm: '0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.05)',
    lg: '0 12px 24px rgba(0,0,0,0.07), 0 4px 8px rgba(0,0,0,0.04)',
    xl: '0 24px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)',
  };
}

// ─── Border Radius System ────────────────────────────────────────────────────

export function generateRadius(tone: Tone): RadiusSystem {
  // Agency Quality: Radical vs Sharp vs Soft
  if (tone === 'playful') {
    return { sm: '8px', md: '16px', lg: '32px', xl: '48px', full: '9999px' };
  }
  if (tone === 'modern' || tone === 'warm') {
    return { sm: '6px', md: '12px', lg: '20px', xl: '28px', full: '9999px' };
  }
  if (tone === 'corporate' || tone === 'technical' || tone === 'minimal') {
    return { sm: '0px', md: '2px', lg: '4px', xl: '8px', full: '9999px' };
  }
  if (tone === 'luxury' || tone === 'elegant') {
    return { sm: '2px', md: '4px', lg: '8px', xl: '12px', full: '9999px' };
  }
  // Default
  return { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' };
}

// ─── Transition System ───────────────────────────────────────────────────────

export function generateTransitions(): TransitionSystem {
  return {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '350ms ease',
    spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInExpo: 'cubic-bezier(0.7, 0, 0.84, 0)',
    easeInOutExpo: 'cubic-bezier(0.87, 0, 0.13, 1)',
    easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    easeSmooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  };
}

// ─── CSS Variable Generation ─────────────────────────────────────────────────

export function typographyToCssVariables(typo: TypographySystem): string {
  return `  /* Typography — Generated by UI Architect */
  --font-heading: '${typo.fonts.heading}', system-ui, sans-serif;
  --font-body: '${typo.fonts.body}', system-ui, sans-serif;
  --fs-display: ${typo.scale.display};
  --fs-h1: ${typo.scale.h1};
  --fs-h2: ${typo.scale.h2};
  --fs-h3: ${typo.scale.h3};
  --fs-h4: ${typo.scale.h4};
  --fs-body: ${typo.scale.body};
  --fs-small: ${typo.scale.small};
  --fs-caption: ${typo.scale.caption};
  --lh-heading: ${typo.lineHeights.heading};
  --lh-body: ${typo.lineHeights.body};
  --lh-ui: ${typo.lineHeights.ui};
  --fw-regular: ${typo.weights.regular};
  --fw-medium: ${typo.weights.medium};
  --fw-semibold: ${typo.weights.semibold};
  --fw-bold: ${typo.weights.bold};`;
}

export function spacingToCssVariables(spacing: SpacingSystem): string {
  return `  /* Spacing — 8px grid system */
  --space-xs: ${spacing.xs};
  --space-sm: ${spacing.sm};
  --space-md: ${spacing.md};
  --space-lg: ${spacing.lg};
  --space-xl: ${spacing.xl};
  --space-2xl: ${spacing['2xl']};
  --space-3xl: ${spacing['3xl']};
  --space-4xl: ${spacing['4xl']};
  --space-5xl: ${spacing['5xl']};`;
}

export function shadowsToCssVariables(shadows: ShadowSystem): string {
  return `  /* Shadows */
  --shadow-sm: ${shadows.sm};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
  --shadow-xl: ${shadows.xl};`;
}

export function radiusToCssVariables(radius: RadiusSystem): string {
  return `  /* Border Radius */
  --radius-sm: ${radius.sm};
  --radius-md: ${radius.md};
  --radius-lg: ${radius.lg};
  --radius-xl: ${radius.xl};
  --radius-full: ${radius.full};`;
}

export function transitionsToCssVariables(transitions: TransitionSystem): string {
  return `  /* Transitions */
  --transition-fast: ${transitions.fast};
  --transition-base: ${transitions.base};
  --transition-slow: ${transitions.slow};
  --transition-spring: ${transitions.spring};
  --ease-out-expo: ${transitions.easeOutExpo};
  --ease-in-expo: ${transitions.easeInExpo};
  --ease-in-out-expo: ${transitions.easeInOutExpo};
  --ease-spring: ${transitions.easeSpring};
  --ease-smooth: ${transitions.easeSmooth};`;
}
