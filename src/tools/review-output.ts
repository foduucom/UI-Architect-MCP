/**
 * MCP Tool: review_output
 *
 * Phase 7 — Project Manager Review / QA
 *
 * Analyzes generated code against the CLAUDE.md quality checklist.
 * Flags anti-patterns, accessibility issues, consistency problems.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReviewInput {
  code: string;
  css?: string; // External CSS code (if separate from HTML)
  js?: string; // External JS code (if separate from HTML)
  industry?: string;
  checkAccessibility?: boolean;
  checkAnimations?: boolean;
  checkConsistency?: boolean;
  checkAntiPatterns?: boolean;
}

export interface ReviewIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  suggestion: string;
}

export interface ReviewOutput {
  issues: ReviewIssue[];
  score: number;
  passed: boolean;
  summary: string;
}

// ─── Anti-Pattern Detectors ─────────────────────────────────────────────────

function checkForAIGradients(code: string): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  // Purple-blue gradient (the #1 AI tell)
  const purpleBluePatterns = [
    /linear-gradient\([^)]*#[67][0-9a-f]{2}[e-f][a-f][a-f][^)]*#[78][0-9a-f]{2}[b-f][a-f][0-9a-f]/gi,
    /gradient[^;]*(?:purple|violet|indigo)[^;]*(?:blue|cyan)/gi,
    /gradient[^;]*#667[0-9a-f]{3}[^;]*#764[0-9a-f]{3}/gi,
    /#667eea/gi,
    /#764ba2/gi,
  ];

  for (const pattern of purpleBluePatterns) {
    if (pattern.test(code)) {
      issues.push({
        severity: 'error',
        category: 'Anti-Pattern',
        message: 'Purple-blue gradient detected — this is the #1 sign of AI-generated design.',
        suggestion:
          'Replace with industry-appropriate colors from your design tokens using var(--color-primary) and var(--color-secondary).',
      });
      break;
    }
  }

  return issues;
}

function checkForHardcodedColors(code: string): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  // Find hex colors that aren't in CSS variable declarations
  const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
  const lines = code.split('\n');
  let hardcodedCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip variable declarations, comments, SVG, and meta tags
    if (
      trimmed.startsWith('--color') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('//') ||
      trimmed.includes('<meta') ||
      trimmed.includes('<svg') ||
      trimmed.includes('<path') ||
      trimmed.includes('<rect') ||
      trimmed.includes('<circle') ||
      trimmed.includes('url(') ||
      trimmed.includes('charset')
    )
      continue;

    const matches = trimmed.match(hexPattern);
    if (matches) {
      for (const match of matches) {
        // Skip common exceptions: #000, #fff, #111, transparent borders
        if (['#000', '#fff', '#FFF', '#000000', '#ffffff', '#FFFFFF'].includes(match)) continue;
        hardcodedCount++;
      }
    }
  }

  if (hardcodedCount > 0) {
    issues.push({
      severity: hardcodedCount > 5 ? 'error' : 'warning',
      category: 'Design Tokens',
      message: `Found ${hardcodedCount} hardcoded color value(s). All colors should use CSS custom properties.`,
      suggestion:
        'Replace hardcoded hex/rgb values with var(--color-*) references from your design token system.',
    });
  }

  // Check for pure black/white
  if (code.includes('color: #000') || code.includes('color: #000000') || code.includes('color: black')) {
    issues.push({
      severity: 'warning',
      category: 'Design Tokens',
      message: 'Pure black (#000) detected for text. Use a tinted dark color instead.',
      suggestion: 'Replace with var(--color-neutral-900) which is tinted toward your primary hue.',
    });
  }

  if (code.includes('background: #fff') || code.includes('background: #ffffff') || code.includes('background: white')) {
    issues.push({
      severity: 'warning',
      category: 'Design Tokens',
      message: 'Pure white (#fff) detected for background. Use a tinted off-white instead.',
      suggestion: 'Replace with var(--color-neutral-50) for a subtly tinted background.',
    });
  }

  return issues;
}

function checkForAccessibility(code: string): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  // Check for alt text on images
  const imgTags = code.match(/<img[^>]*>/g) || [];
  for (const img of imgTags) {
    if (!img.includes('alt=')) {
      issues.push({
        severity: 'error',
        category: 'Accessibility',
        message: 'Image missing alt attribute.',
        suggestion:
          'Add descriptive alt text to all <img> elements. Use alt="" for decorative images.',
      });
      break;
    }
  }

  // Check for form labels
  const inputs = code.match(/<input[^>]*>/g) || [];
  for (const input of inputs) {
    if (!input.includes('aria-label') && !input.includes('id=')) {
      issues.push({
        severity: 'warning',
        category: 'Accessibility',
        message: 'Form input may be missing an associated label.',
        suggestion: 'Add a <label for="id"> element or aria-label attribute to every form input.',
      });
      break;
    }
  }

  // Check for heading hierarchy
  const headings = code.match(/<h[1-6][^>]*>/g) || [];
  if (headings.length > 0) {
    const levels = headings.map((h) => parseInt(h.charAt(2)));
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) {
        issues.push({
          severity: 'warning',
          category: 'Accessibility',
          message: `Heading level skip detected (h${levels[i - 1]} → h${levels[i]}). Headings should not skip levels.`,
          suggestion: 'Ensure heading levels follow a logical order without skipping (h1 → h2 → h3).',
        });
        break;
      }
    }
  }

  // Check for nav landmark
  if (code.includes('<nav') && !code.includes('aria-label')) {
    issues.push({
      severity: 'info',
      category: 'Accessibility',
      message: 'Navigation element could benefit from an aria-label.',
      suggestion: 'Add aria-label="Main navigation" to the <nav> element for screen readers.',
    });
  }

  // Check for button type
  const buttons = code.match(/<button[^>]*>/g) || [];
  for (const btn of buttons) {
    if (!btn.includes('type=')) {
      issues.push({
        severity: 'info',
        category: 'Accessibility',
        message: 'Button missing explicit type attribute (defaults to "submit").',
        suggestion:
          'Add type="button" or type="submit" explicitly to prevent unexpected form submissions.',
      });
      break;
    }
  }

  return issues;
}

function checkForAnimations(code: string): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  if (!code.includes('animate-on-scroll') && !code.includes('animation') && !code.includes('@keyframes')) {
    issues.push({
      severity: 'error',
      category: 'Animation',
      message: 'No scroll-triggered animations detected. Every section should have entrance animations.',
      suggestion:
        'Add the .animate-on-scroll class to elements and wire up Intersection Observer.',
    });
  }

  if (!code.includes(':hover')) {
    issues.push({
      severity: 'warning',
      category: 'Animation',
      message: 'No hover effects detected. Interactive elements need hover states.',
      suggestion:
        'Add :hover styles with transform, box-shadow, or color transitions to buttons, cards, and links.',
    });
  }

  if (!code.includes(':focus')) {
    issues.push({
      severity: 'warning',
      category: 'Animation',
      message: 'No focus styles detected. Keyboard users need visible focus indicators.',
      suggestion:
        'Add :focus styles with outline or box-shadow to all interactive elements.',
    });
  }

  if (!code.includes('transition')) {
    issues.push({
      severity: 'warning',
      category: 'Animation',
      message: 'No CSS transitions detected. State changes should be smooth, not instant.',
      suggestion:
        'Add transition properties to elements that change on hover/focus/active.',
    });
  }

  return issues;
}

function checkForResponsiveness(code: string): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  if (!code.includes('@media')) {
    issues.push({
      severity: 'error',
      category: 'Responsive',
      message: 'No media queries detected. The page must be responsive at all breakpoints.',
      suggestion:
        'Add media queries for tablet (768px), desktop (1024px), and wide (1280px) breakpoints.',
    });
  }

  if (code.includes('position: fixed') && !code.includes('max-width')) {
    issues.push({
      severity: 'info',
      category: 'Responsive',
      message: 'Fixed positioning detected. Ensure it works correctly on mobile viewports.',
      suggestion:
        'Test fixed elements on small screens and consider using sticky positioning as an alternative.',
    });
  }

  return issues;
}

function checkForSemanticHTML(code: string): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  // Check for div soup
  const divCount = (code.match(/<div/g) || []).length;
  const semanticCount = (code.match(/<(?:section|article|header|footer|nav|main|aside)/g) || []).length;

  if (divCount > 0 && semanticCount === 0) {
    issues.push({
      severity: 'error',
      category: 'Semantic HTML',
      message: 'No semantic HTML elements found. All <div> containers should use proper semantic tags.',
      suggestion:
        'Replace generic <div> wrappers with <section>, <article>, <header>, <footer>, <nav>, <main>, or <aside>.',
    });
  }

  // Check for meta viewport
  if (code.includes('<!DOCTYPE') && !code.includes('viewport')) {
    issues.push({
      severity: 'error',
      category: 'Semantic HTML',
      message: 'Missing viewport meta tag. Required for responsive design.',
      suggestion:
        'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> to the <head>.',
    });
  }

  return issues;
}

function checkForSinglePageAntiPattern(code: string): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  // Check if there's JS-based page hiding (single-page anti-pattern)
  if (
    code.includes('display: none') &&
    code.includes('display: block') &&
    (code.includes('querySelector') || code.includes('getElementById'))
  ) {
    issues.push({
      severity: 'error',
      category: 'Architecture',
      message:
        'JS-based page switching detected (show/hide divs). Multi-page websites should use separate HTML files or framework routing.',
      suggestion:
        'Create separate .html files for each page, or use a framework router (React Router, Vue Router, etc.).',
    });
  }

  return issues;
}

function checkForComponentConsistency(code: string): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  // Count distinct button variants
  const btnPrimaryCount = (code.match(/\.btn-primary/g) || []).length;
  const btnSecondaryCount = (code.match(/\.btn-secondary/g) || []).length;
  const btnCustomCount = (code.match(/\.btn-[a-z-]+(?!primary|secondary)/g) || []).length;

  if (btnCustomCount > 0) {
    issues.push({
      severity: 'warning',
      category: 'Design Consistency',
      message: 'More than 2 button variants detected. Limit to primary + secondary.',
      suggestion: 'Consolidate button styles to reduce visual noise. Use color modifiers, not style variants.',
    });
  }

  // Check for inline styles (inconsistency)
  const inlineStyles = code.match(/style="[^"]*"/g) || [];
  if (inlineStyles.length > 5) {
    issues.push({
      severity: 'warning',
      category: 'Design Consistency',
      message: `${inlineStyles.length} inline styles detected. Use CSS classes instead.`,
      suggestion:
        'Move all inline styles to CSS classes. Inline styles break design consistency and make updates harder.',
    });
  }

  return issues;
}

// ─── Main Tool Function ─────────────────────────────────────────────────────

export function reviewOutput(input: ReviewInput): ReviewOutput {
  // Merge HTML + external CSS + external JS so all checks see the complete codebase
  const code = [input.code, input.css || '', input.js || ''].filter(Boolean).join('\n');
  const issues: ReviewIssue[] = [];

  // Warn if HTML references external CSS but none was provided for review
  if (!input.css && input.code.includes('rel="stylesheet"')) {
    issues.push({
      severity: 'info',
      category: 'Review',
      message: 'HTML references external CSS files but no CSS was provided to review. Pass the CSS content via the "css" parameter for accurate animation, hover, and responsive checks.',
      suggestion: 'Include the contents of your external CSS files in the "css" parameter.',
    });
  }

  // Always run these checks
  issues.push(...checkForAIGradients(code));
  issues.push(...checkForHardcodedColors(code));
  issues.push(...checkForSinglePageAntiPattern(code));
  issues.push(...checkForSemanticHTML(code));
  issues.push(...checkForResponsiveness(code));
  issues.push(...checkForComponentConsistency(code));

  // Optional checks
  if (input.checkAccessibility !== false) {
    issues.push(...checkForAccessibility(code));
  }
  if (input.checkAnimations !== false) {
    issues.push(...checkForAnimations(code));
  }

  // Calculate score
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const score = Math.max(0, 100 - errorCount * 15 - warningCount * 5 - infoCount * 1);
  const passed = errorCount === 0 && score >= 70;

  // Build summary
  let summary = `## Code Review Complete

**Score:** ${score}/100 ${passed ? '✅ PASSED' : '❌ NEEDS FIXES'}
**Issues:** ${errorCount} errors, ${warningCount} warnings, ${infoCount} info

`;

  if (errorCount > 0) {
    summary += `### Errors (Must Fix)\n`;
    for (const issue of issues.filter((i) => i.severity === 'error')) {
      summary += `- ❌ **[${issue.category}]** ${issue.message}\n  → Fix: ${issue.suggestion}\n`;
    }
    summary += '\n';
  }

  if (warningCount > 0) {
    summary += `### Warnings (Should Fix)\n`;
    for (const issue of issues.filter((i) => i.severity === 'warning')) {
      summary += `- ⚠️ **[${issue.category}]** ${issue.message}\n  → Fix: ${issue.suggestion}\n`;
    }
    summary += '\n';
  }

  if (infoCount > 0) {
    summary += `### Info (Nice to Fix)\n`;
    for (const issue of issues.filter((i) => i.severity === 'info')) {
      summary += `- ℹ️ **[${issue.category}]** ${issue.message}\n  → ${issue.suggestion}\n`;
    }
    summary += '\n';
  }

  if (issues.length === 0) {
    summary += '### All Checks Passed! ✅\nThe code meets all quality standards.\n';
  }

  return { issues, score, passed, summary };
}
