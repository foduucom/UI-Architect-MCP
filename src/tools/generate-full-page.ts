/**
 * MCP Tool: generate_full_page
 *
 * Phase 6 (Full) — Code Generation
 *
 * Assembles multiple sections (from generateSection) into complete production-ready pages.
 * Handles framework-specific output (vanilla HTML, React, Vue, etc.).
 * Deduplicates CSS, merges JS, builds navigation between pages.
 */

import type { DesignTokens, Framework } from '../engine/types.js';
import { generateSection, type GenerateSectionOutput, type PageInfo } from './generate-section.js';
import type { UIverseComponentMap } from '../engine/uiverse-adapter.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PageDefinition {
  name: string;
  slug: string;
  sections: string[];
  isHomepage?: boolean;
}

export interface GenerateFullPageInput {
  /** All pages in the site — used for nav link generation */
  allPages: PageDefinition[];
  /** Pages to actually generate code for (subset of allPages, or same as allPages) */
  pagesToGenerate: PageDefinition[];
  framework: string;
  designTokens: DesignTokens;
  industry?: string;
  includeNavigation?: boolean;
  includeFooter?: boolean;
  /** Brand/project name — displayed in navigation and footer */
  brandName?: string;
  /** Adapted UIverse components — passed through to each section generator */
  uiverseComponents?: UIverseComponentMap | null;
  /** Resolved images per section type from fetchImages — passed through to section generators */
  imageData?: Record<string, import('./fetch-images.js').ResolvedImage[]> | null;
}

export interface GeneratedPage {
  name: string;
  slug: string;
  html: string;
  css: string;
  js: string;
  sectionsGenerated: string[];
  componentsUsed: string[];
}

export interface SharedFile {
  filename: string;
  content: string;
}

export interface GenerateFullPageOutput {
  pages: GeneratedPage[];
  sharedCss: string;
  sharedJs: string;
  /** Shared files that should be written once (reset.css, variables.css, animations.css, etc.) */
  sharedFiles: SharedFile[];
  summary: string;
}

// ─── Framework Resolution ───────────────────────────────────────────────────

function resolveFramework(frameworkStr: string): Framework {
  const normalized = frameworkStr.toLowerCase();
  const validFrameworks: Framework[] = [
    'html',
    'react',
    'nextjs',
    'vue',
    'nuxt',
    'angular',
    'svelte',
    'astro',
  ];
  const resolved = validFrameworks.find((f) => f === normalized);
  return resolved || 'html';
}

// ─── CSS Deduplication ──────────────────────────────────────────────────────

function deduplicateCss(cssArray: string[]): {
  shared: string;
  unique: string[];
} {
  // Extract common patterns that should be shared (animations, reset, variables)
  const animations = cssArray
    .filter((css) => css.includes('@keyframes'))
    .map((css) => css.match(/@keyframes[^}]+}/g) || [])
    .flat();

  const uniqueAnimations = [...new Set(animations)].join('\n\n');

  // Collect unique CSS per page (non-animation rules)
  const unique = cssArray.map((css) =>
    css
      .split('\n')
      .filter((line) => !line.includes('@keyframes'))
      .join('\n')
      .trim()
  );

  return {
    shared: uniqueAnimations,
    unique,
  };
}

// ─── JavaScript Merging ─────────────────────────────────────────────────────

function mergeJavaScript(jsArray: string[], pageSlugs: string[]): {
  shared: string;
  pageSpecific: Record<string, string>;
} {
  // Extract shared patterns (utility functions, intersection observer setup)
  const observerPatterns = jsArray
    .filter((js) => js.includes('IntersectionObserver'))
    .slice(0, 1);

  const observerSetup = observerPatterns[0] || '';

  // Page-specific JS
  const pageSpecific: Record<string, string> = {};
  pageSlugs.forEach((slug, index) => {
    pageSpecific[slug] = jsArray[index] || '';
  });

  return {
    shared: observerSetup,
    pageSpecific,
  };
}

// ─── Navigation Component Generation ────────────────────────────────────────

