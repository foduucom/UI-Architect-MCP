/**
 * MCP Tool: run_pipeline
 *
 * The Orchestrator — runs the entire 13-tool pipeline end-to-end in one call.
 *
 * Accepts a project description and optional parameters, then:
 *   1. analyze_project    → scope, pages, sections
 *   2. plan_architecture  → stack, component map, file structure
 *   3. design_theme       → colors, typography, spacing tokens
 *   4. explore_components → fetch animated components from UIverse (optional)
 *   5. select_components  → pick & adapt components from built-in library
 *   6. generate_background → CSS background pattern
 *   7. scaffold_project   → directory structure & base files
 *   8. fetch_images       → stock photos + SVG icons per section
 *   9. generate_full_page → complete page code for every page
 *  10. seo_audit          → SEO quality check (with auto-retry if score < threshold)
 *  11. design_consistency → multi-page consistency check
 *  12. review_output      → QA anti-pattern detection
 *  13. generate_build_manifest → final report
 *
 * If SEO score < 70 or QA fails, the pipeline re-generates affected pages
 * with fix hints and audits again (up to 2 retries).
 *
 * Built by FODUU (https://foduu.com) — India's Web Design Company
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { analyzeProject, type AnalyzeProjectOutput, type ProjectScope } from './analyze-project.js';
import { planArchitecture, type ArchitecturePlan } from './plan-architecture.js';
import { designTheme } from './design-theme.js';
import { selectComponents } from './select-components.js';
import { generateBackgroundTool } from './generate-background.js';
import { scaffoldProject } from './scaffold-project.js';
import { generateFullPage, type GenerateFullPageOutput, type GeneratedPage } from './generate-full-page.js';
import { reviewOutput, type ReviewOutput } from './review-output.js';
import { exploreComponents } from './explore-components.js';
import { seoAudit, type SeoAuditOutput } from './seo-audit.js';
import { designConsistencyCheck } from './design-consistency-check.js';
import { generateBuildManifest } from './generate-build-manifest.js';
import { fetchImages } from './fetch-images.js';
import { seoFix } from './seo-fix.js';
import { generateContent } from './generate-content.js';
import type { GeneratedContent } from './generate-content.js';
import { adaptUIverseComponents, loadLocalUIverseMap, type UIverseComponentMap } from '../engine/uiverse-adapter.js';
import type { DesignTokens } from '../engine/types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RunPipelineInput {
  description: string;
  audience?: string;
  industry?: string;
  framework?: string;
  pageCount?: number;
  themePreference?: 'light' | 'dark' | 'auto';
  brandColor?: string;
  /** Brand/company name — displayed in navigation, footer, meta tags, and content */
  brandName?: string;
  /** Explicit page names — overrides auto-detected template pages */
  pageNames?: string[];
  skipUIverse?: boolean;
  seoThreshold?: number;
  qaThreshold?: number;
  maxRetries?: number;
  /** Absolute path to write all generated files to disk. If provided, files are written and a compact summary is returned instead of full code. */
  outputDir?: string;
}

export interface PipelineStepResult {
  step: string;
  status: 'success' | 'warning' | 'error' | 'skipped';
  duration: number;
  message: string;
}

export interface RunPipelineOutput {
  projectName: string;
  framework: string;
  pages: GeneratedPage[];
  sharedCss: string;
  sharedJs: string;
  scaffoldFiles: Array<{ path: string; content: string }>;
  backgroundCss: string;
  seoScore: number;
  seoGrade: string;
  consistencyScore: number;
  qaScore: number;
  qaPassed: boolean;
  buildManifest: string;
  pipelineLog: PipelineStepResult[];
  totalDuration: number;
  summary: string;
  retryCount: number;
}

// ─── Pipeline Step Timer ────────────────────────────────────────────────────

