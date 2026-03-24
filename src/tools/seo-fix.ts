/**
 * MCP Tool: seo_fix
 *
 * Auto-patches HTML code based on SEO audit issues.
 * Applies deterministic fixes for common SEO problems
 * (missing meta tags, alt text, heading structure, etc.)
 * No LLM required — all fixes are rule-based.
 */

import type { SeoIssue, SeoAuditOutput } from './seo-audit.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SeoFixInput {
  /** The HTML code to fix */
  html: string;
  /** CSS code (returned as-is, but may be referenced for fixes) */
  css: string;
  /** The SEO audit output containing issues to fix */
  auditResult: SeoAuditOutput;
  /** Industry for contextual meta content */
  industry?: string;
  /** Page name */
  pageName?: string;
  /** Target keywords to weave into fixes */
  targetKeywords?: string[];
}

export interface SeoFix {
  category: string;
  description: string;
  applied: boolean;
  details?: string;
}

export interface SeoFixOutput {
  html: string;
  css: string;
  fixesApplied: SeoFix[];
  fixCount: number;
  estimatedScoreImprovement: number;
  summary: string;
}

// ─── Deterministic Fixes ────────────────────────────────────────────────────

function fixMissingViewport(html: string): { html: string; fixed: boolean } {
  if (html.includes('name="viewport"')) return { html, fixed: false };

  const viewportTag = '  <meta name="viewport" content="width=device-width, initial-scale=1.0">';

  if (html.includes('<head>')) {
    return {
      html: html.replace('<head>', `<head>\n${viewportTag}`),
      fixed: true,
    };
  }
  return { html, fixed: false };
}

function fixMissingCharset(html: string): { html: string; fixed: boolean } {
  if (html.includes('charset=')) return { html, fixed: false };

  const charsetTag = '  <meta charset="UTF-8">';

  if (html.includes('<head>')) {
    return {
      html: html.replace('<head>', `<head>\n${charsetTag}`),
      fixed: true,
    };
  }
  return { html, fixed: false };
}

function fixMissingTitle(html: string, pageName: string): { html: string; fixed: boolean } {
  if (html.includes('<title>') && !html.includes('<title></title>')) {
    return { html, fixed: false };
  }

  const titleTag = `  <title>${pageName}</title>`;

  if (html.includes('<title></title>')) {
    return {
      html: html.replace('<title></title>', `<title>${pageName}</title>`),
      fixed: true,
    };
  }

  if (html.includes('</head>')) {
    return {
      html: html.replace('</head>', `${titleTag}\n</head>`),
      fixed: true,
    };
  }
  return { html, fixed: false };
}

function fixMissingMetaDescription(
  html: string,
  pageName: string,
  industry: string
): { html: string; fixed: boolean } {
  if (html.includes('name="description"')) return { html, fixed: false };

  const desc = `Professional ${industry} solutions — ${pageName}. Discover features, pricing, and more.`;
  const metaTag = `  <meta name="description" content="${desc}">`;

  if (html.includes('</head>')) {
    return {
      html: html.replace('</head>', `${metaTag}\n</head>`),
      fixed: true,
    };
  }
  return { html, fixed: false };
}

function fixMissingLangAttribute(html: string): { html: string; fixed: boolean } {
  if (html.includes('lang="')) return { html, fixed: false };

  if (html.includes('<html>')) {
    return {
      html: html.replace('<html>', '<html lang="en">'),
      fixed: true,
    };
  }
  if (html.includes('<html ')) {
    return {
      html: html.replace('<html ', '<html lang="en" '),
      fixed: true,
    };
  }
  return { html, fixed: false };
}

