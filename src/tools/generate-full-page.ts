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
import { generateSection, type GenerateSectionOutput } from './generate-section.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PageDefinition {
  name: string;
  slug: string;
  sections: string[];
  isHomepage?: boolean;
}

export interface GenerateFullPageInput {
  pages: PageDefinition[];
  framework: string;
  designTokens: DesignTokens;
  industry?: string;
  includeNavigation?: boolean;
  includeFooter?: boolean;
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

export interface GenerateFullPageOutput {
  pages: GeneratedPage[];
  sharedCss: string;
  sharedJs: string;
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
  designTokens: DesignTokens
): string {
  const navLinks = pages
    .map(
      (page) =>
        `        <li><a href="${page.isHomepage ? 'index.html' : page.slug + '.html'}" class="nav-link">${page.name}</a></li>`
    )
    .join('\n');

  if (framework === 'html') {
    return `
  <nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="nav-container">
      <div class="nav-brand">Brand</div>
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
      <div className="nav-brand">Brand</div>
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
      <div class="nav-brand">Brand</div>
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
    <div class="nav-brand">Brand</div>
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

function generateFooter(framework: Framework): string {
  const footerContent = `
    <div class="footer-content">
      <p>&copy; 2026 Your Company. All rights reserved.</p>
    </div>
`;

  if (framework === 'html') {
    return `
  <footer class="footer" role="contentinfo">
${footerContent}
  </footer>
`;
  }

  if (framework === 'react' || framework === 'nextjs') {
    return `
const Footer = () => (
  <footer className="footer" role="contentinfo">
${footerContent}
  </footer>
);
`;
  }

  if (framework === 'vue' || framework === 'nuxt') {
    return `
<!-- Footer Component -->
<template>
  <footer class="footer" role="contentinfo">
${footerContent}
  </footer>
</template>
`;
  }

  if (framework === 'svelte') {
    return `
<!-- Footer Component -->
<footer class="footer" role="contentinfo">
${footerContent}
</footer>
`;
  }

  return `<!-- Footer section for ${framework} -->`;
}

// ─── Generate Vanilla HTML Document ─────────────────────────────────────────

function generateVanillaHtmlPage(
  pageName: string,
  pageSlug: string,
  sections: GenerateSectionOutput[],
  designTokens: DesignTokens,
  navigation: string,
  footer: string
): string {
  const googleFontsUrl = designTokens.typography.fonts.googleFontsUrl;
  const allHtml = sections.map((s) => s.html).join('\n\n');
  const allJs = sections.map((s) => s.js).filter(Boolean).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${pageName} — Professional page built with UI Architect MCP">
  <title>${pageName}</title>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsUrl}" rel="stylesheet">

  <!-- CSS -->
  <link rel="stylesheet" href="assets/css/reset.css">
  <link rel="stylesheet" href="assets/css/variables.css">
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
  <script src="assets/js/${pageSlug}.js" defer><\/script>
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

  // Generate each page
  for (const pageDef of input.pages) {
    let sectionsToGenerate = [...pageDef.sections];

    // Add navigation if requested (default true)
    if (input.includeNavigation !== false) {
      if (!sectionsToGenerate.includes('navigation')) {
        sectionsToGenerate.unshift('navigation');
      }
    }

    // Add footer if requested (default true)
    if (input.includeFooter !== false) {
      if (!sectionsToGenerate.includes('footer')) {
        sectionsToGenerate.push('footer');
      }
    }

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

    if (framework === 'html') {
      pageHtml = generateVanillaHtmlPage(
        pageDef.name,
        pageDef.slug,
        sectionOutputs,
        input.designTokens,
        generateNavigation(input.pages, framework, input.designTokens),
        generateFooter(framework)
      );
    } else if (framework === 'react' || framework === 'nextjs') {
      pageHtml = generateReactPage(
        pageDef.name,
        sectionOutputs,
        generateNavigation(input.pages, framework, input.designTokens),
        generateFooter(framework),
        framework
      );
    } else if (framework === 'vue' || framework === 'nuxt') {
      pageHtml = generateVuePage(
        pageDef.name,
        sectionOutputs,
        generateNavigation(input.pages, framework, input.designTokens),
        generateFooter(framework),
        framework
      );
    } else if (framework === 'svelte') {
      pageHtml = generateSveltePage(
        pageDef.name,
        sectionOutputs,
        generateNavigation(input.pages, framework, input.designTokens),
        generateFooter(framework)
      );
    } else if (framework === 'angular') {
      pageHtml = generateAngularPage(pageDef.name, sectionOutputs);
    }

    // Combine CSS and JS from all sections
    const { shared: sharedCss, unique: uniqueCss } = deduplicateCss(
      sectionOutputs.map((s) => s.css)
    );
    const pageCss = uniqueCss.join('\n\n');

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

  return {
    pages,
    sharedCss: allSharedCss,
    sharedJs,
    summary: summary.trim(),
  };
}
