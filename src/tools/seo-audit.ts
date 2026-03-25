/**
 * MCP Tool: seo_audit
 *
 * SEO and Digital Marketing Audit Tool
 *
 * Analyzes generated HTML code for SEO optimization, digital marketing readiness,
 * and best practices. Returns a detailed audit with severity levels and fix instructions.
 * Issues feed back into the pipeline for re-generation with fixes.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SeoAuditInput {
  code: string; // The generated HTML code to audit
  css?: string; // External CSS code (if separate from HTML)
  js?: string; // External JS code (if separate from HTML)
  industry?: string; // Business industry for contextual recommendations
  targetKeywords?: string[]; // Optional target keywords to check for
  pageType?: string; // 'landing', 'product', 'blog', 'about', etc.
  pageName?: string; // Page name for reporting
}

export interface SeoIssue {
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  category: string; // 'meta-tags', 'headings', 'images', 'performance', 'accessibility', 'structured-data', 'content', 'technical', 'mobile', 'social-media', 'link-structure'
  issue: string; // What's wrong
  impact: string; // How it affects SEO/marketing
  fix: string; // How to fix it
  codeSnippet?: string; // Optional code fix example
}

export interface SeoAuditOutput {
  score: number; // 0-100 SEO score
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: SeoIssue[];
  passed: boolean; // true if score >= 70 and no critical issues
  summary: string;
  recommendations: string[]; // Top 5 priority fixes
  missingElements: string[]; // List of missing SEO elements that should be added
}

// ─── Main Audit Function ────────────────────────────────────────────────────

export function seoAudit(input: SeoAuditInput): SeoAuditOutput {
  const { code: htmlCode, css: externalCss = '', js: externalJs = '', industry = 'tech', targetKeywords = [], pageType = 'landing', pageName = 'Page' } = input;
  // Merge HTML + external CSS + external JS so all checks see the complete codebase
  const code = [htmlCode, externalCss, externalJs].filter(Boolean).join('\n');

  const allIssues: SeoIssue[] = [];
  let score = 100;

  // Run all audit checks
  allIssues.push(...checkMetaTags(code, targetKeywords));
  allIssues.push(...checkHeadings(code, targetKeywords));
  allIssues.push(...checkImages(code));
  allIssues.push(...checkPerformance(code));
  allIssues.push(...checkAccessibility(code));
  allIssues.push(...checkContentQuality(code, industry, pageType));
  allIssues.push(...checkTechnicalSeo(code));
  allIssues.push(...checkMobileOptimization(code));
  allIssues.push(...checkSocialMedia(code));
  allIssues.push(...checkLinkStructure(code));

  // Calculate score based on issues
  for (const issue of allIssues) {
    if (issue.severity === 'critical') {
      score -= 20;
    } else if (issue.severity === 'major') {
      score -= 10;
    } else if (issue.severity === 'minor') {
      score -= 3;
    } else if (issue.severity === 'suggestion') {
      score -= 1;
    }
  }

  score = Math.max(0, score);

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 50) grade = 'D';
  else grade = 'F';

  // Check if passed (score >= 70 and no critical issues)
  const hasCritical = allIssues.some((issue) => issue.severity === 'critical');
  const passed = score >= 70 && !hasCritical;

  // Generate recommendations (top 5 priority fixes)
  const criticalIssues = allIssues.filter((i) => i.severity === 'critical');
  const majorIssues = allIssues.filter((i) => i.severity === 'major');
  const recommendations = [
    ...criticalIssues.slice(0, 3).map((i) => `[CRITICAL] ${i.issue}: ${i.fix}`),
    ...majorIssues.slice(0, Math.max(0, 5 - criticalIssues.length)).map((i) => `[MAJOR] ${i.issue}: ${i.fix}`),
  ];

  // Get missing elements
  const missingElements = getMissingElements(code, pageType);

  // Generate summary
  const summary = generateSummary(score, grade, pageName, passed, allIssues.length);

  return {
    score,
    grade,
    issues: allIssues,
    passed,
    summary,
    recommendations: recommendations.slice(0, 5),
    missingElements,
  };
}

// ─── Check: Meta Tags ───────────────────────────────────────────────────────

function checkMetaTags(code: string, targetKeywords: string[]): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Check for title tag
  const titleMatch = code.match(/<title>(.*?)<\/title>/i);
  if (!titleMatch || !titleMatch[1]?.trim()) {
    issues.push({
      severity: 'critical',
      category: 'meta-tags',
      issue: 'Missing or empty <title> tag',
      impact: 'Title is crucial for SEO ranking and appears in search results. Without it, pages rank poorly.',
      fix: 'Add a descriptive title tag between 30-60 characters that includes your primary keyword.',
      codeSnippet: '<title>Primary Keyword | Brand Name</title>',
    });
  } else {
    const titleLength = titleMatch[1].length;
    if (titleLength < 30) {
      issues.push({
        severity: 'major',
        category: 'meta-tags',
        issue: `Title tag is too short (${titleLength} chars, recommended 30-60).`,
        impact: 'Short titles may not fully display in search results and fail to include important keywords.',
        fix: 'Expand the title to 30-60 characters. Include your primary keyword and brand name.',
        codeSnippet: `<title>Your Full Keyword Title | Brand Name</title>`,
      });
    } else if (titleLength > 60) {
      issues.push({
        severity: 'minor',
        category: 'meta-tags',
        issue: `Title tag is too long (${titleLength} chars, recommended 30-60).`,
        impact: 'Long titles get truncated in search results, losing important messaging.',
        fix: 'Shorten the title to 30-60 characters.',
        codeSnippet: `<title>Keyword | Brand</title>`,
      });
    }

    if (isTitleGeneric(titleMatch[1])) {
      issues.push({
        severity: 'major',
        category: 'meta-tags',
        issue: 'Title tag is too generic or non-descriptive.',
        impact: 'Generic titles like "Home" or "Page 1" do not help SEO and fail to communicate value.',
        fix: 'Use a title that describes the page value and includes your target keyword.',
        codeSnippet: `<title>Specific Page Topic | Your Brand</title>`,
      });
    }
  }

  // Check for meta description
  const descMatch = code.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  if (!descMatch || !descMatch[1]?.trim()) {
    issues.push({
      severity: 'critical',
      category: 'meta-tags',
      issue: 'Missing or empty meta description',
      impact: 'Description appears in search results and influences click-through rates. Missing it reduces CTR by 30%+.',
      fix: 'Add a unique, compelling meta description 120-160 characters that includes your target keyword.',
      codeSnippet: '<meta name="description" content="Compelling 120-160 character description with your keyword.">',
    });
  } else {
    const descLength = descMatch[1].length;
    if (descLength < 120) {
      issues.push({
        severity: 'major',
        category: 'meta-tags',
        issue: `Meta description is too short (${descLength} chars, recommended 120-160).`,
        impact: 'Short descriptions may not communicate full value in search results.',
        fix: 'Expand description to 120-160 characters to capture full message.',
        codeSnippet: `<meta name="description" content="Full 120-160 character description here...">`,
      });
    } else if (descLength > 160) {
      issues.push({
        severity: 'minor',
        category: 'meta-tags',
        issue: `Meta description is too long (${descLength} chars, recommended 120-160).`,
        impact: 'Long descriptions get truncated in search results.',
        fix: 'Shorten to 120-160 characters.',
      });
    }

    if (isDescriptionGeneric(descMatch[1])) {
      issues.push({
        severity: 'major',
        category: 'meta-tags',
        issue: 'Meta description is generic and non-descriptive.',
        impact: 'Generic descriptions fail to entice clicks and are likely duplicated across pages.',
        fix: 'Write a unique, compelling description that highlights the page value and includes keywords.',
        codeSnippet: `<meta name="description" content="[Unique value prop] - Learn more [keyword] at [Brand].">`,
      });
    }
  }

  // Check viewport meta tag
  if (!code.includes('viewport') || !code.includes('width=device-width')) {
    issues.push({
      severity: 'critical',
      category: 'meta-tags',
      issue: 'Missing or incomplete viewport meta tag',
      impact: 'Without viewport meta, mobile rendering fails and your site ranks poorly on mobile SEO.',
      fix: 'Add the viewport meta tag with device-width configuration.',
      codeSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    });
  }

  // Check charset
  if (!code.match(/<meta\s+charset=["']?utf-?8["']?/i)) {
    issues.push({
      severity: 'major',
      category: 'meta-tags',
      issue: 'Missing charset meta tag',
      impact: 'Character encoding issues can cause text rendering problems and SEO penalties.',
      fix: 'Add the charset meta tag to the <head>.',
      codeSnippet: '<meta charset="UTF-8">',
    });
  }

  // Check canonical URL
  if (!code.includes('rel="canonical"')) {
    issues.push({
      severity: 'major',
      category: 'meta-tags',
      issue: 'Missing canonical URL tag',
      impact: 'Without canonical, Google may index duplicate versions of your page, diluting SEO power.',
      fix: 'Add a canonical URL to the <head> pointing to the authoritative page version.',
      codeSnippet: '<link rel="canonical" href="https://yoursite.com/page-name">',
    });
  }

  // Check Open Graph tags
  const requiredOgTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
  const missingOgTags = requiredOgTags.filter((tag) => !code.includes(`property="${tag}"`) && !code.includes(`property='${tag}'`));

  if (missingOgTags.length > 0) {
    issues.push({
      severity: 'major',
      category: 'meta-tags',
      issue: `Missing Open Graph tags: ${missingOgTags.join(', ')}`,
      impact: `Without OG tags, your page sharing on Facebook, LinkedIn, and other social networks shows poorly formatted previews, reducing engagement by 40%+.`,
      fix: 'Add all required Open Graph tags to the <head>.',
      codeSnippet: `<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description">
<meta property="og:image" content="https://yoursite.com/image.jpg">
<meta property="og:url" content="https://yoursite.com/page">
<meta property="og:type" content="website">`,
    });
  }

  // Check Twitter Card tags
  const hasTwitterCard = code.includes('twitter:card') || code.includes('twitter:title');
  if (!hasTwitterCard) {
    issues.push({
      severity: 'minor',
      category: 'meta-tags',
      issue: 'Missing Twitter Card tags',
      impact: 'Without Twitter Card tags, your links shared on Twitter show as plain links without rich preview.',
      fix: 'Add Twitter Card tags for better social sharing appearance.',
      codeSnippet: `<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description">
<meta name="twitter:image" content="https://yoursite.com/image.jpg">`,
    });
  }

  // Check robots meta tag
  if (code.includes('name="robots"') && code.includes('noindex')) {
    issues.push({
      severity: 'critical',
      category: 'meta-tags',
      issue: 'Page has noindex meta tag set',
      impact: 'This page will not appear in search results at all. It will never rank or get organic traffic.',
      fix: 'Remove the noindex tag from production pages. Only use on staging/admin pages.',
      codeSnippet: `<!-- Remove this: <meta name="robots" content="noindex"> -->
<!-- For production, use: <meta name="robots" content="index, follow"> -->`,
    });
  }

  return issues;
}

// ─── Check: Headings ────────────────────────────────────────────────────────

function checkHeadings(code: string, targetKeywords: string[]): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Extract all headings
  const h1Matches = code.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  const h2Matches = code.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const h3Matches = code.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];

  // Check for exactly one H1
  if (h1Matches.length === 0) {
    issues.push({
      severity: 'critical',
      category: 'headings',
      issue: 'Missing <h1> tag',
      impact: 'H1 is the primary heading and crucial for SEO. Without it, search engines struggle to understand page topic.',
      fix: 'Add exactly one <h1> tag that describes the main topic and includes your primary keyword.',
      codeSnippet: '<h1>Your Primary Keyword - Main Page Topic</h1>',
    });
  } else if (h1Matches.length > 1) {
    issues.push({
      severity: 'major',
      category: 'headings',
      issue: `Multiple <h1> tags found (${h1Matches.length}). Only one <h1> per page is allowed.`,
      impact: 'Multiple H1s confuse search engines about your page topic and dilute SEO weight.',
      fix: 'Keep only one <h1> tag. Convert other headings to <h2> or <h3>.',
      codeSnippet: '<h1>Only One H1</h1>\n<h2>Secondary Headings</h2>\n<h3>Tertiary Headings</h3>',
    });
  } else if (h1Matches.length === 1) {
    const h1Content = h1Matches[0].replace(/<h1[^>]*>(.*?)<\/h1>/i, '$1').trim();

    if (!h1Content) {
      issues.push({
        severity: 'critical',
        category: 'headings',
        issue: '<h1> tag is empty',
        impact: 'Empty H1 provides no keyword signal and confuses search engines.',
        fix: 'Add descriptive text to the <h1> tag.',
        codeSnippet: '<h1>Your Main Topic Here</h1>',
      });
    }

    if (isHeadingGeneric(h1Content)) {
      issues.push({
        severity: 'major',
        category: 'headings',
        issue: `H1 is too generic: "${h1Content}"`,
        impact: 'Generic headings like "Welcome" or "Features" do not signal keyword relevance to search engines.',
        fix: 'Use a value-focused H1 that includes your primary keyword.',
        codeSnippet: '<h1>Specific Solution for Your Target Keyword</h1>',
      });
    }

    // Check if H1 contains target keywords
    if (targetKeywords.length > 0) {
      const hasKeyword = targetKeywords.some((kw) => h1Content.toLowerCase().includes(kw.toLowerCase()));
      if (!hasKeyword) {
        issues.push({
          severity: 'major',
          category: 'headings',
          issue: `H1 does not contain target keywords. Keywords: ${targetKeywords.join(', ')}`,
          impact: 'H1 without target keywords misses critical SEO opportunity for ranking.',
          fix: 'Incorporate one of your target keywords naturally into the H1.',
          codeSnippet: `<h1>${targetKeywords[0]} - Your Value Proposition</h1>`,
        });
      }
    }
  }

  // Check heading hierarchy (no skipping levels)
  const hasH2 = h2Matches.length > 0;
  const hasH3 = h3Matches.length > 0;

  if (hasH3 && !hasH2) {
    issues.push({
      severity: 'minor',
      category: 'headings',
      issue: 'H3 tags exist but no H2 tags (skipped heading level)',
      impact: 'Skipped heading levels confuse assistive technology and weaken semantic structure.',
      fix: 'Use headings in order: H1 → H2 → H3. Do not skip levels.',
      codeSnippet: '<h1>Main</h1>\n<h2>Subsection</h2>\n<h3>Sub-subsection</h3>',
    });
  }

  return issues;
}

// ─── Check: Images ──────────────────────────────────────────────────────────

function checkImages(code: string): SeoIssue[] {
  const issues: SeoIssue[] = [];

  const imgMatches = code.match(/<img[^>]*>/g) || [];

  if (imgMatches.length === 0) {
    return issues; // No images to check
  }

  // Check for alt text on all images
  let missingAltCount = 0;
  let weakAltCount = 0;

  for (const img of imgMatches) {
    const hasAlt = img.includes('alt=');
    if (!hasAlt) {
      missingAltCount++;
    } else {
      const altMatch = img.match(/alt=["'](.*?)["']/);
      if (altMatch) {
        const altText = altMatch[1];
        if (!altText || altText === 'image' || altText.includes('unnamed') || altText.includes('placeholder')) {
          weakAltCount++;
        }
      }
    }
  }

  if (missingAltCount > 0) {
    issues.push({
      severity: 'critical',
      category: 'images',
      issue: `${missingAltCount} image(s) missing alt attribute`,
      impact: 'Images without alt text cannot be indexed by search engines and fail accessibility standards.',
      fix: 'Add descriptive alt text to all <img> tags. Alt text should describe the image and include relevant keywords.',
      codeSnippet: '<img src="image.jpg" alt="Descriptive alt text with relevant keywords" />',
    });
  }

  if (weakAltCount > 0) {
    issues.push({
      severity: 'major',
      category: 'images',
      issue: `${weakAltCount} image(s) have weak or generic alt text`,
      impact: 'Weak alt text misses SEO opportunity and fails to describe image content for screen readers.',
      fix: 'Replace generic alt text with descriptive, keyword-relevant descriptions.',
      codeSnippet: '<img src="product.jpg" alt="Blue widget with USB connection for streaming" />',
    });
  }

  // Check for missing width/height (CLS prevention)
  let missingDimensionsCount = 0;
  for (const img of imgMatches) {
    if (!img.includes('width=') || !img.includes('height=')) {
      missingDimensionsCount++;
    }
  }

  if (missingDimensionsCount > 0) {
    issues.push({
      severity: 'major',
      category: 'images',
      issue: `${missingDimensionsCount} image(s) missing width/height attributes`,
      impact: 'Missing dimensions cause layout shift (CLS), reducing Core Web Vitals score and SEO ranking.',
      fix: 'Add width and height attributes to all <img> tags to prevent layout shift.',
      codeSnippet: '<img src="image.jpg" alt="Description" width="1200" height="630" />',
    });
  }

  // Check for missing lazy loading on below-fold images
  const lazyLoadCount = (code.match(/loading=["']lazy["']/g) || []).length;
  if (lazyLoadCount === 0 && imgMatches.length > 3) {
    issues.push({
      severity: 'minor',
      category: 'images',
      issue: 'Images not using lazy loading',
      impact: 'Loading all images upfront delays page load time and wastes bandwidth for users.',
      fix: 'Add loading="lazy" to images below the fold (not visible on initial page load).',
      codeSnippet: '<img src="below-fold-image.jpg" alt="Description" loading="lazy" />',
    });
  }

  // Check image filename optimization
  let poorFilenameCount = 0;
  for (const img of imgMatches) {
    const srcMatch = img.match(/src=["'](.*?)["']/);
    if (srcMatch) {
      const src = srcMatch[1];
      // Check for poor filenames (numbers, auto-generated names)
      if (/image\d+|photo\d+|img\d+|screenshot\d+|unnamed/i.test(src)) {
        poorFilenameCount++;
      }
    }
  }

  if (poorFilenameCount > 0) {
    issues.push({
      severity: 'minor',
      category: 'images',
      issue: `${poorFilenameCount} image(s) have poor filenames (not keyword-optimized)`,
      impact: 'Image filenames are an SEO ranking factor. "image001.jpg" provides no keyword signal.',
      fix: 'Rename images with descriptive, keyword-relevant filenames.',
      codeSnippet: 'image001.jpg → blue-widget-usb-streaming-device.jpg',
    });
  }

  return issues;
}

// ─── Check: Performance ────────────────────────────────────────────────────

function checkPerformance(code: string): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Check for inline styles (should be external CSS)
  const inlineStyleCount = (code.match(/style=["'][^"']*["']/g) || []).length;
  if (inlineStyleCount > 0) {
    issues.push({
      severity: 'major',
      category: 'performance',
      issue: `${inlineStyleCount} inline style attribute(s) found`,
      impact: 'Inline styles prevent CSS caching, increase HTML size, and reduce performance score.',
      fix: 'Move all styles to external CSS files or <style> tags.',
      codeSnippet: '<!-- Move from --> <div style="color: red;">Text</div>\n<!-- To --> <div class="text-red">Text</div>',
    });
  }

  // Check for render-blocking resources
  const scriptTags = code.match(/<script[^>]*>/g) || [];
  let blockingScripts = 0;
  for (const script of scriptTags) {
    if (!script.includes('defer') && !script.includes('async') && !script.includes('type="module"')) {
      blockingScripts++;
    }
  }

  if (blockingScripts > 0) {
    issues.push({
      severity: 'major',
      category: 'performance',
      issue: `${blockingScripts} render-blocking script tag(s) in <head>`,
      impact: 'Render-blocking scripts delay page load, hurting Core Web Vitals and SEO ranking.',
      fix: 'Add async or defer attribute to <script> tags, or move them before closing </body>.',
      codeSnippet: '<script src="app.js" defer></script>',
    });
  }

  // Check for preconnect to external domains
  const externalUrls = (code.match(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/gi) || []).filter((url) => !url.includes('localhost'));
  const hasPreconnect = code.includes('rel="preconnect"');

  if (externalUrls.length > 0 && !hasPreconnect) {
    issues.push({
      severity: 'minor',
      category: 'performance',
      issue: 'No preconnect hints for external resources',
      impact: 'Missing preconnect adds latency to external resource loading (fonts, APIs), slowing page load.',
      fix: 'Add <link rel="preconnect"> for critical external domains.',
      codeSnippet: '<link rel="preconnect" href="https://fonts.googleapis.com">',
    });
  }

  // Check for font-display CSS property
  if (code.includes('@font-face') && !code.includes('font-display')) {
    issues.push({
      severity: 'minor',
      category: 'performance',
      issue: 'Web fonts missing font-display property',
      impact: 'Missing font-display can cause invisible text while fonts load (FOIT), hurting Core Web Vitals.',
      fix: 'Add font-display: swap to @font-face rules.',
      codeSnippet: '@font-face { font-family: "Custom"; src: url("font.woff2"); font-display: swap; }',
    });
  }

  // Check DOM depth (excessive nesting)
  const deepestNesting = getDeepestNesting(code);
  if (deepestNesting > 15) {
    issues.push({
      severity: 'minor',
      category: 'performance',
      issue: `Excessive DOM nesting detected (depth: ${deepestNesting}). Recommended max: 15 levels.`,
      impact: 'Deep DOM nesting increases memory usage and rendering time, slowing the page.',
      fix: 'Refactor HTML to reduce nesting depth. Consider flattening overly nested structures.',
    });
  }

  return issues;
}

// ─── Check: Accessibility ──────────────────────────────────────────────────

function checkAccessibility(code: string): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Check for semantic landmarks — <nav role="navigation"> counts as header-level landmark
  const hasHeader = code.includes('<header') || (code.includes('<nav') && code.includes('role="navigation"'));
  const hasMain = code.includes('<main');
  const hasFooter = code.includes('<footer');
  const hasNav = code.includes('<nav');

  const missingLandmarks: string[] = [];
  if (!hasHeader) missingLandmarks.push('<header>');
  if (!hasMain) missingLandmarks.push('<main>');
  if (!hasFooter) missingLandmarks.push('<footer>');

  if (missingLandmarks.length > 0) {
    issues.push({
      severity: 'major',
      category: 'accessibility',
      issue: `Missing semantic HTML landmarks (${missingLandmarks.join(', ')})`,
      impact: 'Missing landmarks hurt accessibility for screen readers and confuse search engines about page structure.',
      fix: 'Add semantic landmarks to structure the page properly.',
      codeSnippet: '<header>...</header>\n<main>...</main>\n<footer>...</footer>',
    });
  }

  // Check for nav aria-label
  if (hasNav && !code.includes('aria-label') && !code.includes('aria-labelledby')) {
    issues.push({
      severity: 'minor',
      category: 'accessibility',
      issue: '<nav> element missing aria-label or aria-labelledby',
      impact: 'Without labels, screen reader users cannot distinguish between multiple navs.',
      fix: 'Add aria-label to <nav> elements to describe their purpose.',
      codeSnippet: '<nav aria-label="Main navigation">...</nav>',
    });
  }

  // Check for form labels — aria-label and aria-labelledby also count as valid labeling
  const inputMatches = code.match(/<input[^>]*>/g) || [];
  const labelMatches = code.match(/<label[^>]*>/g) || [];
  const ariaLabelledInputs = inputMatches.filter((inp) => inp.includes('aria-label') || inp.includes('aria-labelledby'));

  if (inputMatches.length > 0 && labelMatches.length === 0 && ariaLabelledInputs.length === 0) {
    issues.push({
      severity: 'major',
      category: 'accessibility',
      issue: 'Form inputs found but no <label> elements or aria-label attributes',
      impact: 'Without labels, screen readers cannot associate text with inputs, failing accessibility.',
      fix: 'Add <label> elements for all form inputs, or use aria-label for accessible labeling.',
      codeSnippet: '<label for="email">Email:</label>\n<input id="email" type="email" />',
    });
  }

  // Check for tabindex misuse (should not have tabindex > 0)
  const tabindexMatch = code.match(/tabindex=["'][1-9][0-9]*["']/g);
  if (tabindexMatch) {
    issues.push({
      severity: 'major',
      category: 'accessibility',
      issue: 'Positive tabindex values found (tabindex > 0)',
      impact: 'Positive tabindex values disrupt natural tab order, confusing keyboard users.',
      fix: 'Only use tabindex="0" or "-1". Let natural HTML order determine tab flow.',
      codeSnippet: '<!-- Bad: --> <button tabindex="5">Click</button>\n<!-- Good: --> <button>Click</button>',
    });
  }

  // Check color contrast (general)
  if (!code.includes('var(--color-') && code.match(/#[0-9a-f]{3,6}/gi)) {
    issues.push({
      severity: 'minor',
      category: 'accessibility',
      issue: 'Hardcoded colors may not meet WCAG contrast requirements',
      impact: 'Poor contrast reduces readability for users with color blindness or low vision.',
      fix: 'Use the design system color tokens which are vetted for WCAG AA contrast.',
      codeSnippet: '<!-- Use --> color: var(--color-neutral-700); <!-- Not --> color: #999999;',
    });
  }

  // Check for skip to content link
  if (!code.includes('skip') && !code.includes('Skip to content')) {
    issues.push({
      severity: 'minor',
      category: 'accessibility',
      issue: 'No skip to content link present',
      impact: 'Keyboard users must tab through all navigation before reaching main content.',
      fix: 'Add a hidden "Skip to content" link at the top of the page.',
      codeSnippet: '<a href="#main" class="skip-to-content">Skip to content</a>\n<main id="main">...</main>',
    });
  }

  return issues;
}

// ─── Check: Content Quality ────────────────────────────────────────────────

function checkContentQuality(code: string, industry: string, pageType: string): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Extract text content (rough estimate)
  const textContent = code.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').length;

  const minWords = pageType === 'landing' ? 300 : pageType === 'blog' ? 800 : 300;

  if (wordCount < minWords) {
    issues.push({
      severity: 'major',
      category: 'content',
      issue: `Content is thin (${wordCount} words, recommended ${minWords}+ for ${pageType} pages)`,
      impact: 'Thin content ranks poorly in search results and provides insufficient value to readers.',
      fix: `Add more substantial content. Aim for ${minWords}+ words with proper keyword integration.`,
    });
  }

  // Check for placeholder/lorem ipsum — but exclude HTML placeholder attributes on inputs
  const codeWithoutPlaceholderAttrs = code.replace(/placeholder=["'][^"']*["']/gi, '');
  if (codeWithoutPlaceholderAttrs.includes('Lorem ipsum') || codeWithoutPlaceholderAttrs.includes('lorem ipsum') || codeWithoutPlaceholderAttrs.includes('dummy text') || /placeholder\s+(?:text|content|copy)/i.test(codeWithoutPlaceholderAttrs)) {
    issues.push({
      severity: 'critical',
      category: 'content',
      issue: 'Placeholder or Lorem ipsum text found in content',
      impact: 'Lorem ipsum content is not indexed and signals the page is unfinished, causing search engines to ignore it.',
      fix: 'Replace all placeholder text with real, high-quality content.',
    });
  }

  // Check for CTA presence
  const hasButton = code.includes('<button') || code.match(/<a[^>]*class=["'][^"']*btn[^"']*["']/i);
  const hasCta =
    hasButton ||
    code.includes('Sign up') ||
    code.includes('Get started') ||
    code.includes('Learn more') ||
    code.includes('Contact us') ||
    code.includes('Buy now');

  if (!hasCta) {
    issues.push({
      severity: 'major',
      category: 'content',
      issue: 'No clear call-to-action (CTA) found',
      impact: 'Without a CTA, visitors have no direction and bounce away, wasting traffic.',
      fix: 'Add prominent CTAs that guide users to the next step (sign up, purchase, contact, etc.).',
      codeSnippet: '<button class="btn btn-primary">Get Started Today</button>',
    });
  }

  // Check for trust signals (testimonials, logos, certifications)
  const hasTrustSignals =
    code.includes('testimonial') ||
    code.includes('review') ||
    code.includes('certification') ||
    code.includes('award') ||
    code.includes('trusted by');

  if (!hasTrustSignals && industry !== 'blog') {
    issues.push({
      severity: 'minor',
      category: 'content',
      issue: 'No trust signals detected (testimonials, certifications, partner logos)',
      impact: 'Missing trust signals reduce conversion rates as visitors lack social proof.',
      fix: 'Add testimonials, client logos, certifications, or security badges.',
      codeSnippet: '<section class="testimonials"><!-- Add customer quotes and company logos --></section>',
    });
  }

  // Check for internal links
  const internalLinks = (code.match(/<a\s+href=["'][^"'#][^"']*["'][^>]*>/g) || []).filter(
    (link) => !link.includes('http') || link.includes(window?.location?.hostname || 'localhost'),
  );

  if (internalLinks.length === 0 && pageType !== 'landing') {
    issues.push({
      severity: 'minor',
      category: 'content',
      issue: 'No internal links found',
      impact: 'Internal links help search engines crawl and understand your site structure.',
      fix: 'Add contextual internal links to related pages.',
      codeSnippet: '<a href="/features/">Learn about our features</a>',
    });
  }

  // Check for contact/company info
  if (!code.includes('@') && !code.includes('contact') && !code.includes('phone') && !code.includes('address')) {
    if (pageType !== 'blog' && industry !== 'blog') {
      issues.push({
        severity: 'minor',
        category: 'content',
        issue: 'No contact information or company details found',
        impact: 'Missing contact info signals an untrustworthy or inactive business.',
        fix: 'Add contact email, phone number, or address. Include in footer or contact page.',
        codeSnippet: '<footer><p>Contact: info@company.com | 1-800-123-4567</p></footer>',
      });
    }
  }

  return issues;
}

// ─── Check: Technical SEO ──────────────────────────────────────────────────

function checkTechnicalSeo(code: string): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Check DOCTYPE
  if (!code.includes('<!DOCTYPE html>') && !code.includes('<!doctype html>')) {
    issues.push({
      severity: 'critical',
      category: 'technical',
      issue: 'Missing <!DOCTYPE html> declaration',
      impact: 'Missing DOCTYPE causes browser to render in quirks mode, breaking CSS and JavaScript.',
      fix: 'Add <!DOCTYPE html> as the first line of the HTML document.',
      codeSnippet: '<!DOCTYPE html>\n<html lang="en">\n...',
    });
  }

  // Check html lang attribute
  if (!code.match(/<html[^>]*lang=["'][^"']*["']/i)) {
    issues.push({
      severity: 'major',
      category: 'technical',
      issue: 'Missing or empty lang attribute on <html> tag',
      impact: 'Missing lang attribute confuses search engines and screen readers about page language.',
      fix: 'Add lang attribute to <html> tag with appropriate language code.',
      codeSnippet: '<html lang="en">',
    });
  }

  // Check for favicon
  if (!code.includes('icon') && !code.includes('favicon')) {
    issues.push({
      severity: 'minor',
      category: 'technical',
      issue: 'No favicon reference found',
      impact: 'Missing favicon looks unprofessional and wastes server requests (404 errors).',
      fix: 'Add a favicon link to the <head>.',
      codeSnippet: '<link rel="icon" type="image/x-icon" href="/favicon.ico">',
    });
  }

  // Check for structured data (JSON-LD)
  if (!code.includes('application/ld+json')) {
    issues.push({
      severity: 'suggestion',
      category: 'structured-data',
      issue: 'No Schema.org structured data (JSON-LD) found',
      impact: 'Structured data helps search engines understand page content and can enable rich snippets.',
      fix: 'Add JSON-LD structured data for your content type (Article, Product, Organization, etc.).',
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company"
}
</script>`,
    });
  }

  // Check for hash-based routing (SPA issue)
  if (code.includes('/#/') || code.includes('/#?')) {
    issues.push({
      severity: 'major',
      category: 'technical',
      issue: 'Hash-based routing detected (single-page app with #)',
      impact: 'Hash-based routing makes it hard for search engines to crawl all pages and can break bookmarking.',
      fix: 'Use proper URL paths instead of hash routing for SEO. Use history API instead of hash fragments.',
      codeSnippet: '<!-- Bad: --> /index#/products\n<!-- Good: --> /products',
    });
  }

  return issues;
}

// ─── Check: Mobile Optimization ────────────────────────────────────────────

function checkMobileOptimization(code: string): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Viewport already checked in meta tags

  // Check for fixed-width layouts
  if (code.match(/width:\s*\d{4,}px/gi)) {
    issues.push({
      severity: 'major',
      category: 'mobile',
      issue: 'Fixed-width layouts detected (width: [large px value])',
      impact: 'Fixed widths cause horizontal scrolling on mobile, breaking layout and user experience.',
      fix: 'Use flexible widths with max-width constraints instead of fixed pixel widths.',
      codeSnippet: '<!-- Bad: --> width: 1200px;\n<!-- Good: --> max-width: 1200px; width: 100%;',
    });
  }

  // Check for responsive media queries
  if (!code.includes('@media') && code.includes('width=device-width')) {
    issues.push({
      severity: 'major',
      category: 'mobile',
      issue: 'No CSS media queries found for responsive design',
      impact: 'Without media queries, layout breaks on different screen sizes, hurting mobile SEO.',
      fix: 'Add @media queries for mobile (375px), tablet (768px), and desktop (1024px).',
      codeSnippet: '@media (min-width: 768px) { /* tablet styles */ }',
    });
  }

  // Check for touch-friendly tap targets
  const btnCount = (code.match(/<button[^>]*>/g) || []).length + (code.match(/<a\s+href=/g) || []).length;
  if (btnCount > 0 && !code.includes('padding:') && !code.includes('padding: ')) {
    issues.push({
      severity: 'minor',
      category: 'mobile',
      issue: 'Interactive elements may not have sufficient touch target size',
      impact: 'Small tap targets are hard to hit on mobile, increasing errors and frustration.',
      fix: 'Ensure buttons and links have minimum 44x44px tap targets with adequate padding.',
      codeSnippet: 'button { padding: 12px 24px; min-height: 44px; min-width: 44px; }',
    });
  }

  // Check for overflow-x scroll
  if (code.includes('overflow-x: scroll') || code.includes('overflow-x:scroll')) {
    issues.push({
      severity: 'major',
      category: 'mobile',
      issue: 'Horizontal scrolling (overflow-x: scroll) detected',
      impact: 'Horizontal scrolling on mobile is poor UX and breaks layout.',
      fix: 'Remove overflow-x: scroll. Use flexbox or grid with proper wrapping.',
    });
  }

  return issues;
}