function fixMissingImageAlts(html: string): { html: string; fixed: boolean; count: number } {
  // Find <img> tags without alt attribute
  const imgWithoutAlt = /<img(?![^>]*alt=)[^>]*>/gi;
  const matches = html.match(imgWithoutAlt);

  if (!matches || matches.length === 0) return { html, fixed: false, count: 0 };

  let fixedHtml = html;
  let count = 0;

  for (const match of matches) {
    // Try to extract a meaningful alt from src
    const srcMatch = match.match(/src="([^"]+)"/);
    let alt = 'Image';
    if (srcMatch) {
      const filename = srcMatch[1].split('/').pop()?.split('.')[0]?.replace(/[-_]/g, ' ') || 'Image';
      alt = filename.charAt(0).toUpperCase() + filename.slice(1);
    }

    const fixed = match.replace('<img', `<img alt="${alt}"`);
    fixedHtml = fixedHtml.replace(match, fixed);
    count++;
  }

  return { html: fixedHtml, fixed: count > 0, count };
}

function fixMissingOpenGraph(
  html: string,
  pageName: string,
  industry: string
): { html: string; fixed: boolean } {
  if (html.includes('og:title')) return { html, fixed: false };

  const desc = `Professional ${industry} solutions — ${pageName}`;
  const ogTags = `  <meta property="og:title" content="${pageName}">
  <meta property="og:description" content="${desc}">
  <meta property="og:type" content="website">`;

  if (html.includes('</head>')) {
    return {
      html: html.replace('</head>', `${ogTags}\n</head>`),
      fixed: true,
    };
  }
  return { html, fixed: false };
}

function fixMissingCanonical(html: string): { html: string; fixed: boolean } {
  if (html.includes('rel="canonical"')) return { html, fixed: false };

  const canonicalTag = '  <link rel="canonical" href="/">';

  if (html.includes('</head>')) {
    return {
      html: html.replace('</head>', `${canonicalTag}\n</head>`),
      fixed: true,
    };
  }
  return { html, fixed: false };
}

function fixHeadingHierarchy(html: string): { html: string; fixed: boolean } {
  // Check if there's no h1 but there are h2s
  const hasH1 = /<h1[\s>]/i.test(html);
  const hasH2 = /<h2[\s>]/i.test(html);

  if (hasH1 || !hasH2) return { html, fixed: false };

  // Promote first h2 to h1
  let promoted = false;
  const fixedHtml = html.replace(/<h2([\s>])/i, (match, rest) => {
    promoted = true;
    return `<h1${rest}`;
  }).replace(/<\/h2>/i, () => {
    return promoted ? '</h1>' : '</h2>';
  });

  return { html: fixedHtml, fixed: promoted };
}

function fixMissingSkipNav(html: string): { html: string; fixed: boolean } {
  if (html.includes('skip-nav') || html.includes('skip-to-content') || html.includes('#main-content')) {
    return { html, fixed: false };
  }

  const skipNav = `  <a href="#main-content" class="skip-nav" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:9999">Skip to main content</a>`;

  if (html.includes('<body>')) {
    return {
      html: html.replace('<body>', `<body>\n${skipNav}`),
      fixed: true,
    };
  }
  if (html.includes('<body ')) {
    return {
      html: html.replace(/<body([^>]*)>/, `<body$1>\n${skipNav}`),
      fixed: true,
    };
  }
  return { html, fixed: false };
}

function addLazyLoading(html: string): { html: string; fixed: boolean; count: number } {
  // Add loading="lazy" to images that don't have it (skip first image which is likely hero)
  const imgTags = html.match(/<img[^>]+>/gi) || [];
  let fixedHtml = html;
  let count = 0;
  let isFirst = true;

  for (const img of imgTags) {
    if (isFirst) { isFirst = false; continue; } // skip hero image
    if (img.includes('loading=')) continue;

    const fixed = img.replace('<img', '<img loading="lazy"');
    fixedHtml = fixedHtml.replace(img, fixed);
    count++;
  }

  return { html: fixedHtml, fixed: count > 0, count };
}

// ─── Main Fix Function ──────────────────────────────────────────────────────

