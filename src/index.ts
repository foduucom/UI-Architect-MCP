#!/usr/bin/env node

/**
 * UI Architect MCP Server
 *
 * Built by FODUU (https://foduu.com) — India's Web Design Company
 *
 * The ultimate MCP server for generating production-ready, agency-quality UI.
 * Works across any framework. No CSS framework lock-in.
 * Follows a full web design agency pipeline: PM Analysis → Architecture → Design → Background → Scaffold → Components → Code Gen → QA Review.
 *
 * Tools (11 total — call in order):
 *   1.  analyze_project:         Phase 1 — PM analysis, scope, clarifying questions
 *   2.  plan_architecture:       Phase 2 — System architecture, component maps, file structure
 *   3.  design_theme:            Phase 3 — Complete design system (colors, typography, spacing)
 *   4.  explore_components:      Phase 3.2 — Fetch REAL animated components from UIverse.io
 *   5.  select_components:       Phase 3.5 — Select & adapt animated UI components
 *   6.  generate_background:     Phase 4 — CSS background patterns
 *   7.  scaffold_project:        Phase 5 — Project directory structure & base files
 *   8.  generate_full_page:      Phase 6 — Full page code generation (all sections assembled)
 *   9.  seo_audit:               Phase 6.5 — SEO & digital marketing audit
 *   10. design_consistency_check: Phase 6.7 — Multi-page design consistency validation
 *   11. review_output:           Phase 7 — QA review against quality checklist
 *   12. generate_build_manifest: Final — Component report with GitHub URLs per page
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { analyzeProject } from './tools/analyze-project.js';
import { planArchitecture } from './tools/plan-architecture.js';
import { designTheme } from './tools/design-theme.js';
import { selectComponents } from './tools/select-components.js';
import { generateBackgroundTool } from './tools/generate-background.js';
import { scaffoldProject } from './tools/scaffold-project.js';
import { generateFullPage } from './tools/generate-full-page.js';
import { reviewOutput } from './tools/review-output.js';
import { exploreComponents } from './tools/explore-components.js';
import { seoAudit } from './tools/seo-audit.js';
import { designConsistencyCheck } from './tools/design-consistency-check.js';
import { generateBuildManifest } from './tools/generate-build-manifest.js';
import type { DesignTokens, Framework } from './engine/types.js';
import type { ProjectScope, AnalyzeProjectOutput } from './tools/analyze-project.js';
import type { ArchitecturePlan } from './tools/plan-architecture.js';

// ─── Server Initialization ───────────────────────────────────────────────────

const server = new McpServer({
  name: 'ui-architect',
  version: '3.0.0',
});

// ─── In-memory session state (persists across tool calls in one session) ─────

let currentScope: ProjectScope | null = null;
let currentPlan: ArchitecturePlan | null = null;
let currentTokens: DesignTokens | null = null;
let lastAnalysis: AnalyzeProjectOutput | null = null;

// ─── Tool 1: analyze_project (Phase 1 — PM Analysis) ────────────────────────

server.tool(
  'analyze_project',
  `Phase 1 — Senior Project Manager Analysis. THIS SHOULD BE THE FIRST TOOL CALLED.

Analyzes the user's project description and produces a structured scope document.
Identifies: project type, industry, tone, target audience, pages needed, complexity, features.
Generates clarifying questions if the request is ambiguous.

Returns: project scope, multi-page structure, clarifying questions, risk assessment.

IMPORTANT: Always call this FIRST before any other tool. It sets up the entire project context.`,
  {
    description: z.string().describe(
      'The user\'s project description. Example: "Build a landing page for a fintech startup targeting millennials with hero, features, pricing, and testimonials"'
    ),
    audience: z.string().optional().describe(
      'Target audience. Examples: "millennials", "enterprise CTOs", "small business owners", "developers"'
    ),
    industry: z.string().optional().describe(
      'Business industry. Examples: "fintech", "healthcare", "saas", "ecommerce", "restaurant", "law firm"'
    ),
    framework: z.string().optional().describe(
      'Preferred framework. Options: "html" (vanilla), "react", "nextjs", "vue", "nuxt", "angular", "svelte", "astro". Default: "html"'
    ),
    pageCount: z.number().optional().describe(
      'Number of pages to generate. Default: auto-detected from project type'
    ),
  },
  async ({ description, audience, industry, framework, pageCount }) => {
    try {
      const result = analyzeProject({
        description,
        audience,
        industry,
        framework,
        pageCount,
      });

      // Store scope for subsequent tool calls
      currentScope = result.scope;
      lastAnalysis = result;

      let output = result.summary;

      if (result.needsClarification && result.clarifyingQuestions.length > 0) {
        output += '\n\n---\n\n### ⚠️ Clarifying Questions\nBefore proceeding, consider these questions:\n';
        result.clarifyingQuestions.forEach((q, i) => {
          output += `\n${i + 1}. ${q}`;
        });
        output += '\n\nYou can proceed to `plan_architecture` or ask the user these questions first.';
      }

      if (result.riskAssessment.length > 0) {
        output += '\n\n### Risk Assessment\n';
        result.riskAssessment.forEach((r) => {
          output += `\n- ${r}`;
        });
      }

      output += '\n\n### Pages Planned\n';
      result.scope.pages.forEach((p) => {
        output += `\n- **${p.name}** (${p.slug}): ${p.sections.join(', ')}`;
      });

      output += `\n\n---\n\n**Next step:** Call \`plan_architecture\` to generate the system architecture and component map.`;

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error analyzing project: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 2: plan_architecture (Phase 2 — Architecture) ─────────────────────

server.tool(
  'plan_architecture',
  `Phase 2 — System Analyst / Solutions Architect.

Takes the project scope (from analyze_project) and generates:
- Technology stack decisions (framework, styling, build tool, routing)
- Component architecture map per page (which UIverse components each section needs)
- File structure for the chosen framework
- Interactivity plan (scroll animations, hover effects, form behaviors)
- Multi-page routing strategy (separate HTML files for vanilla, React Router, file-based for Next/Nuxt)

IMPORTANT: Run analyze_project first. This tool uses the stored project scope.`,
  {
    projectType: z.string().optional().describe(
      'Override project type. If omitted, uses the type from analyze_project.'
    ),
    industry: z.string().optional().describe(
      'Override industry. If omitted, uses industry from analyze_project.'
    ),
    tone: z.string().optional().describe(
      'Override tone. If omitted, uses tone from analyze_project.'
    ),
    framework: z.string().optional().describe(
      'Override framework. If omitted, uses framework from analyze_project.'
    ),
  },
  async ({ projectType, industry, tone, framework }) => {
    try {
      if (!currentScope) {
        return {
          content: [{
            type: 'text' as const,
            text: '⚠️ No project scope found. Please run `analyze_project` first to analyze requirements, then run `plan_architecture`.',
          }],
          isError: true,
        };
      }

      const result = planArchitecture({
        projectType: projectType || currentScope.projectType,
        industry: industry || currentScope.industry,
        tone: tone || currentScope.tone,
        framework: framework || currentScope.framework,
        pages: currentScope.pages,
        features: currentScope.features,
      });

      // Store plan for subsequent tool calls
      currentPlan = result.plan;

      let output = result.summary;

      output += '\n\n### File Structure\n```\n';
      result.plan.fileStructure.forEach((f) => {
        const prefix = f.type === 'directory' ? '📁' : '📄';
        output += `${prefix} ${f.path} — ${f.description}\n`;
      });
      output += '```';

      output += '\n\n### Components Needed\n';
      output += result.plan.allComponentsNeeded.map((c) => `\`${c}\``).join(', ');

      output += '\n\n### Interactivity Plan\n';
      output += `- **Scroll animations:** ${result.plan.interactivity.scrollAnimations.join('; ')}\n`;
      output += `- **Hover effects:** ${result.plan.interactivity.hoverEffects.join('; ')}\n`;
      output += `- **Navigation:** ${result.plan.interactivity.navigationBehavior.join('; ')}\n`;

      output += `\n\n---\n\n**Next step:** Call \`design_theme\` to generate the design system (colors, typography, spacing).`;

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error planning architecture: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 3: design_theme (Phase 3 — Design System) ─────────────────────────

server.tool(
  'design_theme',
  `Phase 3 — Generate a complete, production-ready design system based on business context.

Returns: color palette (primary, secondary, accent, neutrals, semantic), typography (with Google Fonts link), spacing (8px grid), shadows, border radius, transitions — all as CSS custom properties.

The theme is NEVER randomly dark or light — it's chosen based on industry (fintech → light + navy, gaming → dark + neon, etc.). Colors avoid the AI-telltale purple-blue gradient.

Call this AFTER analyze_project and plan_architecture, BEFORE select_components.`,
  {
    industry: z.string().describe(
      'Business industry or type. Examples: "fintech", "healthcare", "saas", "ecommerce", "restaurant", "law firm", "gaming studio", "luxury fashion", "startup", "nonprofit"'
    ),
    tone: z.string().describe(
      'Design tone/personality. Examples: "modern", "corporate", "playful", "minimal", "luxury", "technical", "warm", "bold", "elegant"'
    ),
    themePreference: z.enum(['light', 'dark', 'auto']).optional().describe(
      'Force light/dark theme, or let the engine decide based on industry (recommended: "auto")'
    ),
    brandColor: z.string().optional().describe(
      'Optional brand hex color to use as primary (e.g., "#2563EB"). If omitted, the engine picks the best color for your industry.'
    ),
  },
  async ({ industry, tone, themePreference, brandColor }) => {
    try {
      const result = designTheme({
        industry,
        tone,
        themePreference: themePreference as 'light' | 'dark' | 'auto' | undefined,
        brandColor,
      });

      // Store tokens for subsequent tool calls
      currentTokens = result.tokens;

      let output = result.summary;
      output += `\n\n---\n\n### CSS Variables (copy into your stylesheet)\n\n\`\`\`css\n${result.cssVariables}\n\`\`\``;
      output += `\n\n### Google Fonts Link\n\`\`\`html\n<link href="${result.tokens.typography.fonts.googleFontsUrl}" rel="stylesheet">\n\`\`\``;
      output += `\n\n---\n\n**Next step:** Call \`select_components\` to get themed UI components, then \`generate_background\` for the page background.`;

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error generating theme: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 4: select_components (Phase 3.5 — Component Selection) ─────────────

server.tool(
  'select_components',
  `Phase 3.5 — Select and adapt animated UI components for your framework and design system.

Returns: production-ready component code (HTML/CSS or React/Vue/Angular/Svelte), a locked Design Token Registry (ensuring every button looks the same across the page), and accessibility notes.

61 components across 13 categories × 5 styles (flat, neumorphic, glassmorphic, gradient, animated).
Components have HIGH animation preference — every component has hover effects, entrance animations, focus rings, and micro-interactions.

IMPORTANT: Run design_theme first to generate your design tokens.

Presets: "all" (13 components), "landing" (button + card + nav + badge), "form" (input + checkbox + toggle + radio + buttons), "dashboard" (10 components), "minimal" (button + card + input + nav).`,
  {
    componentTypes: z.array(z.string()).describe(
      'Component categories to select. Use presets: "all", "landing", "form", "dashboard", "minimal". Or specific: "button", "card", "input", "checkbox", "toggle", "radio", "tooltip", "modal", "loader", "badge", "dropdown", "navigation"'
    ),
    framework: z.string().describe(
      'Target framework. Options: "html" (vanilla), "react", "nextjs", "vue", "nuxt", "angular", "svelte", "astro"'
    ),
    animationPreference: z.enum(['low', 'medium', 'high']).optional().describe(
      'Animation richness level. Default: "high" (recommended).'
    ),
    style: z.enum(['flat', 'neumorphic', 'glassmorphic', 'gradient', 'animated']).optional().describe(
      'Component visual style. If omitted, auto-resolved from your industry + tone (corporate→flat, gaming→gradient, luxury→glassmorphic, tech→animated).'
    ),
  },
  async ({ componentTypes, framework, animationPreference, style }) => {
    try {
      if (!currentTokens) {
        return {
          content: [{
            type: 'text' as const,
            text: '⚠️ No design tokens found. Please run `design_theme` first to generate your design system, then run `select_components`.',
          }],
          isError: true,
        };
      }

      const result = selectComponents({
        componentTypes,
        designTokens: currentTokens,
        framework: framework as Framework,
        animationPreference: (animationPreference as 'low' | 'medium' | 'high') || 'high',
        style: style as any,
      });

      let componentBlocks = '';
      for (const comp of result.components) {
        componentBlocks += `\n### ${comp.name} (\`${comp.category}\`)\n\n`;

        if (comp.styles) {
          componentBlocks += `**Styles:**\n\`\`\`css\n${comp.styles}\n\`\`\`\n\n`;
        }

        const lang = ['react', 'nextjs'].includes(comp.framework) ? 'jsx'
          : comp.framework === 'vue' || comp.framework === 'nuxt' ? 'vue'
          : comp.framework === 'angular' ? 'typescript'
          : comp.framework === 'svelte' ? 'svelte'
          : 'html';

        componentBlocks += `**Code:**\n\`\`\`${lang}\n${comp.code}\n\`\`\`\n`;

        if (comp.js) {
          componentBlocks += `\n**JavaScript:**\n\`\`\`javascript\n${comp.js}\n\`\`\`\n`;
        }
      }

      let output = result.summary;
      output += `\n\n---\n${componentBlocks}`;
      output += `\n\n---\n\n**Next step:** Call \`generate_background\` for the page background pattern, then \`scaffold_project\` to generate the project structure.`;

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error selecting components: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 5: generate_background (Phase 4 — Background Pattern) ─────────────

server.tool(
  'generate_background',
  `Phase 4 — Generate a CSS background pattern that matches your industry and theme.

Returns: production-ready CSS for subtle, professional background patterns.

Pattern types: "geometric" (dot grids, line grids — tech/corporate), "gradient" (soft mesh gradients — startups/creative), "noise" (grain texture — luxury/editorial), "organic" (wave dividers — health/education), "blob" (animated shapes — creative/SaaS).

Pattern is auto-selected based on industry. All patterns are barely noticeable — atmosphere, not distraction.

IMPORTANT: Run design_theme first so colors match your palette.`,
  {
    industry: z.string().describe('Business industry for pattern selection'),
    theme: z.enum(['light', 'dark', 'auto']).describe('Theme mode'),
    style: z.string().optional().describe(
      'Pattern style override. Options: "geometric", "gradient", "noise", "organic", "blob", "dots", "grid", "mesh", "wave", "grain"'
    ),
  },
  async ({ industry, theme, style }) => {
    try {
      if (!currentTokens) {
        return {
          content: [{
            type: 'text' as const,
            text: '⚠️ No design tokens found. Please run `design_theme` first, then `generate_background`.',
          }],
          isError: true,
        };
      }

      const result = generateBackgroundTool(
        { industry, theme: theme as 'light' | 'dark', style: style as any },
        currentTokens.colors
      );

      let output = `## Background Pattern Generated\n\n**Style:** ${result.pattern.style}\n**Description:** ${result.pattern.description}`;
      output += `\n\n### CSS\n\`\`\`css\n${result.css}\n\`\`\``;
      output += `\n\n### Usage\nAdd this CSS to your page body or a wrapper element. The pattern is intentionally subtle.`;
      output += `\n\n---\n\n**Next step:** Call \`scaffold_project\` to generate the project directory structure, then \`generate_full_page\` for complete page code.`;

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error generating background: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 6: scaffold_project (Phase 5 — Project Structure) ─────────────────

server.tool(
  'scaffold_project',
  `Phase 5 — Generate the complete project directory structure and base files.

Returns: all project files (CSS reset, variables, animations, base styles, page templates, routing) ready for the chosen framework.

Generates:
- CSS foundation: variables.css (from design tokens), reset.css, animations.css, base.css, layout.css
- JavaScript: animations.js (Intersection Observer), main.js
- Framework-specific: routing, page components, config files
- Project files: package.json, README.md, .gitignore

For vanilla HTML: separate .html files per page with inter-page navigation.
For React/Vue/Angular/Svelte/Next/Nuxt/Astro: proper routing setup with page components.

IMPORTANT: Run design_theme first so the CSS variables file is populated with real tokens.`,
  {
    framework: z.string().describe(
      'Target framework. Options: "html" (vanilla), "react", "nextjs", "vue", "nuxt", "angular", "svelte", "astro"'
    ),
    projectName: z.string().optional().describe(
      'Project name for package.json and README. Default: "ui-architect-project"'
    ),
  },
  async ({ framework, projectName }) => {
    try {
      if (!currentTokens) {
        return {
          content: [{
            type: 'text' as const,
            text: '⚠️ No design tokens found. Please run `design_theme` first, then `scaffold_project`.',
          }],
          isError: true,
        };
      }

      const pages = currentScope?.pages || [{ name: 'Home', slug: 'index', sections: ['hero', 'features', 'cta', 'footer'], isHomepage: true }];

      const result = scaffoldProject({
        framework,
        designTokens: currentTokens,
        pages,
        projectName,
      });

      let output = result.summary;

      output += '\n\n### Generated Files\n';
      result.files.forEach((f) => {
        output += `\n- \`${f.path}\` — ${f.description}`;
      });

      output += `\n\n### Setup Commands\n`;
      output += `\`\`\`bash\n${result.installCommand}\n${result.devCommand}\n\`\`\``;

      // Output file contents
      output += '\n\n---\n\n### File Contents\n';
      for (const file of result.files) {
        const ext = file.path.split('.').pop() || '';
        const lang = ext === 'ts' || ext === 'tsx' ? 'typescript'
          : ext === 'js' || ext === 'jsx' ? 'javascript'
          : ext === 'vue' ? 'vue'
          : ext === 'svelte' ? 'svelte'
          : ext === 'css' ? 'css'
          : ext === 'html' ? 'html'
          : ext === 'json' ? 'json'
          : ext === 'md' ? 'markdown'
          : '';
        output += `\n#### \`${file.path}\`\n\`\`\`${lang}\n${file.content}\n\`\`\`\n`;
      }

      output += `\n\n---\n\n**Next step:** Call \`generate_full_page\` to fill in all page sections with production-ready code and real components.`;

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error scaffolding project: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 7: generate_full_page (Phase 6 — Full Page Code Generation) ───────

server.tool(
  'generate_full_page',
  `Phase 6 — Generate complete, production-ready code for all pages.

Assembles all page sections (hero, features, pricing, testimonials, footer, etc.) into complete pages with:
- Real UI components from the 61-component library (not generic code)
- All CSS using design token variables (zero hardcoded colors)
- Scroll entrance animations on every section
- Rich hover/focus/active states on all interactive elements
- Responsive design (mobile-first with breakpoints)
- Accessibility attributes (ARIA, keyboard nav, focus rings)
- Navigation linking between all pages

For vanilla HTML: generates complete HTML documents per page.
For frameworks: generates framework-specific page components.

IMPORTANT: Run design_theme first. Optionally run scaffold_project to get the project structure.`,
  {
    framework: z.string().describe(
      'Target framework. Options: "html" (vanilla), "react", "nextjs", "vue", "nuxt", "angular", "svelte", "astro"'
    ),
    industry: z.string().optional().describe(
      'Industry context for section content defaults. If omitted, uses stored scope.'
    ),
    includeNavigation: z.boolean().optional().describe(
      'Auto-include navigation on every page. Default: true'
    ),
    includeFooter: z.boolean().optional().describe(
      'Auto-include footer on every page. Default: true'
    ),
  },
  async ({ framework, industry, includeNavigation, includeFooter }) => {
    try {
      if (!currentTokens) {
        return {
          content: [{
            type: 'text' as const,
            text: '⚠️ No design tokens found. Please run `design_theme` first, then `generate_full_page`.',
          }],
          isError: true,
        };
      }

      const pages = currentScope?.pages || [{ name: 'Home', slug: 'index', sections: ['hero', 'features', 'cta'], isHomepage: true }];

      const result = generateFullPage({
        pages,
        framework,
        designTokens: currentTokens,
        industry: industry || currentScope?.industry,
        includeNavigation: includeNavigation !== false,
        includeFooter: includeFooter !== false,
      });

      let output = result.summary;

      // Output each page
      for (const page of result.pages) {
        output += `\n\n---\n\n## Page: ${page.name} (\`${page.slug}\`)\n`;
        output += `**Sections:** ${page.sectionsGenerated.join(', ')}\n`;
        output += `**Components used:** ${page.componentsUsed.join(', ')}\n`;

        if (page.html) {
          const lang = ['react', 'nextjs'].includes(framework) ? 'jsx'
            : framework === 'vue' || framework === 'nuxt' ? 'vue'
            : framework === 'svelte' ? 'svelte'
            : framework === 'angular' ? 'typescript'
            : 'html';
          output += `\n### HTML/Template\n\`\`\`${lang}\n${page.html}\n\`\`\`\n`;
        }

        if (page.css) {
          output += `\n### CSS\n\`\`\`css\n${page.css}\n\`\`\`\n`;
        }

        if (page.js) {
          output += `\n### JavaScript\n\`\`\`javascript\n${page.js}\n\`\`\`\n`;
        }
      }

      if (result.sharedCss) {
        output += `\n\n---\n\n## Shared CSS (animations + keyframes)\n\`\`\`css\n${result.sharedCss}\n\`\`\`\n`;
      }

      if (result.sharedJs) {
        output += `\n\n## Shared JavaScript\n\`\`\`javascript\n${result.sharedJs}\n\`\`\`\n`;
      }

      output += `\n\n---\n\n**Next step:** Call \`review_output\` to run the QA checklist and catch any issues before delivery.`;

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error generating pages: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 8: review_output (Phase 7 — QA Review) ────────────────────────────

server.tool(
  'review_output',
  `Phase 7 — Project Manager QA Review.

Analyzes generated code against the quality checklist from CLAUDE.md. Catches:
- AI-telltale patterns (purple-blue gradients, generic layouts)
- Hardcoded colors (must use CSS variables)
- Missing accessibility (ARIA, labels, keyboard nav, focus states)
- Missing animations (scroll entrance, hover effects, transitions)
- Responsive issues (missing media queries, viewport meta)
- Semantic HTML issues (div soup, missing landmarks)
- Single-page anti-patterns (JS show/hide instead of real pages)
- Pure black/white usage (should use tinted neutrals)

Returns: issue list with severity, score (0-100), pass/fail status, and fix suggestions.

Call this LAST to validate the generated output before delivering to the user.`,
  {
    code: z.string().describe(
      'The generated HTML/CSS/JS code to review. Pass the complete output from generate_full_page or generate_section.'
    ),
    industry: z.string().optional().describe(
      'Industry context for checking business-appropriate design choices.'
    ),
    checkAccessibility: z.boolean().optional().describe('Run accessibility checks. Default: true'),
    checkAnimations: z.boolean().optional().describe('Run animation density checks. Default: true'),
    checkConsistency: z.boolean().optional().describe('Run design consistency checks. Default: true'),
    checkAntiPatterns: z.boolean().optional().describe('Run AI anti-pattern detection. Default: true'),
  },
  async ({ code, industry, checkAccessibility, checkAnimations, checkConsistency, checkAntiPatterns }) => {
    try {
      const result = reviewOutput({
        code,
        industry: industry || currentScope?.industry,
        checkAccessibility: checkAccessibility !== false,
        checkAnimations: checkAnimations !== false,
        checkConsistency: checkConsistency !== false,
        checkAntiPatterns: checkAntiPatterns !== false,
      });

      let output = `## QA Review Results\n\n`;
      output += `**Score:** ${result.score}/100\n`;
      output += `**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
      output += result.summary;

      if (result.issues.length > 0) {
        output += '\n\n### Issues Found\n';

        const errors = result.issues.filter((i) => i.severity === 'error');
        const warnings = result.issues.filter((i) => i.severity === 'warning');
        const infos = result.issues.filter((i) => i.severity === 'info');

        if (errors.length > 0) {
          output += '\n#### 🔴 Errors (must fix)\n';
          errors.forEach((issue) => {
            output += `\n- **${issue.category}**: ${issue.message}\n  → Fix: ${issue.suggestion}\n`;
          });
        }

        if (warnings.length > 0) {
          output += '\n#### 🟡 Warnings (should fix)\n';
          warnings.forEach((issue) => {
            output += `\n- **${issue.category}**: ${issue.message}\n  → Fix: ${issue.suggestion}\n`;
          });
        }

        if (infos.length > 0) {
          output += '\n#### 🔵 Info (nice to fix)\n';
          infos.forEach((issue) => {
            output += `\n- **${issue.category}**: ${issue.message}\n  → Fix: ${issue.suggestion}\n`;
          });
        }
      } else {
        output += '\n\n✨ No issues found! The code passes all quality checks.';
      }

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error reviewing output: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 9: explore_components (Phase 3.2 — UIverse Component Explorer) ────

server.tool(
  'explore_components',
  `Phase 3.2 — Fetch REAL animated UI components from UIverse.io's open-source library (4,300+ components on GitHub).

This makes the MCP server HYBRID — it goes beyond the built-in 61 components and fetches fresh, community-built components directly from UIverse's GitHub repository (uiverse-io/galaxy).

Returns: actual HTML/CSS code for each component, animation scores, and source URLs.

Components are ranked by animation richness — the most animated components (with @keyframes, transitions, hover effects) are returned first.

Use this to discover new, unique components beyond the built-in library. Combine with select_components for the best of both worlds.

Categories: buttons, cards, loaders, inputs, checkboxes, toggles, radio-buttons, forms, dropdowns, navigation, tooltips, badges, modals.`,
  {
    categories: z.array(z.string()).describe(
      'Component categories to explore. Examples: ["buttons", "cards", "loaders", "inputs"]. Supports aliases: "button", "btn", "spinner", etc.'
    ),
    preferAnimated: z.boolean().optional().describe(
      'Prefer components with rich CSS animations. Default: true'
    ),
    maxPerCategory: z.number().optional().describe(
      'Max components to return per category. Default: 5'
    ),
    searchQuery: z.string().optional().describe(
      'Optional keyword filter. Examples: "neon", "glow", "gradient", "bounce", "3d"'
    ),
  },
  async ({ categories, preferAnimated, maxPerCategory, searchQuery }) => {
    try {
      const result = await exploreComponents({
        categories,
        preferAnimated: preferAnimated !== false,
        maxPerCategory: maxPerCategory || 5,
        searchQuery,
      });

      let output = result.summary;

      if (result.components.length > 0) {
        output += '\n\n---\n';

        for (const comp of result.components) {
          output += `\n### ${comp.name} (${comp.category})`;
          output += `\n**Animations:** ${comp.hasAnimations ? `Yes (${comp.animationCount} animations)` : 'No'}`;
          output += `\n**Source:** [GitHub](${comp.sourceUrl})\n`;

          if (comp.css) {
            output += `\n**CSS:**\n\`\`\`css\n${comp.css}\n\`\`\`\n`;
          }

          if (comp.html) {
            output += `\n**HTML:**\n\`\`\`html\n${comp.html}\n\`\`\`\n`;
          }
        }
      }

      if (result.fromCache) {
        output += '\n\n*(Results served from cache)*';
      }

      output += '\n\n---\n\n**Next:** Use these components directly in your pages, or combine with `select_components` for the built-in themed library.';

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error exploring components: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 10: seo_audit (Phase 6.5 — SEO & Marketing Audit) ─────────────────

server.tool(
  'seo_audit',
  `Phase 6.5 — SEO & Digital Marketing Audit.

Analyzes generated HTML for SEO optimization and digital marketing readiness.
Checks 50+ factors across 10 categories: meta tags, heading structure, images, performance, accessibility, content quality, technical SEO, mobile optimization, social media readiness, and link structure.

Returns: SEO score (0-100), letter grade (A-F), detailed issue list with severity + fix instructions + code snippets, and top 5 priority recommendations.

Issues feed back into the pipeline — if the score is too low, re-run code generation with the suggested fixes.

Call this AFTER generate_full_page, BEFORE review_output.`,
  {
    code: z.string().describe(
      'The generated HTML code to audit. Pass the complete page HTML from generate_full_page.'
    ),
    industry: z.string().optional().describe(
      'Industry context for SEO recommendations (e.g., "fintech", "ecommerce", "healthcare")'
    ),
    targetKeywords: z.array(z.string()).optional().describe(
      'Target SEO keywords to check for in headings and content (e.g., ["budgeting app", "personal finance"])'
    ),
    pageType: z.string().optional().describe(
      'Page type for context-aware checks: "landing", "product", "blog", "about", "contact"'
    ),
    pageName: z.string().optional().describe(
      'Page name for the audit report'
    ),
  },
  async ({ code, industry, targetKeywords, pageType, pageName }) => {
    try {
      const result = seoAudit({
        code,
        industry: industry || currentScope?.industry,
        targetKeywords,
        pageType,
        pageName,
      });

      let output = `## SEO Audit Results\n\n`;
      output += `**Score:** ${result.score}/100 (Grade: ${result.grade})\n`;
      output += `**Status:** ${result.passed ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}\n\n`;
      output += result.summary;

      if (result.recommendations.length > 0) {
        output += '\n\n### Top Priority Fixes\n';
        result.recommendations.forEach((r, i) => {
          output += `\n${i + 1}. ${r}`;
        });
      }

      if (result.missingElements.length > 0) {
        output += '\n\n### Missing SEO Elements\n';
        output += 'Add these to your HTML:\n';
        result.missingElements.forEach((el) => {
          output += `\n- \`${el}\``;
        });
      }

      if (result.issues.length > 0) {
        output += '\n\n### Detailed Issues\n';

        const critical = result.issues.filter((i) => i.severity === 'critical');
        const major = result.issues.filter((i) => i.severity === 'major');
        const minor = result.issues.filter((i) => i.severity === 'minor');
        const suggestions = result.issues.filter((i) => i.severity === 'suggestion');

        if (critical.length > 0) {
          output += '\n#### 🔴 Critical\n';
          critical.forEach((issue) => {
            output += `\n- **${issue.category}**: ${issue.issue}\n  Impact: ${issue.impact}\n  Fix: ${issue.fix}`;
            if (issue.codeSnippet) output += `\n  \`\`\`html\n  ${issue.codeSnippet}\n  \`\`\``;
            output += '\n';
          });
        }

        if (major.length > 0) {
          output += '\n#### 🟠 Major\n';
          major.forEach((issue) => {
            output += `\n- **${issue.category}**: ${issue.issue}\n  Impact: ${issue.impact}\n  Fix: ${issue.fix}`;
            if (issue.codeSnippet) output += `\n  \`\`\`html\n  ${issue.codeSnippet}\n  \`\`\``;
            output += '\n';
          });
        }

        if (minor.length > 0) {
          output += '\n#### 🟡 Minor\n';
          minor.forEach((issue) => {
            output += `\n- **${issue.category}**: ${issue.issue}\n  Fix: ${issue.fix}\n`;
          });
        }

        if (suggestions.length > 0) {
          output += '\n#### 💡 Suggestions\n';
          suggestions.forEach((issue) => {
            output += `\n- **${issue.category}**: ${issue.issue}\n  Fix: ${issue.fix}\n`;
          });
        }
      }

      output += '\n\n---\n\n**Next:** Fix the issues above, then call `design_consistency_check` for multi-page consistency, followed by `review_output` for final QA.';

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error running SEO audit: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 11: design_consistency_check (Phase 6.7 — Multi-Page Consistency) ──

server.tool(
  'design_consistency_check',
  `Phase 6.7 — Design Consistency Checker for multi-page websites.

Validates that ALL pages of a website look like they were designed by ONE designer.
Checks: header/footer identity across pages, typography consistency, color system adherence, spacing uniformity, component style consistency, layout patterns, animation usage, and navigation completeness.

Returns: consistency score (0-100), per-page report, and detailed issues with affected pages listed.

CRITICAL for multi-page sites — ensures the header, footer, and design language stay identical across every page. This is what separates professional templates from amateur ones.

Call this AFTER generating all pages with generate_full_page.`,
  {
    pages: z.array(z.object({
      name: z.string().describe('Page name'),
      slug: z.string().describe('Page slug/filename'),
      html: z.string().describe('Full HTML of the page'),
      css: z.string().describe('Full CSS of the page'),
    })).describe(
      'Array of all generated pages with their HTML and CSS code'
    ),
  },
  async ({ pages }) => {
    try {
      const result = designConsistencyCheck({ pages });

      let output = `## Design Consistency Report\n\n`;
      output += `**Score:** ${result.score}/100\n`;
      output += `**Status:** ${result.passed ? '✅ CONSISTENT' : '❌ INCONSISTENCIES FOUND'}\n\n`;
      output += result.summary;

      if (result.pageReport.length > 0) {
        output += '\n\n### Per-Page Scores\n';
        result.pageReport.forEach((pr) => {
          const emoji = pr.consistencyScore >= 90 ? '🟢' : pr.consistencyScore >= 70 ? '🟡' : '🔴';
          output += `\n${emoji} **${pr.name}**: ${pr.consistencyScore}/100 (${pr.issueCount} issues)`;
        });
      }

      if (result.issues.length > 0) {
        output += '\n\n### Issues\n';

        const errors = result.issues.filter((i) => i.severity === 'error');
        const warnings = result.issues.filter((i) => i.severity === 'warning');
        const infos = result.issues.filter((i) => i.severity === 'info');

        if (errors.length > 0) {
          output += '\n#### 🔴 Errors (structural mismatches)\n';
          errors.forEach((issue) => {
            output += `\n- **${issue.category}**: ${issue.message}\n  Pages: ${issue.affectedPages.join(', ')}\n  Fix: ${issue.fix}\n`;
          });
        }

        if (warnings.length > 0) {
          output += '\n#### 🟡 Warnings (style inconsistencies)\n';
          warnings.forEach((issue) => {
            output += `\n- **${issue.category}**: ${issue.message}\n  Pages: ${issue.affectedPages.join(', ')}\n  Fix: ${issue.fix}\n`;
          });
        }

        if (infos.length > 0) {
          output += '\n#### 🔵 Info\n';
          infos.forEach((issue) => {
            output += `\n- **${issue.category}**: ${issue.message}\n  Fix: ${issue.fix}\n`;
          });
        }
      } else {
        output += '\n\n✨ Perfect consistency across all pages!';
      }

      output += '\n\n---\n\n**Next:** Call `review_output` for the final QA review.';

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error checking consistency: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 12: generate_build_manifest (Final — Component Report) ─────────────

server.tool(
  'generate_build_manifest',
  `Final Phase — Generate a Build Manifest / Component Report as a Markdown file.

Documents EVERY component used on EVERY page of the website, including:
- Per-page section breakdown with component listings
- UIverse GitHub source URLs for every component
- Built-in library references with browse links
- Design token summary (colors, fonts, theme)
- SEO audit score, consistency score, QA review score
- Complete pipeline metadata

THIS IS THE LAST TOOL TO CALL. Run it at the end of every pipeline to generate the final report.

The Markdown file acts as a project handoff document — it tells the developer exactly what was used, where it came from, and links to every component source.`,
  {
    projectName: z.string().describe(
      'Project name for the manifest header'
    ),
    framework: z.string().describe(
      'Framework used (html, react, nextjs, vue, etc.)'
    ),
    pages: z.array(z.object({
      name: z.string(),
      slug: z.string(),
      sections: z.array(z.string()),
      componentsUsed: z.array(z.string()),
    })).describe(
      'Array of pages from generate_full_page output (name, slug, sections, componentsUsed)'
    ),
    uiverseComponents: z.array(z.object({
      name: z.string(),
      category: z.string(),
      sourceUrl: z.string(),
      hasAnimations: z.boolean(),
      animationCount: z.number(),
    })).optional().describe(
      'UIverse components from explore_components (name, category, sourceUrl, hasAnimations, animationCount)'
    ),
    builtInComponents: z.array(z.object({
      id: z.string(),
      category: z.string(),
      style: z.string(),
      name: z.string(),
      animationLevel: z.string(),
    })).optional().describe(
      'Built-in components from select_components (id, category, style, name, animationLevel)'
    ),
    designSummary: z.object({
      industry: z.string(),
      tone: z.string(),
      theme: z.string(),
      primaryColor: z.string(),
      secondaryColor: z.string(),
      fontHeading: z.string(),
      fontBody: z.string(),
    }).optional().describe(
      'Design system summary from design_theme'
    ),
    auditScores: z.object({
      seoScore: z.number().optional(),
      seoGrade: z.string().optional(),
      consistencyScore: z.number().optional(),
      reviewScore: z.number().optional(),
      reviewPassed: z.boolean().optional(),
    }).optional().describe(
      'Scores from seo_audit, design_consistency_check, and review_output'
    ),
  },
  async ({ projectName, framework, pages, uiverseComponents, builtInComponents, designSummary, auditScores }) => {
    try {
      const result = generateBuildManifest({
        projectName,
        framework,
        pages,
        uiverseComponents: uiverseComponents as any,
        builtInComponents: builtInComponents as any,
        designSummary: designSummary as any,
        auditScores: auditScores as any,
      });

      let output = result.summary;
      output += '\n\n---\n\n';
      output += '### BUILD-MANIFEST.md\n\n';
      output += result.markdown;

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error generating build manifest: ${String(error)}` }],
        isError: true,
      };
    }
  }
);

// ─── Start Server ────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('UI Architect MCP Server v3.0.0 running on stdio — 12 tools loaded');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
