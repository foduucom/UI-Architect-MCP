/**
 * MCP Tool: generate_background
 *
 * Phase 4 — Generates CSS background patterns appropriate
 * for the industry, theme, and design context.
 */

import type {
  GenerateBackgroundInput,
  GenerateBackgroundOutput,
  Industry,
  PatternStyle,
  ColorPalette,
} from '../engine/types.js';
import { generateBackground as genBg, backgroundToCss } from '../engine/pattern-engine.js';

// ─── Industry Resolution (reuse logic from design-theme) ─────────────────────

function resolveIndustry(input: string): Industry {
  const lower = input.toLowerCase().trim();
  const industries: Industry[] = [
    'finance', 'healthcare', 'technology', 'ecommerce', 'education',
    'food', 'realestate', 'legal', 'creative', 'environmental',
    'gaming', 'nonprofit', 'luxury', 'startup', 'corporate',
  ];

  if (industries.includes(lower as Industry)) return lower as Industry;

  const aliases: Record<string, Industry> = {
    'fintech': 'finance', 'banking': 'finance', 'medical': 'healthcare',
    'saas': 'technology', 'tech': 'technology', 'software': 'technology',
    'shop': 'ecommerce', 'retail': 'ecommerce', 'restaurant': 'food',
    'property': 'realestate', 'law': 'legal', 'agency': 'creative',
    'design': 'creative', 'eco': 'environmental', 'ngo': 'nonprofit',
    'game': 'gaming', 'fashion': 'luxury', 'enterprise': 'corporate',
    'b2b': 'corporate', 'startup': 'startup',
  };

  for (const [alias, ind] of Object.entries(aliases)) {
    if (lower.includes(alias)) return ind;
  }

  return 'technology';
}

function resolvePatternStyle(input?: string): PatternStyle | undefined {
  if (!input) return undefined;
  const valid: PatternStyle[] = ['geometric', 'gradient', 'noise', 'organic', 'blob'];
  const lower = input.toLowerCase().trim();
  if (valid.includes(lower as PatternStyle)) return lower as PatternStyle;

  const aliases: Record<string, PatternStyle> = {
    'dots': 'geometric', 'grid': 'geometric', 'lines': 'geometric',
    'mesh': 'gradient', 'aurora': 'gradient', 'glow': 'gradient',
    'texture': 'noise', 'grain': 'noise', 'paper': 'noise',
    'wave': 'organic', 'waves': 'organic', 'curve': 'organic',
    'blobs': 'blob', 'abstract': 'blob', 'liquid': 'blob',
  };

  return aliases[lower] || undefined;
}

// ─── Main Tool Function ──────────────────────────────────────────────────────

export function generateBackgroundTool(
  input: GenerateBackgroundInput,
  palette: ColorPalette
): GenerateBackgroundOutput {
  const industry = resolveIndustry(input.industry);
  const themeMode: 'light' | 'dark' = input.theme === 'dark' ? 'dark'
    : input.theme === 'light' ? 'light'
    : 'light'; // explicit fallback for any unexpected value
  const styleOverride = resolvePatternStyle(input.style);

  const pattern = genBg(industry, palette, themeMode, styleOverride);
  const css = backgroundToCss(pattern);

  return { pattern, css };
}
