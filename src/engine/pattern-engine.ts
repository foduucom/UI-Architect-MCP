/**
 * Background Pattern Engine
 *
 * Generates CSS background patterns that are subtle, professional,
 * and appropriate for the business context. Never used as main visual —
 * patterns are understated and barely noticeable.
 *
 * Patterns generated:
 * - Geometric: Dot grids and line grids (tech, corporate, finance)
 * - Gradient: Soft mesh gradients (startup, creative)
 * - Noise: SVG fractal noise texture (luxury, editorial)
 * - Organic: Wave dividers and flowing shapes (health, education, environment)
 * - Blob: Animated morphing blobs (gaming, food, ecommerce)
 */

import type { Industry, PatternStyle, BackgroundPattern, ColorPalette } from './types.js';

// ─── Industry → Pattern Style Mapping ────────────────────────────────────────

/**
 * Map industries to their best-suited pattern style.
 * This mapping follows the CLAUDE.md philosophy that pattern choice
 * is determined by business context, not random choice.
 */
function selectPatternStyle(industry: Industry): PatternStyle {
  const patternMap: Record<Industry, PatternStyle> = {
    technology: 'geometric',
    corporate: 'geometric',
    finance: 'geometric',
    legal: 'geometric',
    startup: 'gradient',
    creative: 'gradient',
    luxury: 'noise',
    healthcare: 'organic',
    education: 'organic',
    environmental: 'organic',
    nonprofit: 'organic',
    gaming: 'blob',
    food: 'blob',
    ecommerce: 'blob',
    realestate: 'geometric',
    fitness: 'geometric',
    coaching: 'gradient',
    consulting: 'geometric',
    wellness: 'organic',
    hospitality: 'noise',
    entertainment: 'blob',
  };

  return patternMap[industry];
}

// ─── Pattern Generators ──────────────────────────────────────────────────────

/**
 * Generate a geometric dot grid pattern.
 * Best for: Tech, corporate, finance — conveys structure and order.
 *
 * Pattern: Subtle dots that create a grid feel without being intrusive.
 * Opacity: 0.03-0.05 so pattern is barely noticeable.
 */
function generateGeometricPattern(palette: ColorPalette, themeMode: 'light' | 'dark'): BackgroundPattern {
  // Select dot color based on theme
  const dotColor = themeMode === 'light' ? palette.neutral300 : palette.neutral700;
  const backgroundColor = themeMode === 'light' ? palette.neutral50 : palette.neutral900;

  const css = `/* Geometric dot grid pattern */
body {
  background-color: ${backgroundColor};
  background-image: radial-gradient(circle, ${dotColor} 1px, transparent 1px);
  background-size: 24px 24px;
  background-attachment: fixed;
}`;

  return {
    style: 'geometric',
    css,
    description: 'Subtle dot grid pattern — professional, structured, tech-forward',
  };
}

/**
 * Generate a soft gradient mesh pattern.
 * Best for: Startup, creative — modern, dynamic, approachable.
 *
 * Pattern: Three radial gradients positioned across the viewport,
 * blended with low opacity for subtlety.
 * Opacity: 0.05-0.12 per gradient layer.
 */
