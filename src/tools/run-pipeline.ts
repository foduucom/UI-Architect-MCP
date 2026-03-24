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
import { adaptUIverseComponents, type UIverseComponentMap } from '../engine/uiverse-adapter.js';
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
  skipUIverse?: boolean;
  seoThreshold?: number;
  qaThreshold?: number;
  maxRetries?: number;
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
    });
  }, log);

  const tokens: DesignTokens = theme.tokens;

  // ── Step 4: Explore Components (optional — from UIverse GitHub) ──────────

  let uiverseComponents: any[] = [];
  let adaptedUIverse: UIverseComponentMap | null = null;

  if (!input.skipUIverse) {
    try {
      const explored = await timedStepAsync('4. explore_components', async () => {
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
      }
    } catch {
      // Non-blocking — UIverse fetch is optional
      log.push({
        step: '4. explore_components',
        status: 'warning',
        duration: 0,
        message: 'UIverse fetch skipped (rate limit or network issue). Using built-in components only.',
      });
    }
  } else {
    log.push({
      step: '4. explore_components',
      status: 'skipped',
      duration: 0,
      message: 'Skipped — skipUIverse=true',
    });
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

  // ── Step 9: Generate Full Pages (with retry loop) ────────────────────────

  let retryCount = 0;
  let fullPageOutput: GenerateFullPageOutput;
  let seoResult: SeoAuditOutput | null = null;
  let qaResult: ReviewOutput | null = null;
  let consistencyScore = 100;

  // Initial generation
  fullPageOutput = timedStep('9. generate_full_page', () => {
    return generateFullPage({
      pages: scope.pages,
      framework,
      designTokens: tokens,
      industry: scope.industry,
      includeNavigation: true,
      includeFooter: true,
      uiverseComponents: adaptedUIverse,
      imageData: imageData.images || null,
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

            if (fixed.fixCount > 0) {
              fullPageOutput.pages[pi] = {
                ...page,
                html: fixed.html,
                css: fixed.css,
              };
            }
          } catch {
            // SEO fix failed — continue with re-generation
          }
        }
      } else {
        // Re-generate pages
        fullPageOutput = timedStep(`9. generate_full_page (retry #${retryCount})`, () => {
          return generateFullPage({
            pages: scope.pages,
            framework,
            designTokens: tokens,
            industry: scope.industry,
            includeNavigation: true,
            includeFooter: true,
            uiverseComponents: adaptedUIverse,
            imageData: imageData.images || null,
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