function generateNavigation(
  pages: PageDefinition[],
  framework: Framework,
  designTokens: DesignTokens,
  brandName?: string,
  currentSlug?: string
): string {
  const brand = brandName || 'Brand';

  if (framework === 'html') {
    const navLinks = pages
      .map((page) => {
        const href = page.isHomepage ? 'index.html' : page.slug + '.html';
        const active = page.slug === currentSlug ? ' class="nav-link active"' : ' class="nav-link"';
        return `        <li><a href="${href}"${active}>${page.name}</a></li>`;
      })
      .join('\n');

    return `
  <nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="nav-container">
      <div class="nav-brand">${brand}</div>
      <div class="nav-hamburger" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </div>
      <ul class="nav-links">
${navLinks}
      </ul>
    </div>
  </nav>
`;
  }

  if (framework === 'react' || framework === 'nextjs') {
    const importStatement =
      framework === 'nextjs'
        ? "import Link from 'next/link';"
        : "const Link = ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>;";

    return `
// Navigation component
${importStatement}

const Navigation = () => (
  <nav className="navbar" role="navigation" aria-label="Main navigation">
    <div className="nav-container">
      <div className="nav-brand">${brand}</div>
      <ul className="nav-links">
${pages
  .map(
    (page) =>
      `        <li><Link href="${page.isHomepage ? '/' : '/' + page.slug}" className="nav-link">${page.name}</Link></li>`
  )
  .join('\n')}
      </ul>
    </div>
  </nav>
);
`;
  }

  if (framework === 'vue' || framework === 'nuxt') {
    const routerLink =
      framework === 'nuxt' ? 'NuxtLink' : 'RouterLink or a (with href)';

    return `
<!-- Navigation Component -->
<template>
  <nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="nav-container">
      <div class="nav-brand">${brand}</div>
      <ul class="nav-links">
${pages
  .map(
    (page) =>
      `        <li><${routerLink} to="${page.isHomepage ? '/' : '/' + page.slug}" class="nav-link">${page.name}</${routerLink}></li>`
  )
  .join('\n')}
      </ul>
    </div>
  </nav>
</template>
`;
  }

  if (framework === 'svelte') {
    return `
<!-- Navigation Component -->
<nav class="navbar" role="navigation" aria-label="Main navigation">
  <div class="nav-container">
    <div class="nav-brand">${brand}</div>
    <ul class="nav-links">
${pages
  .map(
    (page) =>
      `      <li><a href="${page.isHomepage ? '/' : '/' + page.slug}" class="nav-link">${page.name}</a></li>`
  )
  .join('\n')}
    </ul>
  </div>
</nav>
`;
  }

  // Fallback
  return `<!-- Navigation section for ${framework} -->`;
}

// ─── Generate Footer Component ──────────────────────────────────────────────

function generateFooter(framework: Framework, brandName?: string): string {
  const brand = brandName || 'Your Company';
  const footerContent = `
    <div class="footer-content">
      <p>&copy; ${new Date().getFullYear()} ${brand}. All rights reserved.</p>
    </div>
`;

  if (framework === 'html') {
    return `
  <footer class="site-footer" role="contentinfo">
${footerContent}
  </footer>
`;
  }

  if (framework === 'react' || framework === 'nextjs') {
    return `
const Footer = () => (
  <footer className="site-footer" role="contentinfo">
${footerContent}
  </footer>
);
`;
  }

  if (framework === 'vue' || framework === 'nuxt') {
    return `
<!-- Footer Component -->
<template>
  <footer class="site-footer" role="contentinfo">
${footerContent}
  </footer>
</template>
`;
  }

  if (framework === 'svelte') {
    return `
<!-- Footer Component -->
<footer class="site-footer" role="contentinfo">
${footerContent}
</footer>
`;
  }

  return `<!-- Footer section for ${framework} -->`;
}

// ─── Apply Active Slug to Nav Template ──────────────────────────────────────

function applyActiveSlug(
  navTemplate: string,
  activeSlug: string,
  pages: PageDefinition[],
  framework: Framework
): string {
  if (!navTemplate) return '';
  const page = pages.find(p => p.slug === activeSlug);
  if (!page) return navTemplate;

  // Determine href for this page based on framework
  const href = framework === 'html'
    ? (page.isHomepage ? 'index.html' : `${activeSlug}.html`)
    : (page.isHomepage ? '/' : `/${activeSlug}`);

  // Determine class attribute name per framework
  const classAttr = (framework === 'react' || framework === 'nextjs') ? 'className' : 'class';

  // Add ' active' to the matching link
  return navTemplate.replace(
    `href="${href}" ${classAttr}="nav-link"`,
    `href="${href}" ${classAttr}="nav-link active"`
  );
}

