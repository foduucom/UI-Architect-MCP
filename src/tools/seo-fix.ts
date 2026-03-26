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
  // Check if existing title is too short (under 20 chars) or too generic
  const existingTitleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (existingTitleMatch) {
    const existingTitle = existingTitleMatch[1].trim();
    const genericTitles = ['home', 'about', 'services', 'contact', 'page', 'index'];
    const isTooShort = existingTitle.length < 20;
    const isGeneric = genericTitles.includes(existingTitle.toLowerCase());

    if (isTooShort || isGeneric) {
      const betterTitle = `${pageName} — Professional Solutions for Your Business`;
      return {
        html: html.replace(/<title>[^<]*<\/title>/, `<title>${betterTitle}</title>`),
        fixed: true,
      };
    }
    return { html, fixed: false };
  }

  const titleTag = `  <title>${pageName}</title>`;

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
  const fullDesc = `Professional ${industry} solutions — ${pageName}. Discover our services, explore features, and learn how we can help transform your business with expert solutions tailored to your needs.`;

  // Check if existing description is too short (under 100 chars)
  const existingDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  if (existingDescMatch) {
    const existingDesc = existingDescMatch[1].trim();
    if (existingDesc.length < 100) {
      return {
        html: html.replace(/<meta\s+name="description"\s+content="[^"]*"/, `<meta name="description" content="${fullDesc}"`),
        fixed: true,
      };
    }
    return { html, fixed: false };
  }

  const metaTag = `  <meta name="description" content="${fullDesc}">`;

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

function fixMissingTwitterCards(
  html: string,
  pageName: string,
  industry: string
): { html: string; fixed: boolean } {
  if (html.includes('twitter:card') || html.includes('twitter:title')) return { html, fixed: false };

  const desc = `${pageName} — Professional ${industry} solutions`;
  const twitterTags = `  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="${pageName}">\n  <meta name="twitter:description" content="${desc}">`;

  if (html.includes('</head>')) {
    return { html: html.replace('</head>', `${twitterTags}\n</head>`), fixed: true };
  }
  return { html, fixed: false };
}