export async function seoFix(input: SeoFixInput): Promise<SeoFixOutput> {
  let html = input.html;
  const css = input.css;
  const fixes: SeoFix[] = [];
  const pageName = input.pageName || 'Page';
  const industry = input.industry || 'technology';
  const keywords = input.targetKeywords || [];

  const issueCategories = new Set(input.auditResult.issues.map((i) => i.category));

  // ── Apply deterministic fixes based on audit issues ──

  // Meta tags
  if (issueCategories.has('meta-tags') || input.auditResult.missingElements.length > 0) {
    const viewport = fixMissingViewport(html);
    if (viewport.fixed) {
      html = viewport.html;
      fixes.push({ category: 'meta-tags', description: 'Added viewport meta tag', applied: true });
    }

    const charset = fixMissingCharset(html);
    if (charset.fixed) {
      html = charset.html;
      fixes.push({ category: 'meta-tags', description: 'Added charset meta tag', applied: true });
    }

    const title = fixMissingTitle(html, pageName);
    if (title.fixed) {
      html = title.html;
      fixes.push({ category: 'meta-tags', description: `Added page title: "${pageName}"`, applied: true });
    }

    const metaDesc = fixMissingMetaDescription(html, pageName, industry);
    if (metaDesc.fixed) {
      html = metaDesc.html;
      fixes.push({ category: 'meta-tags', description: 'Added meta description', applied: true });
    }

    const og = fixMissingOpenGraph(html, pageName, industry);
    if (og.fixed) {
      html = og.html;
      fixes.push({ category: 'social-media', description: 'Added Open Graph meta tags', applied: true });
    }

    const canonical = fixMissingCanonical(html);
    if (canonical.fixed) {
      html = canonical.html;
      fixes.push({ category: 'technical', description: 'Added canonical link tag', applied: true });
    }
  }

  // Language attribute
  const lang = fixMissingLangAttribute(html);
  if (lang.fixed) {
    html = lang.html;
    fixes.push({ category: 'accessibility', description: 'Added lang="en" to html tag', applied: true });
  }

  // Images
  if (issueCategories.has('images')) {
    const alts = fixMissingImageAlts(html);
    if (alts.fixed) {
      html = alts.html;
      fixes.push({ category: 'images', description: `Added alt text to ${alts.count} image(s)`, applied: true });
    }

    const lazy = addLazyLoading(html);
    if (lazy.fixed) {
      html = lazy.html;
      fixes.push({ category: 'performance', description: `Added lazy loading to ${lazy.count} image(s)`, applied: true });
    }
  }

  // Headings
  if (issueCategories.has('headings')) {
    const headings = fixHeadingHierarchy(html);
    if (headings.fixed) {
      html = headings.html;
      fixes.push({ category: 'headings', description: 'Fixed heading hierarchy (promoted first h2 to h1)', applied: true });
    }
  }

  // Accessibility
  if (issueCategories.has('accessibility')) {
    const skipNav = fixMissingSkipNav(html);
    if (skipNav.fixed) {
      html = skipNav.html;
      fixes.push({ category: 'accessibility', description: 'Added skip-to-content navigation link', applied: true });
    }
  }

  // ── Calculate results ──

  const fixCount = fixes.filter((f) => f.applied).length;
  const estimatedImprovement = Math.min(
    30,
    fixCount * 3 + (fixes.some((f) => f.category === 'meta-tags') ? 5 : 0)
  );

  const summary = fixCount > 0
    ? `Applied ${fixCount} SEO fix(es). Estimated score improvement: +${estimatedImprovement} points.\n\nFixes:\n${fixes.filter((f) => f.applied).map((f) => `  - [${f.category}] ${f.description}`).join('\n')}`
    : 'No automated fixes applicable. All issues require manual intervention.';

  return {
    html,
    css,
    fixesApplied: fixes,
    fixCount,
    estimatedScoreImprovement: estimatedImprovement,
    summary,
  };
}
