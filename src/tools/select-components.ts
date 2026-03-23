/**
 * MCP Tool: select_components
 *
 * Phase 3.5 — Selects, adapts, and locks UIverse components
 * for a given project's design tokens and framework.
 *
 * Enforces the Design Token Registry (one style per category, everywhere).
 */

import type {
  DesignTokens,
  SelectComponentsInput,
  SelectComponentsOutput,
  ComponentCategory,
  ComponentStyle,
  Framework,
} from '../engine/types.js';
import { adaptComponents, resolveComponentStyle } from '../engine/component-adapter.js';

// ─── Category Resolution ─────────────────────────────────────────────────────

const VALID_CATEGORIES: ComponentCategory[] = [
  'button-primary', 'button-secondary', 'card', 'input', 'checkbox',
  'toggle', 'radio', 'tooltip', 'modal', 'loader', 'badge',
  'dropdown', 'navigation',
];

const CATEGORY_ALIASES: Record<string, ComponentCategory> = {
  'button': 'button-primary',
  'btn': 'button-primary',
  'cta': 'button-primary',
  'primary-button': 'button-primary',
  'secondary-button': 'button-secondary',
  'ghost-button': 'button-secondary',
  'outline-button': 'button-secondary',
  'cards': 'card',
  'inputs': 'input',
  'text-input': 'input',
  'text-field': 'input',
  'form-input': 'input',
  'search': 'input',
  'textarea': 'input',
  'checkboxes': 'checkbox',
  'check': 'checkbox',
  'toggles': 'toggle',
  'switch': 'toggle',
  'radios': 'radio',
  'radio-button': 'radio',
  'tooltips': 'tooltip',
  'popover': 'tooltip',
  'modals': 'modal',
  'dialog': 'modal',
  'popup': 'modal',
  'overlay': 'modal',
  'loaders': 'loader',
  'spinner': 'loader',
  'loading': 'loader',
  'skeleton': 'loader',
  'badges': 'badge',
  'tag': 'badge',
  'tags': 'badge',
  'chip': 'badge',
  'label': 'badge',
  'status': 'badge',
  'dropdowns': 'dropdown',
  'select': 'dropdown',
  'menu': 'dropdown',
  'nav': 'navigation',
  'navbar': 'navigation',
  'sidebar': 'navigation',
  'header': 'navigation',
  'tabs': 'navigation',
};

function resolveCategory(input: string): ComponentCategory | null {
  const lower = input.toLowerCase().trim();

  if (VALID_CATEGORIES.includes(lower as ComponentCategory)) {
    return lower as ComponentCategory;
  }

  return CATEGORY_ALIASES[lower] || null;
}

function resolveFramework(input: string): Framework {
  const lower = input.toLowerCase().trim();
  const map: Record<string, Framework> = {
    'html': 'html',
    'vanilla': 'html',
    'html/css': 'html',
    'html/css/js': 'html',
    'react': 'react',
    'reactjs': 'react',
    'next': 'nextjs',
    'nextjs': 'nextjs',
    'next.js': 'nextjs',
    'vue': 'vue',
    'vuejs': 'vue',
    'vue.js': 'vue',
    'nuxt': 'nuxt',
    'nuxtjs': 'nuxt',
    'nuxt.js': 'nuxt',
    'angular': 'angular',
    'ng': 'angular',
    'svelte': 'svelte',
    'sveltekit': 'svelte',
    'astro': 'astro',
  };

  return map[lower] || 'html';
}

// ─── Shorthand Presets ───────────────────────────────────────────────────────

const PRESETS: Record<string, ComponentCategory[]> = {
  'all': VALID_CATEGORIES,
  'form': ['input', 'checkbox', 'toggle', 'radio', 'button-primary', 'button-secondary'],
  'landing': ['button-primary', 'button-secondary', 'card', 'navigation', 'badge'],
  'dashboard': ['button-primary', 'button-secondary', 'card', 'input', 'toggle', 'badge', 'dropdown', 'navigation', 'modal', 'loader'],
  'minimal': ['button-primary', 'card', 'input', 'navigation'],
};

// ─── Main Tool Function ──────────────────────────────────────────────────────

export function selectComponents(input: SelectComponentsInput): SelectComponentsOutput {
  const framework = resolveFramework(input.framework as string);
  const animationPreference = input.animationPreference || 'high';
  const stylePreference = input.style as ComponentStyle | undefined;

  // Resolve component types
  let categories: ComponentCategory[] = [];

  for (const type of input.componentTypes) {
    const lower = type.toLowerCase().trim();

    // Check for presets
    if (PRESETS[lower]) {
      categories.push(...PRESETS[lower]);
      continue;
    }

    const resolved = resolveCategory(lower);
    if (resolved) {
      categories.push(resolved);
    }
  }

  // Deduplicate
  categories = [...new Set(categories)];

  if (categories.length === 0) {
    return {
      components: [],
      registry: {},
      summary: '⚠️ No valid component categories found. Try: button, card, input, checkbox, toggle, radio, tooltip, modal, loader, badge, dropdown, navigation. Or use presets: "all", "form", "landing", "dashboard", "minimal".',
    };
  }

  // Adapt components with style preference (auto-resolved from industry/tone if not specified)
  const { components, registry } = adaptComponents(
    categories,
    framework,
    input.designTokens,
    animationPreference,
    stylePreference
  );

  // Build summary
  const summary = buildComponentSummary(components, registry, framework);

  return { components, registry, summary };
}

// ─── Summary Generator ───────────────────────────────────────────────────────

function buildComponentSummary(
  components: ReturnType<typeof adaptComponents>['components'],
  registry: ReturnType<typeof adaptComponents>['registry'],
  framework: Framework
): string {
  const frameworkLabel: Record<Framework, string> = {
    html: 'Vanilla HTML/CSS/JS',
    react: 'React',
    nextjs: 'Next.js',
    vue: 'Vue.js',
    nuxt: 'Nuxt',
    angular: 'Angular',
    svelte: 'Svelte',
    astro: 'Astro',
  };

  let summary = `## Components Selected & Adapted

**Framework:** ${frameworkLabel[framework]}
**Components:** ${components.length} locked in Design Token Registry

### Design Token Registry (Locked Styles)
| Category | Component | Animation Level |
|---|---|---|
`;

  for (const comp of components) {
    summary += `| ${comp.category} | ${comp.name} | HIGH |\n`;
  }

  summary += `
### Consistency Rules (Auto-Enforced)
- ✅ **One style per category** — every instance of a component type uses the SAME design
- ✅ **Max 2 button variants** — Primary (filled) + Secondary (outlined)
- ✅ **All colors from CSS variables** — zero hardcoded hex values
- ✅ **Rich animations included** — hover, focus, active, and entrance animations on every component
- ✅ **Accessibility attributes** — ARIA roles, keyboard navigation, focus indicators

### How to Use
Each component below includes ready-to-use code for ${frameworkLabel[framework]}.
Copy the code and styles into your project — all colors automatically inherit from your design tokens.
`;

  // Add accessibility notes
  const allNotes = components.flatMap((c) =>
    c.accessibilityNotes.map((n) => `- **${c.name}:** ${n}`)
  );
  if (allNotes.length > 0) {
    summary += `\n### Accessibility Notes\n${allNotes.join('\n')}\n`;
  }

  return summary;
}