function fixMissingJsonLd(
  html: string,
  pageName: string,
  industry: string
): { html: string; fixed: boolean } {
  if (html.includes('application/ld+json')) return { html, fixed: false };

  const name = pageName.replace(/"/g, '\\"');
  const desc = `Professional ${industry} solutions and services`.replace(/"/g, '\\"');
  const jsonLd = `  <script type="application/ld+json">\n{"@context":"https://schema.org","@type":"Organization","name":"${name}","description":"${desc}"}\n  </script>`;

  if (html.includes('</head>')) {
    return { html: html.replace('</head>', `${jsonLd}\n</head>`), fixed: true };
  }
  return { html, fixed: false };
}

function fixMissingFormLabels(html: string): { html: string; fixed: boolean; count: number } {
  const inputRegex = /<input(?![^>]*(?:aria-label|aria-labelledby))[^>]*>/gi;
  const matches = html.match(inputRegex);
  if (!matches || matches.length === 0) return { html, fixed: false, count: 0 };

  let fixedHtml = html;
  let count = 0;

  for (const match of matches) {
    if (/type=["'](?:hidden|submit|button)["']/i.test(match)) continue;
    const idMatch = match.match(/id=["']([^"']+)["']/);
    if (idMatch && html.includes(`for="${idMatch[1]}"`)) continue;

    const placeholderMatch = match.match(/placeholder=["']([^"']+)["']/);
    const nameMatch = match.match(/name=["']([^"']+)["']/);
    const label = placeholderMatch?.[1] || nameMatch?.[1]?.replace(/[-_]/g, ' ') || 'Input field';

    const fixed = match.replace('<input', `<input aria-label="${label}"`);
    fixedHtml = fixedHtml.replace(match, fixed);
    count++;
  }

  return { html: fixedHtml, fixed: count > 0, count };
}

function fixMissingFavicon(html: string): { html: string; fixed: boolean } {
  if (html.includes('rel="icon"') || html.includes('rel="shortcut icon"') || html.includes('favicon')) {
    return { html, fixed: false };
  }

  const faviconTag = '  <link rel="icon" type="image/x-icon" href="/favicon.ico">';
  if (html.includes('</head>')) {
    return { html: html.replace('</head>', `${faviconTag}\n</head>`), fixed: true };
  }
  return { html, fixed: false };
}

function fixMissingRobotsMeta(html: string): { html: string; fixed: boolean } {
  if (html.includes('name="robots"')) return { html, fixed: false };

  const robotsTag = '  <meta name="robots" content="index, follow">';
  if (html.includes('</head>')) {
    return { html: html.replace('</head>', `${robotsTag}\n</head>`), fixed: true };
  }
  return { html, fixed: false };
}

function fixMissingPreconnect(html: string): { html: string; fixed: boolean; count: number } {
  if (html.includes('rel="preconnect"')) return { html, fixed: false, count: 0 };

  const externalDomains = new Set<string>();
  const urlMatches = html.match(/(?:href|src)=["'](https?:\/\/[a-z0-9.-]+\.[a-z]{2,})/gi) || [];

  for (const match of urlMatches) {
    const urlMatch = match.match(/["'](https?:\/\/[a-z0-9.-]+\.[a-z]{2,})/i);
    if (urlMatch && !urlMatch[1].includes('localhost')) {
      try {
        const url = new URL(urlMatch[1]);
        externalDomains.add(url.origin);
      } catch { /* skip malformed URLs */ }
    }
  }

  if (externalDomains.size === 0) return { html, fixed: false, count: 0 };

  const preconnectTags = Array.from(externalDomains)
    .slice(0, 4)
    .map((origin) => `  <link rel="preconnect" href="${origin}" crossorigin>`)
    .join('\n');

  if (html.includes('</head>')) {
    return { html: html.replace('</head>', `${preconnectTags}\n</head>`), fixed: true, count: externalDomains.size };
  }
  return { html, fixed: false, count: 0 };
}

function fixMissingImageDimensions(html: string): { html: string; fixed: boolean; count: number } {
  const imgTags = html.match(/<img[^>]+>/gi) || [];
  let fixedHtml = html;
  let count = 0;

  for (const img of imgTags) {
    const hasWidth = /width=["']\d+["']/i.test(img);
    const hasHeight = /height=["']\d+["']/i.test(img);
    if (hasWidth && hasHeight) continue;

    let width = '800', height = '600';
    if (/hero|banner|cover/i.test(img)) { width = '1200'; height = '630'; }
    else if (/icon|logo/i.test(img)) { width = '48'; height = '48'; }
    else if (/avatar|profile/i.test(img)) { width = '80'; height = '80'; }
    else if (/thumbnail|thumb/i.test(img)) { width = '300'; height = '200'; }

    let fixed = img;
    if (!hasWidth) fixed = fixed.replace('<img', `<img width="${width}"`);
    if (!hasHeight) fixed = fixed.replace('<img', `<img height="${height}"`);
    fixedHtml = fixedHtml.replace(img, fixed);
    count++;
  }

  return { html: fixedHtml, fixed: count > 0, count };
}

// ─── Additional Fix Functions (content, link-structure, social, performance) ─

function fixMissingOgImage(html: string): { html: string; fixed: boolean } {
  if (/property=["']og:image["']/i.test(html)) return { html, fixed: false };
  if (!html.includes('property="og:title"')) return { html, fixed: false };

  const ogImageTag = '  <meta property="og:image" content="https://picsum.photos/1200/630">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">';
  const twitterImageTag = '  <meta name="twitter:image" content="https://picsum.photos/1200/630">';

  let result = html;
  if (result.includes('</head>')) {
    const insert = `${ogImageTag}\n${!result.includes('twitter:image') ? twitterImageTag + '\n' : ''}`;
    result = result.replace('</head>', `${insert}</head>`);
  }
  return { html: result, fixed: true };
}

function fixExternalLinkSecurity(html: string): { html: string; fixed: boolean; count: number } {
  const externalLinkRegex = /<a([^>]*href=["']https?:\/\/[^"']*["'][^>]*)>/gi;
  let count = 0;
  const result = html.replace(externalLinkRegex, (match, _attrs) => {
    if (/rel=["'][^"']*noopener/i.test(match)) return match;
    count++;
    // Add rel and target if not present
    let fixed = match;
    if (!/target=/i.test(fixed)) {
      fixed = fixed.replace(/(<a)/, '$1 target="_blank"');
    }
    if (!/rel=/i.test(fixed)) {
      fixed = fixed.replace(/(<a)/, '$1 rel="noopener noreferrer"');
    } else {
      fixed = fixed.replace(/rel=["']([^"']*)["']/i, 'rel="$1 noopener noreferrer"');
    }
    return fixed;
  });
  return { html: result, fixed: count > 0, count };
}

function fixHeroImagePriority(html: string): { html: string; fixed: boolean } {
  // Add fetchpriority="high" to the first large image (hero/banner)
  const heroImgRegex = /(<img[^>]*(?:hero|banner|cover|seed\/[^"']*1)[^>]*)>/i;
  const match = html.match(heroImgRegex);
  if (!match) return { html, fixed: false };
  if (match[0].includes('fetchpriority')) return { html, fixed: false };

  const fixed = html.replace(heroImgRegex, '$1 fetchpriority="high">');
  return { html: fixed, fixed: true };
}

function fixEmptyHrefLinks(html: string): { html: string; fixed: boolean; count: number } {
  // Convert href="#" to role="button" where appropriate
  let count = 0;
  const result = html.replace(/<a(\s+)href=["']#["']([^>]*)>(.*?)<\/a>/gi, (_match, space1, attrs, content) => {
    // If it contains "Learn more", "View", or other nav-like text, keep as link but fix href
    if (/learn more|view|details|see|browse|read/i.test(content)) {
      return `<a${space1}href="/"${attrs}>${content}</a>`;
    }
    count++;
    return `<button${space1}${attrs} type="button">${content}</button>`;
  });
  return { html: result, fixed: count > 0, count };
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

    const twitter = fixMissingTwitterCards(html, pageName, industry);
    if (twitter.fixed) {
      html = twitter.html;
      fixes.push({ category: 'social-media', description: 'Added Twitter Card meta tags', applied: true });
    }

    const robots = fixMissingRobotsMeta(html);
    if (robots.fixed) {
      html = robots.html;
      fixes.push({ category: 'meta-tags', description: 'Added robots meta tag (index, follow)', applied: true });
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

    const dimensions = fixMissingImageDimensions(html);
    if (dimensions.fixed) {
      html = dimensions.html;
      fixes.push({ category: 'images', description: `Added width/height to ${dimensions.count} image(s) to prevent CLS`, applied: true });
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

    const formLabels = fixMissingFormLabels(html);
    if (formLabels.fixed) {
      html = formLabels.html;
      fixes.push({ category: 'accessibility', description: `Added aria-label to ${formLabels.count} input(s)`, applied: true });
    }
  }

  // Structured data
  if (issueCategories.has('structured-data')) {
    const jsonLd = fixMissingJsonLd(html, pageName, industry);
    if (jsonLd.fixed) {
      html = jsonLd.html;
      fixes.push({ category: 'structured-data', description: 'Added Schema.org Organization JSON-LD', applied: true });
    }
  }

  // Technical fixes
  if (issueCategories.has('technical')) {
    const favicon = fixMissingFavicon(html);
    if (favicon.fixed) {
      html = favicon.html;
      fixes.push({ category: 'technical', description: 'Added favicon link', applied: true });
    }
  }

  // Performance fixes
  if (issueCategories.has('performance')) {
    const preconnect = fixMissingPreconnect(html);
    if (preconnect.fixed) {
      html = preconnect.html;
      fixes.push({ category: 'performance', description: `Added preconnect hints for ${preconnect.count} external domain(s)`, applied: true });
    }

    const heroPriority = fixHeroImagePriority(html);
    if (heroPriority.fixed) {
      html = heroPriority.html;
      fixes.push({ category: 'performance', description: 'Added fetchpriority="high" to hero image', applied: true });
    }
  }

  // Social media fixes
  if (issueCategories.has('social-media')) {
    const ogImage = fixMissingOgImage(html);
    if (ogImage.fixed) {
      html = ogImage.html;
      fixes.push({ category: 'social-media', description: 'Added og:image and twitter:image placeholder tags', applied: true });
    }
  }

  // Link structure fixes
  if (issueCategories.has('link-structure')) {
    const linkSecurity = fixExternalLinkSecurity(html);
    if (linkSecurity.fixed) {
      html = linkSecurity.html;
      fixes.push({ category: 'link-structure', description: `Added noopener noreferrer to ${linkSecurity.count} external link(s)`, applied: true });
    }

    const emptyLinks = fixEmptyHrefLinks(html);
    if (emptyLinks.fixed) {
      html = emptyLinks.html;
      fixes.push({ category: 'link-structure', description: `Converted ${emptyLinks.count} empty href="#" link(s) to buttons`, applied: true });
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