// ─── Generate Vanilla HTML Document ─────────────────────────────────────────

function generateVanillaHtmlPage(
  pageName: string,
  pageSlug: string,
  sections: GenerateSectionOutput[],
  designTokens: DesignTokens,
  navigation: string,
  footer: string,
  brandName?: string
): string {
  const googleFontsUrl = designTokens.typography.fonts.googleFontsUrl;
  const allHtml = sections.map((s) => s.html).join('\n\n');
  const allJs = sections.map((s) => s.js).filter(Boolean).join('\n\n');
  const brand = brandName || 'Our Company';
  const pageTitle = pageSlug === 'index'
    ? `${brand} — Professional Technology Solutions`
    : `${pageName} | ${brand}`;
  const pageDescription = pageSlug === 'index'
    ? `${brand} provides professional technology solutions including website building, software development, and AI integration. Transform your business with our expert team.`
    : `${pageName} — Learn more about ${brand}. We deliver professional technology solutions tailored to your business needs.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${pageDescription}">
  <title>${pageTitle}</title>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsUrl}" rel="stylesheet">

  <!-- CSS -->
  <link rel="stylesheet" href="assets/css/reset.css">
  <link rel="stylesheet" href="assets/css/variables.css">
  <link rel="stylesheet" href="assets/css/components.css">
  <link rel="stylesheet" href="assets/css/animations.css">
  <link rel="stylesheet" href="assets/css/${pageSlug}.css">

  <!-- Favicon -->
  <link rel="icon" href="assets/images/favicon.ico" type="image/x-icon">
</head>
<body>
${navigation}

  <main>
${allHtml}
  </main>

${footer}

  <script src="assets/js/animations.js" defer><\/script>
  <script src="assets/js/main.js" defer><\/script>
</body>
</html>
`;
}

// ─── Generate React Page ────────────────────────────────────────────────────

function generateReactPage(
  pageName: string,
  sections: GenerateSectionOutput[],
  navigation: string,
  footer: string,
  framework: Framework
): string {
  const importPath = framework === 'nextjs' ? "import './page.css';" : "import './Page.css';";

  // Convert section HTML to JSX (simplified — assumes mostly semantic HTML)
  const sectionComponents = sections
    .map((s, i) => {
      return `
// ${s.sectionId}
const Section${i} = () => (
  <>
${s.html.split('\n').map((line) => '    ' + line).join('\n')}
  </>
);
`;
    })
    .join('\n');

  const exportName = framework === 'nextjs' ? 'HomePage' : 'Page';
  const exportLine =
    framework === 'nextjs'
      ? `export default ${exportName};`
      : `export default ${exportName};`;

  return `${importPath}

${navigation}

${footer}

${sectionComponents}

export const ${exportName} = () => {
  return (
    <>
      <Navigation />
      <main>
${sections.map((_, i) => `        <Section${i} />`).join('\n')}
      </main>
      <Footer />
    </>
  );
};

${exportLine}
`;
}

// ─── Generate Vue Page ──────────────────────────────────────────────────────

function generateVuePage(
  pageName: string,
  sections: GenerateSectionOutput[],
  navigation: string,
  footer: string,
  framework: Framework
): string {
  const importPath =
    framework === 'nuxt'
      ? "// Nuxt page — definePageMeta() optional"
      : "// Vue page component";

  const sectionComponents = sections
    .map((s, i) => {
      return `
<!-- ${s.sectionId} -->
<template>
${s.html.split('\n').map((line) => '  ' + line).join('\n')}
</template>
`;
    })
    .join('\n');

  return `${importPath}

<script setup lang="ts">
// Page setup
</script>

<template>
  <div>
    ${navigation}

    <main>
${sectionComponents}
    </main>

    ${footer}
  </div>
</template>

<style scoped>
/* Scoped page styles imported separately */
</style>
`;
}

// ─── Generate Svelte Page ───────────────────────────────────────────────────