/** Convert hex color to rgba() string — prevents invalid rgba(#hex, opacity) */
function hexToRgba(hex: string, opacity: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function generateGradientPattern(palette: ColorPalette, themeMode: 'light' | 'dark'): BackgroundPattern {
  const backgroundColor = themeMode === 'light' ? palette.neutral50 : palette.neutral900;

  // For light themes, use softened light tints. For dark, use barely-visible tints.
  const gradient1 = themeMode === 'light'
    ? `rgba(${palette.primaryRgb}, 0.08)` // primaryLight at low opacity
    : `rgba(${palette.primaryRgb}, 0.05)`;

  const gradient2 = themeMode === 'light'
    ? hexToRgba(palette.secondaryLight, 0.06)
    : hexToRgba(palette.accentLight, 0.04);

  const gradient3 = themeMode === 'light'
    ? hexToRgba(palette.accentLight, 0.05)
    : `rgba(${palette.primaryRgb}, 0.03)`;

  const css = `/* Soft mesh gradient pattern */
body {
  background-color: ${backgroundColor};
  background-image:
    radial-gradient(at 40% 20%, ${gradient1} 0px, transparent 50%),
    radial-gradient(at 80% 0%, ${gradient2} 0px, transparent 50%),
    radial-gradient(at 0% 50%, ${gradient3} 0px, transparent 50%);
  background-attachment: fixed;
}`;

  return {
    style: 'gradient',
    css,
    description: 'Soft mesh gradient — dynamic, modern, energetic',
  };
}

/**
 * Generate an SVG noise texture pattern.
 * Best for: Luxury, editorial, artisan — adds tactile, premium feel.
 *
 * Pattern: Fractal Perlin noise overlay at very low opacity (0.03-0.05).
 * Uses feTurbulence filter from SVG for authentic noise texture.
 */
function generateNoisePattern(palette: ColorPalette, themeMode: 'light' | 'dark'): BackgroundPattern {
  const backgroundColor = themeMode === 'light' ? palette.neutral50 : palette.neutral900;
  const noiseColor = themeMode === 'light' ? palette.neutral900 : palette.neutral50;

  // SVG data URI with embedded turbulence filter for noise texture
  const svgNoise = encodeURIComponent(`<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#noise)" opacity="0.04"/>
</svg>`);

  const css = `/* SVG fractal noise pattern */
body {
  background-color: ${backgroundColor};
  background-image: url("data:image/svg+xml,${svgNoise}");
  background-attachment: fixed;
}`;

  return {
    style: 'noise',
    css,
    description: 'Subtle SVG fractal noise — luxury, editorial, tactile premium feel',
  };
}

/**
 * Generate an organic wave pattern using CSS clip-path.
 * Best for: Healthcare, education, environmental, nonprofit — friendly, organic, human.
 *
 * Pattern: Wave-shaped section dividers or organic background shapes.
 * Uses CSS clip-path polygon for smooth transitions.
 */
function generateOrganicPattern(palette: ColorPalette, themeMode: 'light' | 'dark'): BackgroundPattern {
  const backgroundColor = themeMode === 'light' ? palette.neutral50 : palette.neutral900;
  const waveColor = themeMode === 'light' ? palette.primaryLight : palette.primaryDark;

  // Optional: Add a decorative wave-like divider between sections
  // This creates a sense of flow and organic movement
  const css = `/* Organic wave pattern */
body {
  background-color: ${backgroundColor};
  background-attachment: fixed;
}

/* Optional: Wave divider for section breaks */
.wave-divider {
  position: relative;
  width: 100%;
  height: 100px;
  background-color: ${backgroundColor};
}

.wave-divider::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: ${waveColor};
  opacity: 0.08;
  clip-path: polygon(
    0% 60%,
    1.5% 58%,
    3% 56.5%,
    4.5% 55%,
    6% 54%,
    7.5% 53.5%,
    9% 54%,
    10.5% 55%,
    12% 56.5%,
    13.5% 58%,
    15% 60%,
    16.5% 62%,
    18% 63%,
    19.5% 63.5%,
    21% 63%,
    22.5% 62%,
    24% 60%,
    25.5% 58%,
    27% 56.5%,
    28.5% 55%,
    30% 54%,
    31.5% 53.5%,
    33% 54%,
    34.5% 55%,
    36% 56.5%,
    37.5% 58%,
    39% 60%,
    40.5% 62%,
    42% 63%,
    43.5% 63.5%,
    45% 63%,
    46.5% 62%,
    48% 60%,
    49.5% 58%,
    51% 56.5%,
    52.5% 55%,
    54% 54%,
    55.5% 53.5%,
    57% 54%,
    58.5% 55%,
    60% 56.5%,
    61.5% 58%,
    63% 60%,
    64.5% 62%,
    66% 63%,
    67.5% 63.5%,
    69% 63%,
    70.5% 62%,
    72% 60%,
    73.5% 58%,
    75% 56.5%,
    76.5% 55%,
    78% 54%,
    79.5% 53.5%,
    81% 54%,
    82.5% 55%,
    84% 56.5%,
    85.5% 58%,
    87% 60%,
    88.5% 62%,
    90% 63%,
    91.5% 63.5%,
    93% 63%,
    94.5% 62%,
    96% 60%,
    97.5% 58%,
    99% 56.5%,
    100% 55%,
    100% 100%,
    0% 100%
  );
}`;

  return {
    style: 'organic',
    css,
    description: 'Organic wave divider and flowing shapes — friendly, human-centered, natural',
  };
}

/**
 * Generate an animated blob pattern.
 * Best for: Gaming, food, ecommerce — playful, engaging, fun.
 *
 * Pattern: Animated morphing blob shapes using border-radius and keyframes.
 * Creates a sense of movement and energy.
 * Opacity: 0.12-0.18 for visibility but not dominance.
 */
function generateBlobPattern(palette: ColorPalette, themeMode: 'light' | 'dark'): BackgroundPattern {
  const backgroundColor = themeMode === 'light' ? palette.neutral50 : palette.neutral900;
  const blobColor1 = palette.primary;
  const blobColor2 = palette.secondary;

  const css = `/* Animated blob pattern */
body {
  background-color: ${backgroundColor};
  background-attachment: fixed;
  position: relative;
  overflow: hidden;
}

/* Animated blob decoration */
body::before {
  content: '';
  position: fixed;
  top: -10%;
  left: -5%;
  width: 500px;
  height: 500px;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  background: linear-gradient(135deg, ${blobColor1}, ${blobColor2});
  filter: blur(40px);
  opacity: 0.12;
  animation: morph 8s ease-in-out infinite;
  z-index: 0;
}

body::after {
  content: '';
  position: fixed;
  bottom: -15%;
  right: -5%;
  width: 400px;
  height: 400px;
  border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
  background: linear-gradient(135deg, ${blobColor2}, ${blobColor1});
  filter: blur(40px);
  opacity: 0.08;
  animation: morph 10s ease-in-out infinite reverse;
  z-index: 0;
}

@keyframes morph {
  0%, 100% {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  }
  25% {
    border-radius: 58% 42% 70% 30% / 70% 60% 30% 70%;
  }
  50% {
    border-radius: 70% 30% 30% 70% / 30% 70% 70% 30%;
  }
  75% {
    border-radius: 42% 58% 30% 70% / 70% 30% 70% 30%;
  }
}

/* Ensure content sits above blobs */
main, section, header, footer {
  position: relative;
  z-index: 1;
}`;

  return {
    style: 'blob',
    css,
    description: 'Animated morphing blobs — playful, energetic, engaging',
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Select the best pattern style for an industry.
 * This is deterministic — same industry always gets the same style.
 *
 * @param industry - The business context (finance, healthcare, gaming, etc.)
 * @returns The pattern style that best fits the industry
 */
export function selectBestPatternStyle(industry: Industry): PatternStyle {
  return selectPatternStyle(industry);
}

/**
 * Generate a complete background pattern for a page.
 * Includes both the pattern style selection and full CSS code.
 *
 * @param industry - The business context
 * @param palette - Color palette from color-engine
 * @param themeMode - 'light' or 'dark' theme
 * @param styleOverride - Optional explicit pattern style (if provided, ignores industry)
 * @returns BackgroundPattern with CSS ready to use
 */
export function generateBackground(
  industry: Industry,
  palette: ColorPalette,
  themeMode: 'light' | 'dark',
  styleOverride?: PatternStyle
): BackgroundPattern {
  // Determine pattern style: use override if provided, otherwise select by industry
  const patternStyle = styleOverride || selectPatternStyle(industry);

  // Dispatch to appropriate generator
  switch (patternStyle) {
    case 'geometric':
      return generateGeometricPattern(palette, themeMode);
    case 'gradient':
      return generateGradientPattern(palette, themeMode);
    case 'noise':
      return generateNoisePattern(palette, themeMode);
    case 'organic':
      return generateOrganicPattern(palette, themeMode);
    case 'blob':
      return generateBlobPattern(palette, themeMode);
    default:
      // Fallback to geometric if somehow an unknown style is passed
      return generateGeometricPattern(palette, themeMode);
  }
}

/**
 * Convert a BackgroundPattern to ready-to-use CSS.
 * The CSS is wrapped in a :root or body selector and ready to drop into a stylesheet.
 *
 * @param pattern - The BackgroundPattern object
 * @returns CSS string ready to use in a stylesheet
 */
export function backgroundToCss(pattern: BackgroundPattern): string {
  return `
/* Generated Pattern: ${pattern.style} */
/* Description: ${pattern.description} */

${pattern.css}
`;
}

/**
 * Convenience function: Generate and convert to CSS in one call.
 * Returns CSS as a string, no BackgroundPattern object wrapper.
 *
 * @param industry - Business context
 * @param palette - Color palette
 * @param themeMode - 'light' or 'dark'
 * @param styleOverride - Optional explicit pattern style
 * @returns CSS string ready to add to a stylesheet
 */
export function generateBackgroundCss(
  industry: Industry,
  palette: ColorPalette,
  themeMode: 'light' | 'dark',
  styleOverride?: PatternStyle
): string {
  const pattern = generateBackground(industry, palette, themeMode, styleOverride);
  return backgroundToCss(pattern);
}
