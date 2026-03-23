/**
 * Component Adapter Engine
 *
 * Takes raw HTML/CSS component definitions and adapts them
 * to the target framework (React, Vue, Angular, Svelte, vanilla HTML).
 * Also enforces the Design Token Registry — same style everywhere.
 */

import type {
  ComponentDefinition,
  AdaptedComponent,
  Framework,
  DesignTokens,
  DesignTokenRegistry,
  ComponentCategory,
  ComponentStyle,
  Industry,
  Tone,
} from './types.js';
import { COMPONENT_LIBRARY } from './component-library.js';

// ─── Industry → Style Mapping ────────────────────────────────────────────────

const INDUSTRY_STYLE_MAP: Partial<Record<Industry, ComponentStyle>> = {
  corporate: 'flat',
  finance: 'flat',
  legal: 'flat',
  healthcare: 'flat',
  education: 'flat',
  nonprofit: 'flat',
  realestate: 'neumorphic',
  luxury: 'glassmorphic',
  technology: 'animated',
  startup: 'gradient',
  creative: 'gradient',
  gaming: 'gradient',
  ecommerce: 'animated',
  food: 'neumorphic',
  environmental: 'flat',
};

const TONE_STYLE_MAP: Partial<Record<Tone, ComponentStyle>> = {
  corporate: 'flat',
  minimal: 'flat',
  technical: 'flat',
  modern: 'animated',
  playful: 'gradient',
  bold: 'gradient',
  luxury: 'glassmorphic',
  elegant: 'neumorphic',
  warm: 'neumorphic',
};

/**
 * Auto-resolve the best component style based on industry + tone.
 */
export function resolveComponentStyle(
  industry?: Industry,
  tone?: Tone,
  override?: ComponentStyle
): ComponentStyle {
  if (override) return override;
  if (tone && TONE_STYLE_MAP[tone]) return TONE_STYLE_MAP[tone]!;
  if (industry && INDUSTRY_STYLE_MAP[industry]) return INDUSTRY_STYLE_MAP[industry]!;
  return 'animated'; // default: richest animation
}

// ─── Component Selection ─────────────────────────────────────────────────────

/**
 * Select the best component from the library for a given category + style.
 * If no exact style match, falls back to 'animated', then any available.
 */
export function selectComponent(
  category: ComponentCategory,
  stylePreference: ComponentStyle = 'animated',
  animationPreference: 'low' | 'medium' | 'high' = 'high'
): ComponentDefinition | null {
  const allForCategory = COMPONENT_LIBRARY.filter((c) => c.category === category);
  if (allForCategory.length === 0) return null;

  // Try exact style match first
  const exactMatch = allForCategory.filter((c) => c.style === stylePreference);
  if (exactMatch.length > 0) {
    // Sort by animation level
    const levels = { high: 3, medium: 2, low: 1 };
    exactMatch.sort((a, b) => levels[b.animationLevel] - levels[a.animationLevel]);
    if (animationPreference === 'low') exactMatch.reverse();
    return exactMatch[0];
  }

  // Fallback to 'animated' style
  const animatedMatch = allForCategory.filter((c) => c.style === 'animated');
  if (animatedMatch.length > 0) return animatedMatch[0];

  // Fallback to any available, prefer high animation
  const levels = { high: 3, medium: 2, low: 1 };
  allForCategory.sort((a, b) => levels[b.animationLevel] - levels[a.animationLevel]);
  return allForCategory[0];
}

/**
 * Build the Design Token Registry — locks one component per category.
 * All components in the registry will share the SAME style.
 */
export function buildTokenRegistry(
  categories: ComponentCategory[],
  stylePreference: ComponentStyle = 'animated',
  animationPreference: 'low' | 'medium' | 'high' = 'high'
): DesignTokenRegistry {
  const registry: DesignTokenRegistry = {};

  for (const category of categories) {
    const component = selectComponent(category, stylePreference, animationPreference);
    if (component) {
      registry[category] = {
        componentId: component.id,
        lockedStyle: component.name,
      };
    }
  }

  return registry;
}

// ─── Framework Adapters ──────────────────────────────────────────────────────

