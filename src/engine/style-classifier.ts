/**
 * Style Classifier Engine
 *
 * Classifies UI components into one of 5 visual styles by analyzing their CSS
 * patterns and tags. Also provides industry/tone → style constraint mappings
 * so that explore_components and select_components can filter out incompatible
 * components (e.g., brutalist cards for a luxury restaurant).
 */

import type { ComponentStyle } from './types.js';

// ─── CSS Pattern Detection ──────────────────────────────────────────────────

interface CssSignals {
  hasBackdropBlur: boolean;
  hasRgbaBackground: boolean;
  hasGradient: boolean;
  hasNeumorphicShadow: boolean;
  keyframeCount: number;
  hasComplexTransitions: boolean;
  hasSolidBorders: boolean;
  hasSimpleShadow: boolean;
  hasNeonGlow: boolean;
}

function detectCssSignals(css: string): CssSignals {
  const lower = css.toLowerCase();

  // Glassmorphic signals
  const hasBackdropBlur = /backdrop-filter\s*:\s*blur/i.test(css);
  const hasRgbaBackground = /background\s*:.*rgba\s*\(/i.test(css) && hasBackdropBlur;

  // Gradient signals
  const hasGradient = /(?:linear|radial|conic)-gradient\s*\(/i.test(css);

  // Neumorphic: dual box-shadows with light + dark (inset often present)
  const shadowMatches = css.match(/box-shadow\s*:[^;]+/gi) || [];
  const hasNeumorphicShadow = shadowMatches.some(s => {
    const parts = s.split(',');
    // Neumorphic typically has 2+ shadow values, one light one dark
    return parts.length >= 2 && /inset/.test(s);
  });

  // Animation density
  const keyframeCount = (css.match(/@keyframes\s/gi) || []).length;

  // Complex transitions (multiple properties or transform chains)
  const transitionMatches = css.match(/transition\s*:[^;]+/gi) || [];
  const hasComplexTransitions = transitionMatches.length >= 3 ||
    (css.match(/transform\s*:/gi) || []).length >= 3;

  // Flat signals: solid borders, minimal effects
  const hasSolidBorders = /border\s*:\s*\d+px\s+solid/i.test(css);
  const hasSimpleShadow = shadowMatches.length <= 1 && !hasNeumorphicShadow;

  // Neon glow: box-shadow with bright colors + large spread
  const hasNeonGlow = shadowMatches.some(s =>
    /(?:0\s+0\s+\d{2,}px|text-shadow.*\d{2,}px)/i.test(s)
  );

  return {
    hasBackdropBlur,
    hasRgbaBackground,
    hasGradient,
    hasNeumorphicShadow,
    keyframeCount,
    hasComplexTransitions,
    hasSolidBorders,
    hasSimpleShadow,
    hasNeonGlow,
  };
}

// ─── Tag Pattern Detection ──────────────────────────────────────────────────

const TAG_STYLE_SIGNALS: Record<ComponentStyle, string[]> = {
  flat: ['simple', 'clean', 'minimal', 'flat', 'minimalist', 'basic'],
  neumorphic: ['neumorphic', 'neumorphism', 'soft', '3d', 'soft ui', 'emboss'],
  glassmorphic: ['glass', 'glassmorphic', 'glassmorphism', 'transparent', 'blur', 'frosted'],
  gradient: ['gradient', 'colorful', 'neon', 'glow', 'vibrant', 'rainbow'],
  animated: ['animated', 'brutalism', 'brutalist', 'glitch', 'experimental', 'orwellian', 'cyberpunk'],
};

function getTagStyleScore(tags: string[]): Record<ComponentStyle, number> {
  const scores: Record<ComponentStyle, number> = {
    flat: 0,
    neumorphic: 0,
    glassmorphic: 0,
    gradient: 0,
    animated: 0,
  };

  const lowerTags = tags.map(t => t.toLowerCase());

  for (const [style, signals] of Object.entries(TAG_STYLE_SIGNALS)) {
    for (const signal of signals) {
      if (lowerTags.some(tag => tag.includes(signal))) {
        scores[style as ComponentStyle] += 2;
      }
    }
  }

  return scores;
}

// ─── Main Classifier ────────────────────────────────────────────────────────

/**
 * Classifies a component into one of 5 visual styles by analyzing its CSS
 * patterns and tags. Uses a scoring system — highest score wins.
 */
export function classifyComponentStyle(css: string, tags: string[]): ComponentStyle {
  const signals = detectCssSignals(css);
  const tagScores = getTagStyleScore(tags);

  // CSS-based scoring
  const cssScores: Record<ComponentStyle, number> = {
    flat: 0,
    neumorphic: 0,
    glassmorphic: 0,
    gradient: 0,
    animated: 0,
  };

  // Glassmorphic: backdrop blur + rgba background
  if (signals.hasBackdropBlur) cssScores.glassmorphic += 5;
  if (signals.hasRgbaBackground) cssScores.glassmorphic += 3;

  // Neumorphic: dual inset shadows
  if (signals.hasNeumorphicShadow) cssScores.neumorphic += 5;

  // Gradient: gradient backgrounds
  if (signals.hasGradient) cssScores.gradient += 3;
  if (signals.hasNeonGlow) cssScores.gradient += 2;

  // Animated: heavy keyframes + complex transitions
  if (signals.keyframeCount >= 3) cssScores.animated += 4;
  else if (signals.keyframeCount >= 1) cssScores.animated += 2;
  if (signals.hasComplexTransitions) cssScores.animated += 2;

  // Flat: solid borders, simple shadow, no fancy effects
  if (signals.hasSolidBorders && signals.hasSimpleShadow) cssScores.flat += 3;
  if (!signals.hasGradient && !signals.hasBackdropBlur && !signals.hasNeumorphicShadow && signals.keyframeCount === 0) {
    cssScores.flat += 2;
  }

  // Combine CSS + tag scores
  const combined: Record<ComponentStyle, number> = {
    flat: cssScores.flat + tagScores.flat,
    neumorphic: cssScores.neumorphic + tagScores.neumorphic,
    glassmorphic: cssScores.glassmorphic + tagScores.glassmorphic,
    gradient: cssScores.gradient + tagScores.gradient,
    animated: cssScores.animated + tagScores.animated,
  };

  // Find highest scoring style
  let bestStyle: ComponentStyle = 'flat';
  let bestScore = -1;
  for (const [style, score] of Object.entries(combined)) {
    if (score > bestScore) {
      bestScore = score;
      bestStyle = style as ComponentStyle;
    }
  }

  // If all scores are 0 (no signals detected), default to flat (safest)
  if (bestScore === 0) return 'flat';

  return bestStyle;
}

// ─── Industry / Tone Constraints ────────────────────────────────────────────

export interface StyleConstraints {
  /** The ideal style for this industry+tone */
  preferredStyle: ComponentStyle;
  /** Styles that are acceptable (including preferred) */
  allowedStyles: ComponentStyle[];
  /** Tags that auto-reject a component */
  forbidTags: string[];
  /** Tags that boost a component's selection score */
  preferTags: string[];
}

const INDUSTRY_CONSTRAINTS: Record<string, StyleConstraints> = {
  luxury: {
    preferredStyle: 'glassmorphic',
    allowedStyles: ['glassmorphic', 'neumorphic', 'flat'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'experimental', 'orwellian', 'cyberpunk', 'retro'],
    preferTags: ['elegant', 'premium', 'smooth', 'clean', 'hover effect'],
  },
  restaurant: {
    preferredStyle: 'neumorphic',
    allowedStyles: ['neumorphic', 'flat', 'glassmorphic'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'experimental', 'orwellian', 'cyberpunk'],
    preferTags: ['clean', 'simple', 'smooth', 'card', 'hover effect'],
  },
  food: {
    preferredStyle: 'neumorphic',
    allowedStyles: ['neumorphic', 'flat', 'glassmorphic'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'experimental', 'orwellian', 'cyberpunk'],
    preferTags: ['clean', 'simple', 'smooth', 'card', 'hover effect'],
  },
  corporate: {
    preferredStyle: 'flat',
    allowedStyles: ['flat', 'neumorphic'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'neon', 'experimental', 'cyberpunk', 'gradient'],
    preferTags: ['clean', 'minimal', 'simple', 'professional'],
  },
  finance: {
    preferredStyle: 'flat',
    allowedStyles: ['flat', 'neumorphic'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'neon', 'experimental', 'cyberpunk'],
    preferTags: ['clean', 'minimal', 'simple', 'professional', 'secure'],
  },
  healthcare: {
    preferredStyle: 'flat',
    allowedStyles: ['flat', 'neumorphic'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'neon', 'experimental', 'cyberpunk', 'dark'],
    preferTags: ['clean', 'minimal', 'simple', 'accessible'],
  },
  education: {
    preferredStyle: 'flat',
    allowedStyles: ['flat', 'neumorphic', 'gradient'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'experimental', 'cyberpunk'],
    preferTags: ['clean', 'simple', 'colorful', 'friendly'],
  },
  technology: {
    preferredStyle: 'animated',
    allowedStyles: ['animated', 'gradient', 'glassmorphic', 'flat'],
    forbidTags: ['brutalism', 'brutalist', 'orwellian', 'occult', 'illuminati', 'horror', 'gothic', 'retro-game', 'pixel-art', 'toy', 'joke', 'meme', 'eye of providence', 'skull'],
    preferTags: ['modern', 'animated', 'hover effect', 'smooth', 'professional', 'clean'],
  },
  startup: {
    preferredStyle: 'gradient',
    allowedStyles: ['gradient', 'animated', 'glassmorphic'],
    forbidTags: ['brutalism', 'brutalist', 'orwellian'],
    preferTags: ['modern', 'gradient', 'colorful', 'bold'],
  },
  gaming: {
    preferredStyle: 'gradient',
    allowedStyles: ['gradient', 'animated', 'glassmorphic'],
    forbidTags: [],
    preferTags: ['neon', 'glow', 'animated', 'bold', 'cyberpunk', 'gradient'],
  },
  creative: {
    preferredStyle: 'gradient',
    allowedStyles: ['gradient', 'animated', 'glassmorphic'],
    forbidTags: [],
    preferTags: ['creative', 'colorful', 'animated', 'unique'],
  },
  ecommerce: {
    preferredStyle: 'animated',
    allowedStyles: ['animated', 'flat', 'neumorphic', 'gradient'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'orwellian'],
    preferTags: ['card', 'hover effect', 'clean', 'smooth'],
  },
  fitness: {
    preferredStyle: 'flat',
    allowedStyles: ['flat', 'animated'],
    forbidTags: ['brutalism', 'brutalist', 'neon', 'glitch', 'orwellian', 'cyberpunk', 'flip', '3d', 'search', 'filter'],
    preferTags: ['clean', 'simple', 'modern', 'hover effect'],
  },
  coaching: {
    preferredStyle: 'flat',
    allowedStyles: ['flat', 'neumorphic', 'animated'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'cyberpunk', 'flip', '3d', 'neon', 'search', 'filter'],
    preferTags: ['professional', 'clean', 'simple', 'modern'],
  },
  consulting: {
    preferredStyle: 'flat',
    allowedStyles: ['flat', 'neumorphic'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'neon', 'cyberpunk', 'playful', 'flip', '3d', 'search', 'filter'],
    preferTags: ['professional', 'corporate', 'clean', 'minimal'],
  },
};

const TONE_CONSTRAINTS: Record<string, StyleConstraints> = {
  elegant: {
    preferredStyle: 'glassmorphic',
    allowedStyles: ['glassmorphic', 'neumorphic', 'flat'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'experimental', 'orwellian', 'cyberpunk'],
    preferTags: ['elegant', 'premium', 'smooth', 'clean'],
  },
  minimal: {
    preferredStyle: 'flat',
    allowedStyles: ['flat', 'neumorphic'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'neon', 'experimental', 'gradient'],
    preferTags: ['minimal', 'clean', 'simple'],
  },
  bold: {
    preferredStyle: 'gradient',
    allowedStyles: ['gradient', 'animated'],
    forbidTags: [],
    preferTags: ['bold', 'gradient', 'neon', 'glow'],
  },
  playful: {
    preferredStyle: 'gradient',
    allowedStyles: ['gradient', 'animated', 'glassmorphic'],
    forbidTags: ['brutalism', 'orwellian'],
    preferTags: ['colorful', 'fun', 'animated', 'playful'],
  },
  modern: {
    preferredStyle: 'animated',
    allowedStyles: ['animated', 'gradient', 'glassmorphic'],
    forbidTags: ['brutalism', 'brutalist', 'orwellian'],
    preferTags: ['modern', 'smooth', 'hover effect'],
  },
  warm: {
    preferredStyle: 'neumorphic',
    allowedStyles: ['neumorphic', 'flat', 'glassmorphic'],
    forbidTags: ['brutalism', 'brutalist', 'glitch', 'cyberpunk', 'orwellian'],
    preferTags: ['warm', 'soft', 'clean', 'simple'],
  },
};

/**
 * Resolves style constraints from industry + tone.
 * Tone takes priority over industry. Merges forbidTags from both.
 */
export function getStyleConstraints(industry?: string, tone?: string): StyleConstraints {
  const lower = (s?: string) => (s || '').toLowerCase().trim();

  const indConstraints = INDUSTRY_CONSTRAINTS[lower(industry)];
  const toneConstraints = TONE_CONSTRAINTS[lower(tone)];

  // If neither matches, return permissive defaults
  if (!indConstraints && !toneConstraints) {
    return {
      preferredStyle: 'animated',
      allowedStyles: ['flat', 'neumorphic', 'glassmorphic', 'gradient', 'animated'],
      forbidTags: [],
      preferTags: [],
    };
  }

  // Tone takes priority for preferred/allowed; merge forbid/prefer from both
  const primary = toneConstraints || indConstraints!;
  const secondary = toneConstraints ? indConstraints : undefined;

  const mergedForbid = new Set([
    ...primary.forbidTags,
    ...(secondary?.forbidTags || []),
  ]);

  const mergedPrefer = new Set([
    ...primary.preferTags,
    ...(secondary?.preferTags || []),
  ]);

  return {
    preferredStyle: primary.preferredStyle,
    allowedStyles: primary.allowedStyles,
    forbidTags: [...mergedForbid],
    preferTags: [...mergedPrefer],
  };
}

/**
 * Scores a component against style constraints.
 * Returns a number 0-100 where higher = better fit.
 * Returns -1 if the component should be rejected entirely.
 */
export function scoreComponentFit(
  css: string,
  tags: string[],
  constraints: StyleConstraints
): number {
  const lowerTags = tags.map(t => t.toLowerCase());

  // Hard reject: any forbid tag present
  for (const forbid of constraints.forbidTags) {
    if (lowerTags.some(tag => tag.includes(forbid))) {
      return -1;
    }
  }

  // Also check CSS comments for forbid tags (UIverse components often have tags in comments)
  const cssComment = (css.match(/\/\*.*?\*\//gs) || []).join(' ').toLowerCase();
  for (const forbid of constraints.forbidTags) {
    if (cssComment.includes(forbid)) {
      return -1;
    }
  }

  // Scan full CSS body for forbid keywords (catches keyframe names, selectors, class names)
  const cssLower = css.toLowerCase();
  for (const forbid of constraints.forbidTags) {
    if (cssLower.includes(forbid)) {
      return -1;
    }
  }

  // Reject 3D transforms when '3d' or 'flip' is forbidden
  const has3dForbidden = constraints.forbidTags.some(t => t === '3d' || t === 'flip');
  if (has3dForbidden && /perspective|rotatey|rotatex|backface-visibility/.test(cssLower)) {
    return -1;
  }

  // Classify the component's actual style
  const componentStyle = classifyComponentStyle(css, tags);

  let score = 50; // base score

  // Style match scoring
  if (componentStyle === constraints.preferredStyle) {
    score += 30;
  } else if (constraints.allowedStyles.includes(componentStyle)) {
    score += 15;
  } else {
    // Style not in allowed list — penalize but don't reject
    score -= 20;
  }

  // Prefer tag bonus
  for (const prefer of constraints.preferTags) {
    if (lowerTags.some(tag => tag.includes(prefer)) || cssComment.includes(prefer)) {
      score += 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}