function generateSveltePage(
  pageName: string,
  sections: GenerateSectionOutput[],
  navigation: string,
  footer: string
): string {
  const sectionHtml = sections
    .map(
      (s) => `
<!-- ${s.sectionId} -->
${s.html}
`
    )
    .join('\n');

  return `<script>
  // Page initialization
</script>

${navigation}

<main>
${sectionHtml}
</main>

${footer}

<style>
  /* Scoped page styles */
</style>
`;
}

// ─── Generate Angular Page ──────────────────────────────────────────────────

function generateAngularPage(
  pageName: string,
  sections: GenerateSectionOutput[]
): string {
  const sectionComponentRefs = sections
    .map((s, i) => `app-${s.sectionId}`)
    .join('\n      ');

  return `<app-navigation></app-navigation>

<main>
  ${sectionComponentRefs}
</main>

<app-footer></app-footer>
`;
}

// ─── Main Function ──────────────────────────────────────────────────────────

export function generateFullPage(
  input: GenerateFullPageInput
): GenerateFullPageOutput {
  const framework = resolveFramework(input.framework);
  const pages: GeneratedPage[] = [];
  const allPageCss: string[] = [];
  const allPageJs: string[] = [];
  const pageSlugs: string[] = [];

  // Build page info array for navigation context
  const pageInfoList: PageInfo[] = input.allPages.map((p: PageDefinition) => ({
    name: p.name,
    slug: p.slug,
    isHomepage: p.isHomepage,
  }));

  // Generate nav template ONCE (no active class) and footer ONCE — locked across all pages
  const navTemplate = input.includeNavigation !== false
    ? generateNavigation(input.allPages, framework, input.designTokens, input.brandName, undefined)
    : '';
  const footerHtml = input.includeFooter !== false
    ? generateFooter(framework, input.brandName)
    : '';

  // Generate each page
  for (const pageDef of input.pagesToGenerate) {
    // Only generate content sections — nav and footer are handled by the page wrapper
    // to avoid duplicate nav/footer in the output
    const sectionsToGenerate = pageDef.sections.filter(
      s => s !== 'navigation' && s !== 'navbar' && s !== 'footer'
    );

    // Generate each section
    const sectionOutputs: GenerateSectionOutput[] = [];
    const allComponentsUsed = new Set<string>();

    for (let i = 0; i < sectionsToGenerate.length; i++) {
      const sectionType = sectionsToGenerate[i];

      try {
        const sectionOutput = generateSection({
          sectionType,
          framework: input.framework,
          designTokens: input.designTokens,
          content: undefined, // Content would come from page data
          sectionIndex: i,
          uiverseComponents: input.uiverseComponents || null,
          imageData: input.imageData || null,
          // Pass page context so sections can reference real pages
          pages: pageInfoList,
          currentPageSlug: pageDef.slug,
          brandName: input.brandName || null,
        });

        sectionOutputs.push(sectionOutput);
        sectionOutput.componentsUsed.forEach((c) => allComponentsUsed.add(c));

        allPageCss.push(sectionOutput.css);
        allPageJs.push(sectionOutput.js);
      } catch (error) {
        console.error(
          `Failed to generate section "${sectionType}" for page "${pageDef.name}":`,
          error
        );
      }
    }

    // Build page based on framework
    let pageHtml = '';

    // Apply active class to the locked nav template for this page
    const navHtml = applyActiveSlug(navTemplate, pageDef.slug, input.allPages, framework);

    if (framework === 'html') {
      pageHtml = generateVanillaHtmlPage(
        pageDef.name,
        pageDef.slug,
        sectionOutputs,
        input.designTokens,
        navHtml,
        footerHtml,
        input.brandName
      );
    } else if (framework === 'react' || framework === 'nextjs') {
      pageHtml = generateReactPage(
        pageDef.name,
        sectionOutputs,
        navHtml,
        footerHtml,
        framework
      );
    } else if (framework === 'vue' || framework === 'nuxt') {
      pageHtml = generateVuePage(
        pageDef.name,
        sectionOutputs,
        navHtml,
        footerHtml,
        framework
      );
    } else if (framework === 'svelte') {
      pageHtml = generateSveltePage(
        pageDef.name,
        sectionOutputs,
        navHtml,
        footerHtml
      );
    } else if (framework === 'angular') {
      pageHtml = generateAngularPage(pageDef.name, sectionOutputs);
    }

    // Combine CSS and JS from all sections
    const { shared: sharedCss, unique: uniqueCss } = deduplicateCss(
      sectionOutputs.map((s) => s.css)
    );

    // Inject UIverse component CSS (buttons, cards, inputs, etc.)
    // This CSS is generated by adaptComponents() but never included in section output
    const componentCss = input.uiverseComponents?.combinedCss || '';
    const componentKeyframes = input.uiverseComponents?.combinedKeyframes || '';
    const pageCss = [componentCss, componentKeyframes, ...uniqueCss].filter(Boolean).join('\n\n');

    const pageJs = sectionOutputs.map((s) => s.js).filter(Boolean).join('\n\n');

    pages.push({
      name: pageDef.name,
      slug: pageDef.slug,
      html: pageHtml,
      css: pageCss,
      js: pageJs,
      sectionsGenerated: sectionsToGenerate,
      componentsUsed: Array.from(allComponentsUsed),
    });

    pageSlugs.push(pageDef.slug);
  }

  // Generate shared CSS and JS
  const { shared: allSharedCss } = deduplicateCss(allPageCss);
  const { shared: sharedJs, pageSpecific } = mergeJavaScript(
    allPageJs,
    pageSlugs
  );

  // Build summary
  const summary = `
Generated ${pages.length} page(s) with ${pages.reduce((sum, p) => sum + p.sectionsGenerated.length, 0)} total sections.

Pages:
${pages.map((p) => `  - ${p.name} (${p.slug}) with ${p.sectionsGenerated.length} sections`).join('\n')}

Framework: ${framework}
Total unique components: ${new Set(pages.flatMap((p) => p.componentsUsed)).size}

All sections rendered and ready for ${framework} framework.
Navigation between pages: ${input.includeNavigation !== false ? 'enabled' : 'disabled'}
Footer: ${input.includeFooter !== false ? 'enabled' : 'disabled'}
`;

  // ─── Generate shared files ────────────────────────────────────────────────
  const sharedFiles: SharedFile[] = [];

  // 1. reset.css
  sharedFiles.push({
    filename: 'reset.css',
    content: `/* Modern CSS Reset */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body { min-height: 100vh; line-height: 1.65; -webkit-font-smoothing: antialiased; }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
a { color: inherit; text-decoration: none; }
ul, ol { list-style: none; }
button { cursor: pointer; border: none; background: none; }`,
  });

  // 2. variables.css — from design tokens
  const tokens = input.designTokens;
  sharedFiles.push({
    filename: 'variables.css',
    content: `/* Design Tokens — Generated by UI Architect */
:root {
  --color-primary: ${tokens.colors?.primary || '#DC2626'};
  --color-primary-light: ${tokens.colors?.primaryLight || '#f5c2c2'};
  --color-primary-dark: ${tokens.colors?.primaryDark || '#ab1c1c'};
  --color-primary-rgb: ${tokens.colors?.primaryRgb || '220, 38, 38'};
  --color-secondary: ${tokens.colors?.secondary || '#65A30D'};
  --color-secondary-light: ${tokens.colors?.secondaryLight || '#b2f25a'};
  --color-secondary-dark: ${tokens.colors?.secondaryDark || '#436d09'};
  --color-accent: ${tokens.colors?.accent || '#F59E0B'};
  --color-accent-light: ${tokens.colors?.accentLight || '#fbd99d'};
  --color-neutral-900: ${tokens.colors?.neutral900 || '#1c1717'};
  --color-neutral-700: ${tokens.colors?.neutral700 || '#453b3b'};
  --color-neutral-500: ${tokens.colors?.neutral500 || '#7c6a6a'};
  --color-neutral-300: ${tokens.colors?.neutral300 || '#bdb2b2'};
  --color-neutral-200: ${tokens.colors?.neutral200 || '#d5cdcd'};
  --color-neutral-100: ${tokens.colors?.neutral100 || '#efecec'};
  --color-neutral-50: ${tokens.colors?.neutral50 || '#f8f7f7'};
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  --font-heading: '${tokens.typography?.fonts?.heading || 'Playfair Display'}', system-ui, sans-serif;
  --font-body: '${tokens.typography?.fonts?.body || 'Source Sans 3'}', system-ui, sans-serif;
  --fs-display: 3rem;
  --fs-h1: 2.25rem;
  --fs-h2: 1.875rem;
  --fs-h3: 1.5rem;
  --fs-h4: 1.25rem;
  --fs-body: 1rem;
  --fs-small: 0.875rem;
  --fs-caption: 0.75rem;
  --lh-heading: 1.2;
  --lh-body: 1.65;
  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semibold: 600;
  --fw-bold: 700;

  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;
  --space-4xl: 6rem;
  --space-5xl: 8rem;

  --shadow-sm: 0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.05);
  --shadow-lg: 0 12px 24px rgba(0,0,0,0.07), 0 4px 8px rgba(0,0,0,0.04);
  --shadow-xl: 0 24px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06);

  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
  --transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
}

body {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--color-neutral-900);
  background: var(--color-neutral-50);
  padding-top: 72px;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  line-height: var(--lh-heading);
  font-weight: var(--fw-bold);
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
}

.section { padding: var(--space-5xl) 0; }

.section-header {
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.section-title {
  font-size: var(--fs-h2);
  margin-bottom: var(--space-sm);
  color: var(--color-neutral-900);
}

.section-subtitle {
  font-size: var(--fs-body);
  color: var(--color-neutral-500);
  max-width: 600px;
  margin: 0 auto;
}`,
  });

  // 3. animations.css — scroll animations + hover effects
  sharedFiles.push({
    filename: 'animations.css',
    content: `/* Scroll Animations */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s var(--ease-out-expo), transform 0.6s var(--ease-out-expo);
}
.animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

.stagger-children > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s var(--ease-out-expo), transform 0.5s var(--ease-out-expo);
}
.stagger-children.visible > *:nth-child(1) { transition-delay: 0ms; }
.stagger-children.visible > *:nth-child(2) { transition-delay: 100ms; }
.stagger-children.visible > *:nth-child(3) { transition-delay: 200ms; }
.stagger-children.visible > *:nth-child(4) { transition-delay: 300ms; }
.stagger-children.visible > *:nth-child(5) { transition-delay: 400ms; }
.stagger-children.visible > *:nth-child(6) { transition-delay: 500ms; }
.stagger-children.visible > * {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.hero-content > * {
  animation: fadeInUp 0.8s var(--ease-out-expo) both;
}
.hero-content > *:nth-child(1) { animation-delay: 0.1s; }
.hero-content > *:nth-child(2) { animation-delay: 0.25s; }
.hero-content > *:nth-child(3) { animation-delay: 0.4s; }
.hero-content > *:nth-child(4) { animation-delay: 0.55s; }

${allSharedCss}`,
  });

  // 4. components.css — navbar, buttons, cards, inputs, footer
  const componentCssForShared = input.uiverseComponents?.combinedCss || '';
  const componentKeyframesForShared = input.uiverseComponents?.combinedKeyframes || '';
  const isDark = tokens.themeMode === 'dark';
  const navBg = isDark ? 'rgba(28, 29, 33, 0.85)' : 'rgba(248, 247, 247, 0.85)';
  const navBgScrolled = isDark ? 'rgba(28, 29, 33, 0.98)' : 'rgba(248, 247, 247, 0.98)';
  sharedFiles.push({
    filename: 'components.css',
    content: `/* Component Styles — Navbar, Buttons, Cards, Inputs, Footer */

/* ─── Navbar ─────────────────────────────────────────────── */
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  padding: var(--space-md) 0;
  background: ${navBg};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background var(--transition-base), box-shadow var(--transition-base), padding var(--transition-base);
}
.navbar.scrolled {
  padding: var(--space-sm) 0;
  background: ${navBgScrolled};
  box-shadow: var(--shadow-md);
}
.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-brand {
  font-family: var(--font-heading);
  font-size: var(--fs-h3);
  font-weight: var(--fw-bold);
  color: var(--color-primary);
}
.nav-links {
  display: flex;
  gap: var(--space-xl);
  align-items: center;
}
.nav-link {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  font-weight: var(--fw-medium);
  color: var(--color-neutral-700);
  padding: var(--space-xs) 0;
  position: relative;
  transition: color var(--transition-fast);
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0;
  width: 0; height: 2px;
  background: var(--color-primary);
  transition: width var(--transition-base);
}
.nav-link:hover, .nav-link.active { color: var(--color-primary); }
.nav-link:hover::after, .nav-link.active::after { width: 100%; }

.nav-hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  padding: var(--space-xs);
  z-index: 1001;
}
.nav-hamburger span {
  display: block;
  width: 24px; height: 2px;
  background: var(--color-neutral-900);
  transition: transform var(--transition-base), opacity var(--transition-fast);
}
.nav-hamburger.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.nav-hamburger.active span:nth-child(2) { opacity: 0; }
.nav-hamburger.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

.nav-cta { margin-left: var(--space-md); }

@media (max-width: 768px) {
  .nav-hamburger { display: flex; }
  .nav-links {
    position: fixed;
    top: 0; right: -100%;
    width: 280px; height: 100vh;
    background: var(--color-neutral-50);
    flex-direction: column;
    padding: var(--space-5xl) var(--space-xl) var(--space-xl);
    gap: var(--space-lg);
    box-shadow: var(--shadow-xl);
    transition: right var(--transition-slow);
    z-index: 1000;
  }
  .nav-links.open { right: 0; }
  body.menu-open { overflow: hidden; }
}

/* ─── Buttons ────────────────────────────────────────────── */
.cta, .btn-primary, .btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 12px 28px;
  font-family: var(--font-body);
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
  border: 2px solid transparent;
  text-decoration: none;
}
.cta svg, .btn-primary svg, .btn-secondary svg {
  stroke: currentColor; stroke-width: 2; fill: none;
  transition: transform var(--transition-fast);
}
.cta:hover svg, .btn-primary:hover svg, .btn-secondary:hover svg {
  transform: translateX(4px);
}
.btn-primary, .cta.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
.btn-primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.3);
}
.btn-primary:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.btn-secondary, .cta.btn-secondary {
  background: transparent;
  color: var(--color-neutral-900);
  border-color: var(--color-neutral-300);
}
.btn-secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

/* ─── Cards ──────────────────────────────────────────────── */
.card {
  background: var(--color-neutral-100);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-neutral-200);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
}
.card-image {
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
}
.card-image img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.4s var(--ease-out-expo);
}
.card:hover .card-image img { transform: scale(1.05); }
.card-body { padding: var(--space-lg); }
.card-title {
  font-family: var(--font-heading);
  font-size: var(--fs-h4);
  font-weight: var(--fw-semibold);
  color: var(--color-neutral-900);
  margin-bottom: var(--space-xs);
}
.card-description {
  font-size: var(--fs-small);
  color: var(--color-neutral-500);
  line-height: 1.5;
  margin-bottom: var(--space-sm);
}
.card-price {
  font-family: var(--font-heading);
  font-size: var(--fs-h4);
  font-weight: var(--fw-bold);
  color: var(--color-primary);
}
.card-badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--radius-full);
  background: var(--color-accent-light);
  color: var(--color-neutral-900);
}

/* ─── Form Inputs ────────────────────────────────────────── */
.form-group { margin-bottom: var(--space-lg); }
.form-group label {
  display: block;
  font-weight: var(--fw-medium);
  margin-bottom: var(--space-xs);
  color: var(--color-neutral-700);
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  font-size: var(--fs-body);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

/* ─── Footer ─────────────────────────────────────────────── */
.site-footer {
  background: var(--color-neutral-900);
  color: var(--color-neutral-300);
  padding: var(--space-3xl) 0 var(--space-xl);
}
.site-footer a {
  color: var(--color-neutral-300);
  transition: color var(--transition-fast);
}
.site-footer a:hover { color: var(--color-primary-light); }

/* ─── UIverse Component Overrides ─────────────────────────── */
${componentCssForShared}
${componentKeyframesForShared}`,
  });

  // 5. animations.js — scroll observer + nav behavior
  sharedFiles.push({
    filename: 'animations.js',
    content: `// Scroll Animation Observer
(function() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.animate-on-scroll, .stagger-children').forEach(function(el) {
    observer.observe(el);
  });

  // Sticky navbar
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // Mobile hamburger
  var hamburger = document.querySelector('.nav-hamburger');
  var navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
    navLinks.querySelectorAll('.nav-link').forEach(function(link) {
      link.addEventListener('click', function() {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var t = document.querySelector(this.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
})();`,
  });

  return {
    pages,
    sharedCss: allSharedCss,
    sharedJs,
    sharedFiles,
    summary: summary.trim(),
  };
}