function adaptToReact(comp: ComponentDefinition): { code: string; styles: string } {
  let jsx = comp.html;

  // Convert HTML attributes to JSX
  jsx = jsx.replace(/\bclass="/g, 'className="');
  jsx = jsx.replace(/\bfor="/g, 'htmlFor="');
  jsx = jsx.replace(/\btabindex="/g, 'tabIndex="');
  jsx = jsx.replace(/\bautocomplete="/g, 'autoComplete="');
  jsx = jsx.replace(/\breadonly/g, 'readOnly');
  jsx = jsx.replace(/\bonclick="/g, 'onClick="');
  jsx = jsx.replace(/\bonchange="/g, 'onChange="');

  // Wrap in a functional component
  const componentName = comp.name.replace(/[^a-zA-Z0-9]/g, '');
  const code = `import React from 'react';
import './${componentName}.css';

export default function ${componentName}({ children, ...props }) {
  return (
    ${jsx}
  );
}`;

  return { code, styles: comp.css };
}

function adaptToVue(comp: ComponentDefinition): { code: string; styles: string } {
  const componentName = comp.name.replace(/[^a-zA-Z0-9]/g, '');

  const code = `<script setup>
defineProps({
  // Add props as needed
});
</script>

<template>
  ${comp.html}
</template>

<style scoped>
${comp.css}
</style>`;

  return { code, styles: '' }; // Styles are inside SFC
}

function adaptToAngular(comp: ComponentDefinition): { code: string; styles: string } {
  const componentName = comp.name
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');

  const selectorName = `app-${componentName}`;
  const className = comp.name.replace(/[^a-zA-Z0-9]/g, '') + 'Component';

  const code = `import { Component } from '@angular/core';

@Component({
  selector: '${selectorName}',
  template: \`
    ${comp.html}
  \`,
  styleUrls: ['./${componentName}.component.css']
})
export class ${className} {}`;

  return { code, styles: comp.css };
}

function adaptToSvelte(comp: ComponentDefinition): { code: string; styles: string } {
  const code = `<script>
  // Props
  export let variant = 'default';
</script>

${comp.html}

<style>
${comp.css}
</style>`;

  return { code, styles: '' }; // Styles inside SFC
}

function adaptToHtml(comp: ComponentDefinition): { code: string; styles: string } {
  return { code: comp.html, styles: comp.css };
}

// ─── Main Adaptation Function ────────────────────────────────────────────────

export function adaptComponent(
  component: ComponentDefinition,
  framework: Framework,
  _tokens: DesignTokens
): AdaptedComponent {
  let adapted: { code: string; styles: string };

  switch (framework) {
    case 'react':
    case 'nextjs':
      adapted = adaptToReact(component);
      break;
    case 'vue':
    case 'nuxt':
      adapted = adaptToVue(component);
      break;
    case 'angular':
      adapted = adaptToAngular(component);
      break;
    case 'svelte':
      adapted = adaptToSvelte(component);
      break;
    default:
      adapted = adaptToHtml(component);
      break;
  }

  // Generate accessibility notes
  const accessibilityNotes = generateA11yNotes(component);

  return {
    id: component.id,
    category: component.category,
    name: component.name,
    framework,
    code: adapted.code,
    styles: adapted.styles,
    js: component.js,
    accessibilityNotes,
  };
}

/**
 * Adapt multiple components at once, enforcing the Design Token Registry.
 */
export function adaptComponents(
  categories: ComponentCategory[],
  framework: Framework,
  tokens: DesignTokens,
  animationPreference: 'low' | 'medium' | 'high' = 'high',
  stylePreference?: ComponentStyle
): { components: AdaptedComponent[]; registry: DesignTokenRegistry } {
  // Resolve style from industry/tone if not explicitly provided
  const resolvedStyle = stylePreference
    ?? resolveComponentStyle(tokens.industry, tokens.tone);

  const registry = buildTokenRegistry(categories, resolvedStyle, animationPreference);
  const components: AdaptedComponent[] = [];

  for (const category of categories) {
    const entry = registry[category];
    if (!entry) continue;

    const def = COMPONENT_LIBRARY.find((c) => c.id === entry.componentId);
    if (!def) continue;

    const adapted = adaptComponent(def, framework, tokens);
    components.push(adapted);
  }

  return { components, registry };
}

// ─── Accessibility Analysis ──────────────────────────────────────────────────

function generateA11yNotes(comp: ComponentDefinition): string[] {
  const notes: string[] = [];
  const html = comp.html.toLowerCase();

  // Check for aria attributes
  if (!html.includes('aria-') && !html.includes('role=')) {
    notes.push(`Add appropriate aria-label or role attribute to the ${comp.category} component.`);
  }

  // Check for keyboard support
  if (comp.category.includes('button') && !html.includes('tabindex')) {
    notes.push('Ensure button is focusable via keyboard (native <button> elements are by default).');
  }

  // Check for form labels
  if (['input', 'checkbox', 'toggle', 'radio'].includes(comp.category)) {
    if (!html.includes('<label') && !html.includes('aria-label')) {
      notes.push('Associate a <label> element with this form control, or add aria-label for screen readers.');
    }
  }

  // Check for focus styles
  if (!comp.css.includes(':focus')) {
    notes.push('Add visible :focus styles for keyboard navigation accessibility.');
  }

  // Modal-specific
  if (comp.category === 'modal') {
    notes.push('Implement focus trapping within the modal when open.');
    notes.push('Add aria-modal="true" and role="dialog" to the modal container.');
    notes.push('Return focus to the trigger element when modal closes.');
  }

  if (notes.length === 0) {
    notes.push('Component includes accessibility attributes. Verify with screen reader testing.');
  }

  return notes;
}
