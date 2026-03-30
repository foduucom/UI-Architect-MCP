/**
 * UI Architect MCP — Core Type Definitions
 * Every type used across the engine lives here.
 */

// ─── Industry & Business Context ─────────────────────────────────────────────

export type Industry =
  | 'finance'
  | 'healthcare'
  | 'technology'
  | 'ecommerce'
  | 'education'
  | 'food'
  | 'realestate'
  | 'legal'
  | 'creative'
  | 'environmental'
  | 'gaming'
  | 'nonprofit'
  | 'luxury'
  | 'startup'
  | 'corporate'
  | 'fitness'
  | 'wellness'
  | 'hospitality'
  | 'entertainment'
  | 'coaching'
  | 'consulting';

export type Tone =
  | 'corporate'
  | 'modern'
  | 'playful'
  | 'minimal'
  | 'luxury'
  | 'technical'
  | 'warm'
  | 'bold'
  | 'elegant';

export type ThemeMode = 'light' | 'dark' | 'auto';

// ─── Color System ────────────────────────────────────────────────────────────

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryRgb: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  accentLight: string;
  neutral900: string;
  neutral900Rgb: string;
  neutral700: string;
  neutral500: string;
  neutral300: string;
  neutral200: string;
  neutral100: string;
  neutral50: string;
  neutral50Rgb: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
}

// ─── Typography System ───────────────────────────────────────────────────────

export interface FontPairing {
  heading: string;
  body: string;
  googleFontsUrl: string;
}

export interface TypographySystem {
  fonts: FontPairing;
  scale: {
    display: string;
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    body: string;
    small: string;
    caption: string;
  };
  lineHeights: {
    heading: string;
    body: string;
    ui: string;
  };
  weights: {
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

// ─── Spacing System ──────────────────────────────────────────────────────────

export interface SpacingSystem {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
}

// ─── Shadow System ───────────────────────────────────────────────────────────

export interface ShadowSystem {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

// ─── Border Radius System ────────────────────────────────────────────────────

export interface RadiusSystem {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

// ─── Transition System ───────────────────────────────────────────────────────

export interface TransitionSystem {
  fast: string;
  base: string;
  slow: string;
  spring: string;
  easeOutExpo: string;
  easeInExpo: string;
  easeInOutExpo: string;
  easeSpring: string;
  easeSmooth: string;
}

// ─── Complete Design Token Set ───────────────────────────────────────────────

export interface DesignTokens {
  themeMode: ThemeMode;
  industry: Industry;
  tone: Tone;
  colors: ColorPalette;
  typography: TypographySystem;
  spacing: SpacingSystem;
  shadows: ShadowSystem;
  radius: RadiusSystem;
  transitions: TransitionSystem;
}

// ─── Component System ────────────────────────────────────────────────────────

export type ComponentCategory =
  | 'button-primary'
  | 'button-secondary'
  | 'card'
  | 'input'
  | 'checkbox'
  | 'toggle'
  | 'radio'
  | 'tooltip'
  | 'modal'
  | 'loader'
  | 'badge'
  | 'dropdown'
  | 'navigation';

export type ComponentStyle =
  | 'flat'           // Clean, minimal borders, subtle shadows — corporate/SaaS/healthcare
  | 'neumorphic'     // Soft raised/inset shadows, light backgrounds — modern/premium
  | 'glassmorphic'   // Backdrop blur, transparency, frosted glass — creative/startup/tech
  | 'gradient'       // Gradient fills, bold colors, high energy — gaming/creative/startup
  | 'animated';      // Heavy CSS animation focus — the original high-animation set

export type Framework =
  | 'html'
  | 'react'
  | 'nextjs'
  | 'vue'
  | 'nuxt'
  | 'angular'
  | 'svelte'
  | 'astro';

export interface ComponentDefinition {
  id: string;
  category: ComponentCategory;
  style: ComponentStyle;
  name: string;
  description: string;
  tags: string[];
  animationLevel: 'low' | 'medium' | 'high';
  /** The raw HTML/CSS template before adaptation */
  html: string;
  css: string;
  /** Optional JS for interactive behavior */
  js?: string;
}

export interface AdaptedComponent {
  id: string;
  category: ComponentCategory;
  name: string;
  framework: Framework;
  code: string;
  styles: string;
  js?: string;
  accessibilityNotes: string[];
}

// ─── Design Token Registry (Component Consistency) ───────────────────────────

export interface DesignTokenRegistry {
  [key: string]: {
    componentId: string;
    lockedStyle: string;
  };
}

// ─── Background Pattern System ───────────────────────────────────────────────

export type PatternStyle = 'geometric' | 'gradient' | 'noise' | 'organic' | 'blob';

export interface BackgroundPattern {
  style: PatternStyle;
  css: string;
  description: string;
}

// ─── MCP Tool I/O Types ──────────────────────────────────────────────────────

export interface DesignThemeInput {
  industry: string;
  tone: string;
  themePreference?: ThemeMode;
  brandColor?: string;
  /** Brand name — used to vary design tokens between projects in the same industry */
  brandName?: string;
}

export interface DesignThemeOutput {
  tokens: DesignTokens;
  cssVariables: string;
  summary: string;
}

export interface SelectComponentsInput {
  componentTypes: string[];
  designTokens: DesignTokens;
  framework: Framework;
  animationPreference?: 'low' | 'medium' | 'high';
  style?: ComponentStyle;
}

export interface SelectComponentsOutput {
  components: AdaptedComponent[];
  registry: DesignTokenRegistry;
  summary: string;
}

export interface GenerateBackgroundInput {
  industry: string;
  theme: ThemeMode;
  style?: PatternStyle;
}

export interface GenerateBackgroundOutput {
  pattern: BackgroundPattern;
  css: string;
}