function timedStep<T>(
  stepName: string,
  fn: () => T,
  log: PipelineStepResult[],
): T {
  const start = Date.now();
  try {
    const result = fn();
    log.push({
      step: stepName,
      status: 'success',
      duration: Date.now() - start,
      message: `${stepName} completed`,
    });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    log.push({
      step: stepName,
      status: 'error',
      duration,
      message: `${stepName} failed: ${String(error)}`,
    });
    throw error;
  }
}

async function timedStepAsync<T>(
  stepName: string,
  fn: () => Promise<T>,
  log: PipelineStepResult[],
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    log.push({
      step: stepName,
      status: 'success',
      duration: Date.now() - start,
      message: `${stepName} completed`,
    });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    log.push({
      step: stepName,
      status: 'error',
      duration,
      message: `${stepName} failed: ${String(error)}`,
    });
    throw error;
  }
}

// ─── Main Pipeline Orchestrator ─────────────────────────────────────────────

export async function runPipeline(input: RunPipelineInput): Promise<RunPipelineOutput> {
  const pipelineStart = Date.now();
  const log: PipelineStepResult[] = [];
  const seoThreshold = input.seoThreshold ?? 70;
  const qaThreshold = input.qaThreshold ?? 60;
  const maxRetries = input.maxRetries ?? 2;

  // ── Step 1: Analyze Project ──────────────────────────────────────────────

  const analysis = timedStep('1. analyze_project', () => {
    return analyzeProject({
      description: input.description,
      audience: input.audience,
      industry: input.industry,
      framework: input.framework,
      pageCount: input.pageCount,
      brandName: input.brandName,
      pageNames: input.pageNames,
    });
  }, log);

  const scope: ProjectScope = analysis.scope;
  const projectName = scope.projectType
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // ── Step 2: Plan Architecture ────────────────────────────────────────────

  const architecture = timedStep('2. plan_architecture', () => {
    return planArchitecture({
      projectType: scope.projectType,
      industry: scope.industry,
      tone: scope.tone,
      framework: scope.framework,
      pages: scope.pages,
      features: scope.features,
    });
  }, log);

  const plan: ArchitecturePlan = architecture.plan;
  const framework = scope.framework || 'html';

  // ── Step 3: Design Theme ─────────────────────────────────────────────────

  const theme = timedStep('3. design_theme', () => {
    return designTheme({
      industry: scope.industry,
      tone: scope.tone,
      themePreference: input.themePreference || 'auto',
      brandColor: input.brandColor,
      brandName: scope.brandName,
    });
  }, log);

  const tokens: DesignTokens = theme.tokens;

  // ── Step 4: Explore Components (optional — from UIverse GitHub) ──────────

  let uiverseComponents: any[] = [];
  let adaptedUIverse: UIverseComponentMap | null = null;

  if (!input.skipUIverse) {
    const mappedCategories: string[] = [];
    for (const c of plan.allComponentsNeeded) {
      let mapped: string | null = null;
      if (c.includes('button')) mapped = 'buttons';
      else if (c.includes('card')) mapped = 'cards';
      else if (c.includes('input')) mapped = 'inputs';
      else if (c.includes('loader')) mapped = 'loaders';
      else if (c.includes('toggle')) mapped = 'toggle-switches';
      else if (c.includes('checkbox')) mapped = 'checkboxes';
      else if (c.includes('radio')) mapped = 'radio-buttons';
      else if (c.includes('tooltip')) mapped = 'tooltips';
      else if (c.includes('badge')) mapped = 'badges';
      else if (c.includes('nav')) mapped = 'navigation';
      if (mapped && !mappedCategories.includes(mapped)) {
        mappedCategories.push(mapped);
      }
    }

    try {
      const explored = await timedStepAsync('4. explore_components', async () => {
        return exploreComponents({
          categories: mappedCategories,
          preferAnimated: true,
          maxPerCategory: 3,
        });
      }, log);

      uiverseComponents = explored.components || [];

      // Adapt UIverse components — remap colors to CSS variables, normalize class names
      if (uiverseComponents.length > 0) {
        adaptedUIverse = timedStep('4b. adapt_uiverse_components', () => {
          return adaptUIverseComponents(uiverseComponents);
        }, log);
      } else {
        throw new Error('No components found on GitHub');
      }
    } catch (err) {
      // Non-blocking fallback to local UIverse-quality components
      log.push({
        step: '4. explore_components',
        status: 'warning',
        duration: 0,
        message: `Remote fetch failed (${err instanceof Error ? err.message : String(err)}). Using high-quality local components instead.`,
      });
      
      adaptedUIverse = timedStep('4b. load_local_uiverse_components', () => {
        return loadLocalUIverseMap(mappedCategories);
      }, log);
    }
  } else {
    log.push({
      step: '4. explore_components',
      status: 'skipped',
      duration: 0,
      message: 'Skipped — skipUIverse=true. Loading local components.',
    });
    
    // Even if skipped, we load local components for quality
      adaptedUIverse = timedStep('4b. load_local_uiverse_components', () => {
        const mappedCategories: string[] = [];
        for (const c of plan.allComponentsNeeded) {
          let mapped: string | null = null;
          if (c.includes('button')) mapped = 'buttons';
          else if (c.includes('card')) mapped = 'cards';
          else if (c.includes('input')) mapped = 'inputs';
          else if (c.includes('loader')) mapped = 'loaders';
          else if (c.includes('toggle')) mapped = 'toggle-switches';
          else if (c.includes('checkbox')) mapped = 'checkboxes';
          else if (c.includes('radio')) mapped = 'radio-buttons';
          else if (c.includes('tooltip')) mapped = 'tooltips';
          else if (c.includes('badge')) mapped = 'badges';
          else if (c.includes('nav')) mapped = 'navigation';
          if (mapped && !mappedCategories.includes(mapped)) mappedCategories.push(mapped);
        }
        return loadLocalUIverseMap(mappedCategories);
      }, log);
  }

  // ── Step 5: Select Components (from built-in library) ────────────────────

  const selected = timedStep('5. select_components', () => {
    return selectComponents({
      componentTypes: plan.allComponentsNeeded,
      framework,
      designTokens: tokens,
      animationPreference: 'high',
    });
  }, log);

  // ── Step 6: Generate Background ──────────────────────────────────────────

  const background = timedStep('6. generate_background', () => {
    return generateBackgroundTool(
      {
        industry: scope.industry,
        theme: tokens.themeMode || 'light',
      },
      tokens.colors as any,
    );
  }, log);

  const backgroundCss = background.css || '';

  // ── Step 7: Scaffold Project ─────────────────────────────────────────────

  const scaffold = timedStep('7. scaffold_project', () => {
    return scaffoldProject({
      framework,
      designTokens: tokens,
      pages: scope.pages.map((p) => ({
        name: p.name,
        slug: p.slug,
        sections: p.sections,
        isHomepage: p.isHomepage ?? p.slug === 'index',
      })),
      projectName: projectName,
      uiverseComponents: adaptedUIverse,
    });
  }, log);

  // ── Step 8: Fetch Images ─────────────────────────────────────────────────

  const allSections = scope.pages.flatMap((p) =>
    p.sections.map((s) => ({
      sectionType: s,
      industry: scope.industry,
    }))
  );
  // Deduplicate by sectionType
  const uniqueSections = allSections.filter(
    (s, i, a) => a.findIndex((x) => x.sectionType === s.sectionType) === i
  );

  let imageData: any = { images: {}, totalImages: 0, sources: {}, attributions: [] };
  try {
    imageData = await timedStepAsync('8. fetch_images', async () => {
      return fetchImages({
        sections: uniqueSections,
        industry: scope.industry,
      });
    }, log);
  } catch {
    log.push({
      step: '8. fetch_images',
      status: 'warning',
      duration: 0,
      message: 'Image fetch failed. Sections will use default placeholders.',
    });
  }

  // ── Step 8b: Generate Content (industry-aware copy for all sections) ─────

  const contentMap: Record<string, GeneratedContent> = {};
  try {
    timedStep('8b. generate_content', () => {
      const allSectionTypes = new Set<string>();
      for (const page of scope.pages) {
        for (const s of page.sections) {
          if (s !== 'navigation' && s !== 'navbar' && s !== 'footer') {
            allSectionTypes.add(s);
          }
        }
      }
      for (const sectionType of allSectionTypes) {
        try {
          const result = generateContent({
            sectionType,
            industry: scope.industry,
            brandName: scope.brandName,
            tone: scope.tone || 'professional',
          });
          contentMap[sectionType] = result.content;
        } catch (err) {
          log.push({
            step: `8b. generate_content (${sectionType})`,
            status: 'warning',
            duration: 0,
            message: `Content generation failed for "${sectionType}": ${err instanceof Error ? err.message : String(err)}. Will use default content.`,
          });
        }
      }
    }, log);
  } catch {
    log.push({
      step: '8b. generate_content',
      status: 'warning',
      duration: 0,
      message: 'Content generation skipped. Using default content.',
    });
  }

  // ── Step 9: Generate Full Pages (with retry loop) ────────────────────────

  let retryCount = 0;
  let fullPageOutput: GenerateFullPageOutput;
  let seoResult: SeoAuditOutput | null = null;
  let qaResult: ReviewOutput | null = null;
  let consistencyScore = 100;

  // Initial generation
  fullPageOutput = timedStep('9. generate_full_page', () => {
    // Extract CSS from built-in components to ensure they have styles
    const builtInCss = selected.components.map(c => c.styles).join('\n\n');

    return generateFullPage({
      allPages: scope.pages,
      pagesToGenerate: scope.pages,
      framework,
      designTokens: tokens,
      industry: scope.industry,
      includeNavigation: true,
      includeFooter: true,
      brandName: scope.brandName,
      uiverseComponents: adaptedUIverse,
      imageData: imageData.images || null,
      content: Object.keys(contentMap).length > 0 ? contentMap : null,
      skipSharedFiles: false,
    });
  }, log);

  // ── Steps 10-12: Audit & Review Loop ─────────────────────────────────────

  let seoScore = 0;
  let seoGrade = 'F';
  let qaScore = 0;
  let qaPassed = false;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const isRetry = attempt > 0;

    if (isRetry) {
      retryCount++;
      log.push({
        step: `Retry #${retryCount}`,
        status: 'warning',
        duration: 0,
        message: `Re-generating pages due to ${seoScore < seoThreshold ? 'low SEO score' : 'QA failure'} (attempt ${attempt + 1}/${maxRetries + 1})`,
      });

      // Try SEO auto-fix on existing pages before re-generating
      let seoFixApplied = false;
      if (seoScore < seoThreshold && seoResult) {
        for (let pi = 0; pi < fullPageOutput.pages.length; pi++) {
          const page = fullPageOutput.pages[pi];
          try {
            const fixed = await timedStepAsync(`seo_fix (${page.name}) [retry #${retryCount}]`, async () => {
              return seoFix({
                html: page.html,
                css: page.css,
                auditResult: seoResult!,
                industry: scope.industry,
                pageName: page.name,
              });
            }, log);

            // Always reassign — seoFix may normalize HTML even when fixCount is 0
            fullPageOutput.pages[pi] = {
              ...page,
              html: fixed.html,
              css: fixed.css,
            };
            if (fixed.fixCount > 0) seoFixApplied = true;
          } catch {
            // SEO fix failed — continue with re-generation
          }
        }
      }

      // Only re-generate from scratch if SEO fixes weren't just applied
      // (give the next audit cycle a chance to check if fixes improved the score)
      if (!seoFixApplied) {
        // Re-generate pages
        fullPageOutput = timedStep(`9. generate_full_page (retry #${retryCount})`, () => {
          const builtInCss = selected.components.map(c => c.styles).join('\n\n');
          return generateFullPage({
            allPages: scope.pages,
            pagesToGenerate: scope.pages,
            framework,
            designTokens: tokens,
            industry: scope.industry,
            includeNavigation: true,
            includeFooter: true,
            brandName: scope.brandName,
            uiverseComponents: adaptedUIverse,
            imageData: imageData.images || null,
            content: Object.keys(contentMap).length > 0 ? contentMap : null,
            skipSharedFiles: false,
          });
        }, log);
      }
    }

    // Step 10: SEO Audit (on each page)
    const seoScores: number[] = [];
    for (const page of fullPageOutput.pages) {
      try {
        const audit = timedStep(`10. seo_audit (${page.name})${isRetry ? ` [retry #${retryCount}]` : ''}`, () => {
          const fullCode = `${page.html}\n<style>\n${page.css}\n</style>`;
          return seoAudit({
            code: fullCode,
            pageName: page.name,
            industry: scope.industry,
          });
        }, log);
        seoScores.push(audit.score);
        if (!seoResult || audit.score < (seoResult.score || 100)) {
          seoResult = audit;
        }
      } catch {
        seoScores.push(50); // default on error
      }
    }
    seoScore = Math.round(seoScores.reduce((a, b) => a + b, 0) / seoScores.length);
    seoGrade = seoScore >= 90 ? 'A' : seoScore >= 80 ? 'B' : seoScore >= 70 ? 'C' : seoScore >= 60 ? 'D' : 'F';

    // Step 11: Design Consistency Check (if multi-page)
    if (fullPageOutput.pages.length > 1) {
      try {
        const consistency = timedStep(`11. design_consistency_check${isRetry ? ` [retry #${retryCount}]` : ''}`, () => {
          return designConsistencyCheck({
            pages: fullPageOutput.pages.map((p) => ({
              name: p.name,
              slug: p.slug,
              html: p.html,
              css: p.css,
            })),
          });
        }, log);
        consistencyScore = consistency.score ?? 100;
      } catch {
        consistencyScore = 75;
      }
    } else {
      log.push({
        step: '11. design_consistency_check',
        status: 'skipped',
        duration: 0,
        message: 'Single-page project — consistency check not needed.',
      });
      consistencyScore = 100;
    }

    // Step 12: QA Review (on combined output)
    const combinedCode = fullPageOutput.pages
      .map((p) => `<!-- Page: ${p.name} -->\n${p.html}\n<style>\n${p.css}\n</style>`)
      .join('\n\n');

    try {
      qaResult = timedStep(`12. review_output${isRetry ? ` [retry #${retryCount}]` : ''}`, () => {
        return reviewOutput({
          code: combinedCode,
          industry: scope.industry,
          checkAccessibility: true,
          checkAnimations: true,
          checkConsistency: true,
          checkAntiPatterns: true,
        });
      }, log);
      qaScore = qaResult.score;
      qaPassed = qaResult.passed;
    } catch {
      qaScore = 50;
      qaPassed = false;
    }

    // Check if quality passes thresholds
    if (seoScore >= seoThreshold && (qaPassed || qaScore >= qaThreshold)) {
      break; // Quality is good — no more retries
    }

    // If this was the last attempt, don't retry
    if (attempt === maxRetries) {
      log.push({
        step: 'Quality Gate',
        status: 'warning',
        duration: 0,
        message: `Max retries (${maxRetries}) reached. SEO: ${seoScore}/100, QA: ${qaScore}/100. Delivering best result.`,
      });
    }
  }

  // ── Step 13: Generate Build Manifest ─────────────────────────────────────

  let buildManifest = '';
  try {
    const manifest = timedStep('13. generate_build_manifest', () => {
      return generateBuildManifest({
        projectName,
        framework,
        pages: fullPageOutput.pages.map((p) => ({
          name: p.name,
          slug: p.slug,
          sections: p.sectionsGenerated,
          componentsUsed: p.componentsUsed,
        })),
        builtInComponents: selected.components?.map((c: any) => ({
          id: c.id || c.name,
          category: c.category,
          style: c.style || 'flat',
          name: c.name,
          animationLevel: c.animationLevel || 'high',
        })),
        uiverseComponents: uiverseComponents.map((c: any) => ({
          name: c.name || 'Unknown',
          category: c.category || 'unknown',
          sourceUrl: c.sourceUrl || '',
          hasAnimations: c.hasAnimations ?? true,
          animationCount: c.animationCount ?? 0,
        })),
        designSummary: {
          industry: scope.industry,
          tone: scope.tone,
          theme: tokens.themeMode || 'light',
          primaryColor: tokens.colors?.primary || '',
          secondaryColor: tokens.colors?.secondary || '',
          fontHeading: tokens.typography?.fonts?.heading || '',
          fontBody: tokens.typography?.fonts?.body || '',
        },
        auditScores: {
          seoScore,
          seoGrade,
          consistencyScore,
          reviewScore: qaScore,
          reviewPassed: qaPassed,
        },
      });
    }, log);
    buildManifest = manifest.markdown;
  } catch {
    buildManifest = '# Build Manifest\n\nFailed to generate manifest.';
    log.push({
      step: '13. generate_build_manifest',
      status: 'error',
      duration: 0,
      message: 'Manifest generation failed.',
    });
  }

  // ── Build Summary ────────────────────────────────────────────────────────

  const totalDuration = Date.now() - pipelineStart;
  const successCount = log.filter((s) => s.status === 'success').length;
  const warningCount = log.filter((s) => s.status === 'warning').length;
  const errorCount = log.filter((s) => s.status === 'error').length;

  let summary = `# Pipeline Complete: ${projectName}\n\n`;
  summary += `**Framework:** ${framework}\n`;
  summary += `**Pages:** ${fullPageOutput.pages.length}\n`;
  summary += `**Industry:** ${scope.industry} | **Tone:** ${scope.tone} | **Theme:** ${tokens.themeMode || 'light'}\n`;
  summary += `**Total Duration:** ${(totalDuration / 1000).toFixed(1)}s\n`;
  summary += `**Retries:** ${retryCount}\n\n`;

  summary += `## Quality Scores\n\n`;
  summary += `| Metric | Score | Status |\n`;
  summary += `|--------|-------|--------|\n`;
  summary += `| SEO | ${seoScore}/100 (${seoGrade}) | ${seoScore >= seoThreshold ? '✅' : '⚠️'} |\n`;
  summary += `| Consistency | ${consistencyScore}/100 | ${consistencyScore >= 80 ? '✅' : '⚠️'} |\n`;
  summary += `| QA Review | ${qaScore}/100 | ${qaPassed ? '✅ PASSED' : '⚠️ NEEDS REVIEW'} |\n\n`;

  summary += `## Pipeline Steps (${successCount} success, ${warningCount} warnings, ${errorCount} errors)\n\n`;
  log.forEach((step) => {
    const icon = step.status === 'success' ? '✅' : step.status === 'warning' ? '⚠️' : step.status === 'skipped' ? '⏭️' : '❌';
    summary += `${icon} **${step.step}** — ${step.message} (${step.duration}ms)\n`;
  });

  summary += `\n## Pages Generated\n\n`;
  fullPageOutput.pages.forEach((page) => {
    summary += `### ${page.name} (${page.slug})\n`;
    summary += `- Sections: ${page.sectionsGenerated.join(', ')}\n`;
    summary += `- Components: ${page.componentsUsed.join(', ') || 'none'}\n\n`;
  });

  summary += `## Images Resolved\n\n`;
  summary += `Total: ${imageData.totalImages} images\n`;
  if (imageData.sources) {
    const srcEntries = Object.entries(imageData.sources as Record<string, number>)
      .filter(([, count]) => (count as number) > 0);
    if (srcEntries.length > 0) {
      summary += `Sources: ${srcEntries.map(([s, c]) => `${c} from ${s}`).join(', ')}\n`;
    }
  }

  summary += `\n---\n\n`;
  summary += `**Next:** Review the generated pages, copy the scaffold files to your project, and customize content as needed.\n`;
  summary += `Full build manifest is included below.\n`;

  // ── Write files to disk if outputDir is provided ─────────────────────────

  if (input.outputDir) {
    const outDir = input.outputDir;
    fs.mkdirSync(outDir, { recursive: true });

    // Write scaffold files (reset.css, variables.css, animations.css, etc.)
    for (const file of scaffold.files) {
      const filePath = path.join(outDir, file.path);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, file.content, 'utf-8');
    }

    // Write shared files from generate_full_page (components.css with navbar/footer/button CSS)
    // These overwrite scaffold's bare versions with the full component styles
    if (fullPageOutput.sharedFiles) {
      for (const file of fullPageOutput.sharedFiles) {
        const cssDir = framework === 'html' ? 'assets/css' : 'css';
        const filePath = path.join(outDir, cssDir, file.filename);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, file.content, 'utf-8');
      }
    }

    // Write page HTML files
    for (const page of fullPageOutput.pages) {
      const htmlPath = path.join(outDir, `${page.slug}.html`);
      fs.writeFileSync(htmlPath, page.html, 'utf-8');

      // Write page-specific CSS
      if (page.css) {
        const cssDir = framework === 'html' ? 'assets/css' : 'css';
        const cssPath = path.join(outDir, cssDir, `${page.slug}.css`);
        fs.mkdirSync(path.dirname(cssPath), { recursive: true });
        fs.writeFileSync(cssPath, page.css, 'utf-8');
      }

      // Write page-specific JS
      if (page.js) {
        const jsDir = framework === 'html' ? 'assets/js' : 'js';
        const jsPath = path.join(outDir, jsDir, `${page.slug}.js`);
        fs.mkdirSync(path.dirname(jsPath), { recursive: true });
        fs.writeFileSync(jsPath, page.js, 'utf-8');
      }
    }

    // Write shared CSS/JS if present
    if (fullPageOutput.sharedCss) {
      const sharedCssPath = path.join(outDir, framework === 'html' ? 'assets/css/shared.css' : 'css/shared.css');
      fs.mkdirSync(path.dirname(sharedCssPath), { recursive: true });
      fs.writeFileSync(sharedCssPath, fullPageOutput.sharedCss, 'utf-8');
    }
    if (fullPageOutput.sharedJs) {
      const sharedJsPath = path.join(outDir, framework === 'html' ? 'assets/js/shared.js' : 'js/shared.js');
      fs.mkdirSync(path.dirname(sharedJsPath), { recursive: true });
      fs.writeFileSync(sharedJsPath, fullPageOutput.sharedJs, 'utf-8');
    }

    // Write build manifest
    if (buildManifest) {
      fs.writeFileSync(path.join(outDir, 'BUILD-MANIFEST.md'), buildManifest, 'utf-8');
    }

    summary += `\n\n## Files Written to Disk\n\nOutput directory: \`${outDir}\`\n`;
    const writtenFiles = [
      ...scaffold.files.map(f => f.path),
      ...fullPageOutput.pages.map(p => `${p.slug}.html`),
      ...fullPageOutput.pages.filter(p => p.css).map(p => `${framework === 'html' ? 'assets/css' : 'css'}/${p.slug}.css`),
    ];
    for (const f of writtenFiles) {
      summary += `- ${f}\n`;
    }
  }

  return {
    projectName,
    framework,
    pages: fullPageOutput.pages,
    sharedCss: fullPageOutput.sharedCss,
    sharedJs: fullPageOutput.sharedJs,
    scaffoldFiles: scaffold.files,
    backgroundCss,
    seoScore,
    seoGrade,
    consistencyScore,
    qaScore,
    qaPassed,
    buildManifest,
    pipelineLog: log,
    totalDuration,
    summary,
    retryCount,
  };
}