// ─── Check: Social Media ───────────────────────────────────────────────────

function checkSocialMedia(code: string): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Check OG image dimensions
  const ogImageMatch = code.match(/property=["']og:image["']\s+content=["'](.*?)["']/i);
  if (ogImageMatch) {
    // Note: Can't easily check dimensions without fetching image, so recommend best size
    issues.push({
      severity: 'suggestion',
      category: 'social-media',
      issue: 'OG image found, but verify dimensions are optimal (1200x630 recommended)',
      impact: 'Non-optimal OG image sizes may display poorly when shared on social networks.',
      fix: 'Ensure OG image is 1200x630px (16:9 ratio) for optimal display across platforms.',
    });
  } else if (code.includes('property="og:title"')) {
    // Has OG tags but missing image
    issues.push({
      severity: 'major',
      category: 'social-media',
      issue: 'OG image tag missing (og:image)',
      impact: 'Without OG image, social shares show no thumbnail, hurting click-through rates by 30%+.',
      fix: 'Add og:image meta tag pointing to a high-quality 1200x630px image.',
      codeSnippet: '<meta property="og:image" content="https://yoursite.com/share-image.jpg">',
    });
  }

  // Check for share-friendly URLs (not hash-based, not localhost)
  if (code.includes('#') && code.includes('href="#')) {
    // Already caught in technical SEO
  }

  // Check for social proof content
  const hasSocialProof =
    code.includes('testimonial') || code.includes('review') || code.includes('case study') || code.includes('client');

  if (!hasSocialProof) {
    issues.push({
      severity: 'suggestion',
      category: 'social-media',
      issue: 'No social proof content (testimonials, case studies, client logos)',
      impact: 'Social proof improves credibility and conversion rates, making content more shareable.',
      fix: 'Add testimonials, case studies, or client logos to build trust and encourage sharing.',
    });
  }

  return issues;
}

// ─── Check: Link Structure ────────────────────────────────────────────────

function checkLinkStructure(code: string): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Check for broken href="#" links
  const brokenLinks = (code.match(/<a\s+href=["']#["'][^>]*>/g) || []).length;
  if (brokenLinks > 0) {
    issues.push({
      severity: 'major',
      category: 'link-structure',
      issue: `${brokenLinks} link(s) with empty href="#" found`,
      impact: 'Links to "#" go nowhere and should be buttons instead. This confuses users and search engines.',
      fix: 'Convert href="#" links to <button> elements, or give them proper href destinations.',
      codeSnippet: '<!-- Bad: --> <a href="#">Click me</a>\n<!-- Good: --> <button>Click me</button>',
    });
  }

  // Check for external links without security attributes
  const externalLinks = (code.match(/<a[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/g) || []).filter(
    (link) => !link.includes('localhost'),
  );

  let missingSecurityAttrs = 0;
  for (const link of externalLinks) {
    if (!link.includes('noopener') && !link.includes('noreferrer')) {
      missingSecurityAttrs++;
    }
  }

  if (missingSecurityAttrs > 0) {
    issues.push({
      severity: 'major',
      category: 'link-structure',
      issue: `${missingSecurityAttrs} external link(s) missing security attributes (noopener/noreferrer)`,
      impact: 'Missing security attributes expose your site to window.opener vulnerabilities.',
      fix: 'Add rel="noopener noreferrer" to all external links.',
      codeSnippet: '<a href="https://example.com" rel="noopener noreferrer" target="_blank">External Site</a>',
    });
  }

  // Check for breadcrumbs (optional but good for multi-page sites)
  if (!code.includes('breadcrumb') && !code.includes('Breadcrumb')) {
    // Just a suggestion, not required
  }

  return issues;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function isTitleGeneric(title: string): boolean {
  const generic = [
    'home',
    'page',
    'page 1',
    'index',
    'untitled',
    'new page',
    'welcome',
    'test',
    'sample',
    'my page',
  ];
  return generic.includes(title.toLowerCase().trim());
}

function isDescriptionGeneric(desc: string): boolean {
  const generic = [
    'this is a description',
    'add a description',
    'description here',
    'page description',
    'no description',
    'your description here',
    'lorem ipsum',
  ];
  return generic.some((g) => desc.toLowerCase().includes(g));
}

function isHeadingGeneric(heading: string): boolean {
  const generic = ['welcome', 'features', 'pricing', 'contact', 'home', 'page', 'section', 'content', 'more'];
  return generic.includes(heading.toLowerCase().trim());
}

function getDeepestNesting(code: string): number {
  let maxDepth = 0;
  let currentDepth = 0;

  // Very simple tag matching for nesting depth
  const openTags = code.match(/<[a-z][a-z0-9]*[^>]*>/gi) || [];
  const closeTags = code.match(/<\/[a-z][a-z0-9]*>/gi) || [];

  // Rough estimate: divide by opening tags / closing tags to get average depth
  if (openTags.length > 0) {
    maxDepth = Math.round(openTags.length / 2);
  }

  // More accurate: actually parse
  for (const char of code) {
    if (code.match(/<[^/>]/)) currentDepth++;
    if (code.match(/<\//)) currentDepth--;
    maxDepth = Math.max(maxDepth, currentDepth);
  }

  return Math.max(maxDepth, 5); // Conservative minimum
}

function getMissingElements(code: string, pageType: string): string[] {
  const missing: string[] = [];

  if (!code.includes('<title>')) missing.push('<title> tag');
  if (!code.match(/<meta\s+name=["']description/i)) missing.push('<meta name="description">');
  if (!code.includes('viewport')) missing.push('<meta name="viewport">');
  if (!code.match(/<meta\s+charset/i)) missing.push('<meta charset>');
  if (!code.includes('rel="canonical"')) missing.push('<link rel="canonical">');
  if (!code.includes('og:title')) missing.push('Open Graph tags (og:title, og:description, og:image, og:url)');
  if (!code.includes('twitter:card')) missing.push('Twitter Card tags');
  if (!code.match(/<h1[^>]*>/i)) missing.push('<h1> tag');
  if (!code.includes('<main')) missing.push('<main> landmark');
  if (!code.includes('<header')) missing.push('<header> landmark');
  if (!code.includes('<footer')) missing.push('<footer> landmark');
  if (!code.includes('application/ld+json')) missing.push('Schema.org JSON-LD structured data');
  if (!code.includes('rel="icon"') && !code.includes('rel="shortcut icon"')) missing.push('Favicon reference');

  return missing;
}

function generateSummary(score: number, grade: string, pageName: string, passed: boolean, issueCount: number): string {
  const status = passed ? '✓ PASSED' : '✗ FAILED';
  return `${status} — ${pageName} SEO Score: ${score}/100 (Grade: ${grade}) — Found ${issueCount} issue${issueCount !== 1 ? 's' : ''}`;
}
