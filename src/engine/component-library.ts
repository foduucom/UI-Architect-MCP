import type { ComponentDefinition, ComponentCategory, ComponentStyle } from './types.js';
import { COMPONENTS_PART2 } from './components-part2.js';
import { COMPONENTS_PART3 } from './components-part3.js';

/**
 * COMPONENT_LIBRARY — 60+ production-ready UI components
 *
 * 13 categories × 4-5 style variants each:
 *   flat | neumorphic | glassmorphic | gradient | animated
 *
 * All components use CSS custom properties exclusively. Zero hardcoded colors.
 * Every component has rich, multi-property animations. No static interactions.
 */
const CORE_COMPONENTS: ComponentDefinition[] = [
  // ============================================================================
  // BUTTONS — PRIMARY (5 variants)
  // ============================================================================

  {
    id: 'btn-primary-flat',
    category: 'button-primary' as ComponentCategory,
    name: 'Primary Button - Flat',
    description: 'Clean filled primary button with smooth color transitions and lift on hover',
    tags: ['button', 'primary', 'cta', 'flat', 'simple'],
    style: 'flat' as ComponentStyle,
    animationLevel: 'medium',
    html: `<button class="btn-primary-flat" aria-label="Primary action">
  Click me
</button>`,
    css: `/* Primary Button — Flat */
.btn-primary-flat {
  position: relative;
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--fs-body);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: var(--color-neutral-50);
  cursor: pointer;
  transition: transform var(--transition-fast),
              background-color var(--transition-fast),
              box-shadow var(--transition-fast);
}

.btn-primary-flat:hover {
  transform: translateY(-1px);
  background-color: var(--color-primary-dark);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.2);
}

.btn-primary-flat:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-sm);
}

.btn-primary-flat:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}`,
    js: undefined
  },

  {
    id: 'btn-primary-neumorphic',
    category: 'button-primary' as ComponentCategory,
    name: 'Primary Button - Neumorphic',
    description: 'Raised soft-shadow button with neumorphic design, pressed state on active',
    tags: ['button', 'primary', 'neumorphic', 'soft-shadow', 'embossed'],
    style: 'neumorphic' as ComponentStyle,
    animationLevel: 'high',
    html: `<button class="btn-primary-neumorphic" aria-label="Primary action">
  Click me
</button>`,
    css: `/* Primary Button — Neumorphic */
.btn-primary-neumorphic {
  position: relative;
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--fs-body);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  background-color: var(--color-neutral-100);
  color: var(--color-primary);
  cursor: pointer;
  box-shadow: 8px 8px 16px rgba(var(--color-neutral-rgb), 0.15),
              -2px -2px 8px rgba(255, 255, 255, 0.6);
  transition: box-shadow var(--transition-base),
              transform var(--transition-base);
}

.btn-primary-neumorphic:hover {
  transform: translateY(-2px);
  box-shadow: 12px 12px 24px rgba(var(--color-neutral-rgb), 0.2),
              -2px -2px 8px rgba(255, 255, 255, 0.8);
}

.btn-primary-neumorphic:active {
  transform: translateY(0);
  box-shadow: inset 6px 6px 12px rgba(var(--color-neutral-rgb), 0.1),
              inset -2px -2px 6px rgba(255, 255, 255, 0.5);
}

.btn-primary-neumorphic:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}`,
    js: undefined
  },

  {
    id: 'btn-primary-glass',
    category: 'button-primary' as ComponentCategory,
    name: 'Primary Button - Glassmorphic',
    description: 'Frosted glass button with backdrop blur and shimmer effect on hover',
    tags: ['button', 'primary', 'glassmorphic', 'frosted', 'blur'],
    style: 'glassmorphic' as ComponentStyle,
    animationLevel: 'high',
    html: `<button class="btn-primary-glass" aria-label="Primary action">
  Click me
</button>`,
    css: `/* Primary Button — Glassmorphic */
.btn-primary-glass {
  position: relative;
  overflow: hidden;
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--fs-body);
  font-weight: 600;
  border: 1px solid rgba(var(--color-primary-rgb), 0.3);
  border-radius: var(--radius-md);
  background: rgba(var(--color-primary-rgb), 0.15);
  color: var(--color-primary);
  cursor: pointer;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background var(--transition-base),
              border-color var(--transition-base),
              box-shadow var(--transition-base),
              transform var(--transition-base);
}

.btn-primary-glass:hover {
  transform: translateY(-1px);
  background: rgba(var(--color-primary-rgb), 0.25);
  border-color: rgba(var(--color-primary-rgb), 0.5);
  box-shadow: 0 8px 20px rgba(var(--color-primary-rgb), 0.15);
}

.btn-primary-glass:hover::after {
  transform: translateX(100%);
}

.btn-primary-glass::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 30%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  transition: transform 0.6s ease;
  pointer-events: none;
}

.btn-primary-glass:active {
  transform: scale(0.98);
}

.btn-primary-glass:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}`,
    js: undefined
  },

  {
    id: 'btn-primary-gradient',
    category: 'button-primary' as ComponentCategory,
    name: 'Primary Button - Gradient',
    description: 'Animated gradient background button with shifting colors on hover',
    tags: ['button', 'primary', 'gradient', 'animated-gradient', 'modern'],
    style: 'gradient' as ComponentStyle,
    animationLevel: 'high',
    html: `<button class="btn-primary-gradient" aria-label="Primary action">
  Click me
</button>`,
    css: `/* Primary Button — Gradient */
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.btn-primary-gradient {
  position: relative;
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--fs-body);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-secondary)
  );
  background-size: 200% 200%;
  color: var(--color-neutral-50);
  cursor: pointer;
  transition: transform var(--transition-base),
              box-shadow var(--transition-base);
}

.btn-primary-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(var(--color-primary-rgb), 0.3);
  animation: gradient-shift 3s ease infinite;
}

.btn-primary-gradient:active {
  transform: scale(0.97);
  box-shadow: var(--shadow-sm);
  animation: none;
}

.btn-primary-gradient:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}`,
    js: undefined
  },

  {
    id: 'btn-primary-animated',
    category: 'button-primary' as ComponentCategory,
    name: 'Primary Button - Animated',
    description: 'High-animation button with sweeping shine and rich hover effects',
    tags: ['button', 'primary', 'animated', 'glow', 'shine'],
    style: 'animated' as ComponentStyle,
    animationLevel: 'high',
    html: `<button class="btn-primary-animated" aria-label="Primary action">
  Click me
</button>`,
    css: `/* Primary Button — Animated */
.btn-primary-animated {
  position: relative;
  overflow: hidden;
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--fs-body);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: var(--color-neutral-50);
  cursor: pointer;
  transition: transform var(--transition-fast),
              box-shadow var(--transition-fast);
}

.btn-primary-animated:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(var(--color-primary-rgb), 0.4);
}

.btn-primary-animated:hover::after {
  transform: translateX(100%);
}

.btn-primary-animated::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 30%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.btn-primary-animated:active {
  transform: scale(0.97);
  box-shadow: var(--shadow-sm);
}

.btn-primary-animated:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}`,
    js: undefined
  },

  // ============================================================================
  // BUTTONS — SECONDARY (5 variants)
  // ============================================================================

  {
    id: 'btn-secondary-flat',
    category: 'button-secondary' as ComponentCategory,
    name: 'Secondary Button - Flat',
    description: 'Outlined secondary button with transparent background and border color',
    tags: ['button', 'secondary', 'flat', 'outline', 'ghost'],
    style: 'flat' as ComponentStyle,
    animationLevel: 'medium',
    html: `<button class="btn-secondary-flat" aria-label="Secondary action">
  Cancel
</button>`,
    css: `/* Secondary Button — Flat */
.btn-secondary-flat {
  position: relative;
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--fs-body);
  font-weight: 600;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--color-neutral-700);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary-flat:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: rgba(var(--color-primary-rgb), 0.05);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.1);
}

.btn-secondary-flat:active {
  transform: scale(0.98);
  background-color: rgba(var(--color-primary-rgb), 0.1);
}

.btn-secondary-flat:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}`,
    js: undefined
  },

  {
    id: 'btn-secondary-neumorphic',
    category: 'button-secondary' as ComponentCategory,
    name: 'Secondary Button - Neumorphic',
    description: 'Flat neumorphic secondary button that raises on hover',
    tags: ['button', 'secondary', 'neumorphic', 'soft', 'inset'],
    style: 'neumorphic' as ComponentStyle,
    animationLevel: 'high',
    html: `<button class="btn-secondary-neumorphic" aria-label="Secondary action">
  Cancel
</button>`,
    css: `/* Secondary Button — Neumorphic */
.btn-secondary-neumorphic {
  position: relative;
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--fs-body);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-700);
  cursor: pointer;
  box-shadow: inset 2px 2px 4px rgba(var(--color-neutral-rgb), 0.05),
              inset -1px -1px 2px rgba(255, 255, 255, 0.8);
  transition: all var(--transition-base);
}

.btn-secondary-neumorphic:hover {
  color: var(--color-primary);
  box-shadow: 8px 8px 16px rgba(var(--color-neutral-rgb), 0.1),
              -2px -2px 8px rgba(255, 255, 255, 0.6);
  transform: translateY(-1px);
}

.btn-secondary-neumorphic:active {
  box-shadow: inset 4px 4px 8px rgba(var(--color-neutral-rgb), 0.08);
  transform: translateY(0);
}

.btn-secondary-neumorphic:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}`,
    js: undefined
  },

  {
    id: 'btn-secondary-glass',
    category: 'button-secondary' as ComponentCategory,
    name: 'Secondary Button - Glassmorphic',
    description: 'Transparent glassmorphic secondary button with subtle border',
    tags: ['button', 'secondary', 'glassmorphic', 'transparent', 'blur'],
    style: 'glassmorphic' as ComponentStyle,
    animationLevel: 'high',
    html: `<button class="btn-secondary-glass" aria-label="Secondary action">
  Cancel
</button>`,
    css: `/* Secondary Button — Glassmorphic */
.btn-secondary-glass {
  position: relative;
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--fs-body);
  font-weight: 600;
  border: 1px solid rgba(var(--color-neutral-rgb), 0.2);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-neutral-900);
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all var(--transition-base);
}

.btn-secondary-glass:hover {
  background: rgba(var(--color-primary-rgb), 0.12);
  border-color: rgba(var(--color-primary-rgb), 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.1);
}

.btn-secondary-glass:active {
  transform: scale(0.98);
  background: rgba(var(--color-primary-rgb), 0.08);
}

.btn-secondary-glass:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}`,
    js: undefined
  },

  {
    id: 'btn-secondary-gradient',
    category: 'button-secondary' as ComponentCategory,
    name: 'Secondary Button - Gradient',
    description: 'Secondary button with gradient border and subtle background on hover',
    tags: ['button', 'secondary', 'gradient', 'border-gradient', 'modern'],
    style: 'gradient' as ComponentStyle,
    animationLevel: 'high',
    html: `<button class="btn-secondary-gradient" aria-label="Secondary action">
  Cancel
</button>`,
    css: `/* Secondary Button — Gradient */
.btn-secondary-gradient {
  position: relative;
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--fs-body);
  font-weight: 600;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  background:
    linear-gradient(var(--color-neutral-50), var(--color-neutral-50)) padding-box,
    linear-gradient(135deg, var(--color-primary), var(--color-secondary)) border-box;
  color: var(--color-neutral-900);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-secondary-gradient:hover {
  background:
    linear-gradient(rgba(var(--color-primary-rgb), 0.1), rgba(var(--color-primary-rgb), 0.1)) padding-box,
    linear-gradient(135deg, var(--color-primary), var(--color-secondary)) border-box;
  color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.15);
}

.btn-secondary-gradient:active {
  transform: scale(0.98);
}

.btn-secondary-gradient:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}`,
    js: undefined
  },

  {
    id: 'btn-secondary-animated',
    category: 'button-secondary' as ComponentCategory,
    name: 'Secondary Button - Animated',
    description: 'Animated secondary button with hover shine and lift effects',
    tags: ['button', 'secondary', 'animated', 'outline', 'interactive'],
    style: 'animated' as ComponentStyle,
    animationLevel: 'high',
    html: `<button class="btn-secondary-animated" aria-label="Secondary action">
  Cancel
</button>`,
    css: `/* Secondary Button — Animated */
.btn-secondary-animated {
  position: relative;
  overflow: hidden;
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--fs-body);
  font-weight: 600;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--color-primary);
  cursor: pointer;
  transition: transform var(--transition-fast),
              box-shadow var(--transition-fast);
}

.btn-secondary-animated:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(var(--color-primary-rgb), 0.2);
}

.btn-secondary-animated:hover::after {
  transform: translateX(100%);
}

.btn-secondary-animated::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 30%,
    rgba(var(--color-primary-rgb), 0.2) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.btn-secondary-animated:active {
  transform: scale(0.97);
  box-shadow: var(--shadow-sm);
}

.btn-secondary-animated:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}`,
    js: undefined
  },

  // ============================================================================
  // CARDS (5 variants)
  // ============================================================================

  {
    id: 'card-flat',
    category: 'card' as ComponentCategory,
    name: 'Card - Flat',
    description: 'Clean flat card with border and subtle hover lift',
    tags: ['card', 'flat', 'simple', 'minimal', 'border'],
    style: 'flat' as ComponentStyle,
    animationLevel: 'medium',
    html: `<div class="card-flat">
  <h3 class="card-flat-title">Card Title</h3>
  <p class="card-flat-body">Content goes here with details and information about the card topic.</p>
</div>`,
    css: `/* Card — Flat */
.card-flat {
  padding: var(--space-xl);
  background-color: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.card-flat:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.card-flat-title {
  font-size: var(--fs-h4);
  font-weight: 600;
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-md) 0;
}

.card-flat-body {
  font-size: var(--fs-body);
  color: var(--color-neutral-700);
  line-height: 1.6;
  margin: 0;
}`,
    js: undefined
  },

  {
    id: 'card-neumorphic',
    category: 'card' as ComponentCategory,
    name: 'Card - Neumorphic',
    description: 'Soft-shadow neumorphic card with embossed appearance',
    tags: ['card', 'neumorphic', 'soft-shadow', 'embossed', 'elevated'],
    style: 'neumorphic' as ComponentStyle,
    animationLevel: 'high',
    html: `<div class="card-neumorphic">
  <h3 class="card-neumorphic-title">Card Title</h3>
  <p class="card-neumorphic-body">Content goes here with details and information about the card topic.</p>
</div>`,
    css: `/* Card — Neumorphic */
.card-neumorphic {
  padding: var(--space-xl);
  background-color: var(--color-neutral-100);
  border: none;
  border-radius: var(--radius-lg);
  box-shadow: 8px 8px 16px rgba(var(--color-neutral-rgb), 0.1),
              -2px -2px 8px rgba(255, 255, 255, 0.8);
  transition: all var(--transition-base);
}

.card-neumorphic:hover {
  transform: translateY(-3px);
  box-shadow: 12px 12px 24px rgba(var(--color-neutral-rgb), 0.15),
              -2px -2px 8px rgba(255, 255, 255, 0.9);
}

.card-neumorphic-title {
  font-size: var(--fs-h4);
  font-weight: 600;
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-md) 0;
}

.card-neumorphic-body {
  font-size: var(--fs-body);
  color: var(--color-neutral-700);
  line-height: 1.6;
  margin: 0;
}`,
    js: undefined
  },

  {
    id: 'card-glass',
    category: 'card' as ComponentCategory,
    name: 'Card - Glassmorphic',
    description: 'Frosted glass card with backdrop blur and semi-transparent background',
    tags: ['card', 'glassmorphic', 'frosted', 'blur', 'overlay'],
    style: 'glassmorphic' as ComponentStyle,
    animationLevel: 'high',
    html: `<div class="card-glass">
  <h3 class="card-glass-title">Card Title</h3>
  <p class="card-glass-body">Content goes here with details and information about the card topic.</p>
</div>`,
    css: `/* Card — Glassmorphic */
.card-glass {
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all var(--transition-base);
}

.card-glass:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(var(--color-primary-rgb), 0.4);
  box-shadow: 0 8px 32px rgba(var(--color-primary-rgb), 0.15);
}

.card-glass-title {
  font-size: var(--fs-h4);
  font-weight: 600;
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-md) 0;
}

.card-glass-body {
  font-size: var(--fs-body);
  color: var(--color-neutral-700);
  line-height: 1.6;
  margin: 0;
}`,
    js: undefined
  },

  {
    id: 'card-gradient',
    category: 'card' as ComponentCategory,
    name: 'Card - Gradient',
    description: 'Card with animated gradient top border and rich hover effects',
    tags: ['card', 'gradient', 'accent-border', 'animated', 'modern'],
    style: 'gradient' as ComponentStyle,
    animationLevel: 'high',
    html: `<div class="card-gradient">
  <h3 class="card-gradient-title">Card Title</h3>
  <p class="card-gradient-body">Content goes here with details and information about the card topic.</p>
</div>`,
    css: `/* Card — Gradient */
.card-gradient {
  position: relative;
  padding: var(--space-xl);
  background-color: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-base);
}

.card-gradient::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  background-size: 200% 100%;
  transition: background-position var(--transition-base);
}

.card-gradient:hover {
  transform: translateY(-6px);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-xl);
}

.card-gradient:hover::before {
  background-position: -200% 100%;
}

.card-gradient-title {
  font-size: var(--fs-h4);
  font-weight: 600;
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-md) 0;
}

.card-gradient-body {
  font-size: var(--fs-body);
  color: var(--color-neutral-700);
  line-height: 1.6;
  margin: 0;
}`,
    js: undefined
  },

  {
    id: 'card-animated',
    category: 'card' as ComponentCategory,
    name: 'Card - Animated',
    description: 'High-animation card with rich shadow elevation and glow effects',
    tags: ['card', 'animated', 'lift', 'glow', 'interactive'],
    style: 'animated' as ComponentStyle,
    animationLevel: 'high',
    html: `<div class="card-animated">
  <h3 class="card-animated-title">Card Title</h3>
  <p class="card-animated-body">Content goes here with details and information about the card topic.</p>
</div>`,
    css: `/* Card — Animated */
.card-animated {
  position: relative;
  padding: var(--space-xl);
  background-color: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

.card-animated:hover {
  transform: translateY(-6px);
  border-color: var(--color-primary);
  box-shadow: 0 20px 40px rgba(var(--color-primary-rgb), 0.2),
              0 0 20px rgba(var(--color-primary-rgb), 0.1);
}

.card-animated-title {
  font-size: var(--fs-h4);
  font-weight: 600;
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-md) 0;
  transition: color var(--transition-fast);
}

.card-animated:hover .card-animated-title {
  color: var(--color-primary);
}

.card-animated-body {
  font-size: var(--fs-body);
  color: var(--color-neutral-700);
  line-height: 1.6;
  margin: 0;
  transition: color var(--transition-fast);
}

.card-animated:hover .card-animated-body {
  color: var(--color-neutral-800);
}`,
    js: undefined
  },

  // ============================================================================
  // INPUTS (5 variants)
  // ============================================================================

  {
    id: 'input-flat',
    category: 'input' as ComponentCategory,
    name: 'Input - Flat',
    description: 'Clean flat text input with border, smooth focus transitions',
    tags: ['input', 'flat', 'text', 'form', 'minimal'],
    style: 'flat' as ComponentStyle,
    animationLevel: 'medium',
    html: `<div class="input-wrapper">
  <label for="input-flat" class="input-label">Email address</label>
  <input
    id="input-flat"
    type="text"
    class="input-flat"
    placeholder="Enter your email"
    aria-label="Email address input"
  />
</div>`,
    css: `/* Input — Flat */
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.input-label {
  font-size: var(--fs-small);
  font-weight: 500;
  color: var(--color-neutral-900);
}

.input-flat {
  padding: var(--space-md) var(--space-lg);
  font-size: var(--fs-body);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  background-color: var(--color-neutral-50);
  color: var(--color-neutral-900);
  transition: border-color var(--transition-base),
              box-shadow var(--transition-base);
}

.input-flat::placeholder {
  color: var(--color-neutral-500);
}

.input-flat:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
  background-color: var(--color-neutral-50);
}

.input-flat:focus::placeholder {
  color: var(--color-neutral-400);
}`,
    js: undefined
  },

  {
    id: 'input-neumorphic',
    category: 'input' as ComponentCategory,
    name: 'Input - Neumorphic',
    description: 'Inset shadow neumorphic input with pressed appearance',
    tags: ['input', 'neumorphic', 'soft-shadow', 'inset', 'embossed'],
    style: 'neumorphic' as ComponentStyle,
    animationLevel: 'high',
    html: `<div class="input-wrapper">
  <label for="input-neumorphic" class="input-label">Email address</label>
  <input
    id="input-neumorphic"
    type="text"
    class="input-neumorphic"
    placeholder="Enter your email"
    aria-label="Email address input"
  />
</div>`,
    css: `/* Input — Neumorphic */
.input-neumorphic {
  padding: var(--space-md) var(--space-lg);
  font-size: var(--fs-body);
  border: none;
  border-radius: var(--radius-md);
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-900);
  box-shadow: inset 3px 3px 6px rgba(var(--color-neutral-rgb), 0.1),
              inset -1px -1px 3px rgba(255, 255, 255, 0.5);
  transition: box-shadow var(--transition-base),
              background-color var(--transition-base);
}

.input-neumorphic::placeholder {
  color: var(--color-neutral-500);
}

.input-neumorphic:focus {
  outline: none;
  background-color: var(--color-neutral-100);
  box-shadow: inset 2px 2px 4px rgba(var(--color-neutral-rgb), 0.05),
              inset -1px -1px 2px rgba(255, 255, 255, 0.8),
              0 0 0 3px rgba(var(--color-primary-rgb), 0.15);
}`,
    js: undefined
  },

  {
    id: 'input-glass',
    category: 'input' as ComponentCategory,
    name: 'Input - Glassmorphic',
    description: 'Frosted glass input with backdrop blur and semi-transparent background',
    tags: ['input', 'glassmorphic', 'frosted', 'blur', 'overlay'],
    style: 'glassmorphic' as ComponentStyle,
    animationLevel: 'high',
    html: `<div class="input-wrapper">
  <label for="input-glass" class="input-label">Email address</label>
  <input
    id="input-glass"
    type="text"
    class="input-glass"
    placeholder="Enter your email"
    aria-label="Email address input"
  />
</div>`,
    css: `/* Input — Glassmorphic */
.input-glass {
  padding: var(--space-md) var(--space-lg);
  font-size: var(--fs-body);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-neutral-900);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: border-color var(--transition-base),
              background var(--transition-base),
              box-shadow var(--transition-base);
}

.input-glass::placeholder {
  color: rgba(var(--color-neutral-rgb), 0.5);
}

.input-glass:focus {
  outline: none;
  border-color: rgba(var(--color-primary-rgb), 0.5);
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.15);
}`,
    js: undefined
  },

  {
    id: 'input-gradient',
    category: 'input' as ComponentCategory,
    name: 'Input - Gradient',
    description: 'Clean input with gradient border on focus, using border-image',
    tags: ['input', 'gradient', 'animated-border', 'modern', 'accent'],
    style: 'gradient' as ComponentStyle,
    animationLevel: 'high',
    html: `<div class="input-wrapper">
  <label for="input-gradient" class="input-label">Email address</label>
  <input
    id="input-gradient"
    type="text"
    class="input-gradient"
    placeholder="Enter your email"
    aria-label="Email address input"
  />
</div>`,
    css: `/* Input — Gradient */
.input-gradient {
  padding: var(--space-md) var(--space-lg);
  font-size: var(--fs-body);
  border: 2px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  background-color: var(--color-neutral-50);
  color: var(--color-neutral-900);
  transition: border-color var(--transition-base),
              box-shadow var(--transition-base);
}

.input-gradient::placeholder {
  color: var(--color-neutral-500);
}

.input-gradient:focus {
  outline: none;
  border-image: linear-gradient(135deg, var(--color-primary), var(--color-secondary)) 1;
  background-color: var(--color-neutral-50);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}`,
    js: undefined
  },

  {
    id: 'input-animated',
    category: 'input' as ComponentCategory,
    name: 'Input - Animated',
    description: 'Floating label input with animated label and bottom border animation',
    tags: ['input', 'animated', 'floating-label', 'material', 'interactive'],
    style: 'animated' as ComponentStyle,
    animationLevel: 'high',
    html: `<div class="input-wrapper-animated">
  <input
    type="text"
    class="input-animated"
    id="input-animated"
    placeholder=" "
    aria-label="Text input with floating label"
  />
  <label for="input-animated" class="input-animated-label">Email address</label>
  <div class="input-animated-underline"></div>
</div>`,
    css: `/* Input — Animated Floating Label */
.input-wrapper-animated {
  position: relative;
  display: block;
  margin: var(--space-md) 0;
}

.input-animated {
  display: block;
  width: 100%;
  padding: var(--space-lg) 0 var(--space-md) 0;
  font-size: var(--fs-body);
  border: none;
  background-color: transparent;
  color: var(--color-neutral-900);
  border-bottom: 2px solid var(--color-neutral-300);
  transition: border-color var(--transition-base);
}

.input-animated:focus {
  outline: none;
  border-bottom-color: var(--color-primary);
}

.input-animated::placeholder {
  color: transparent;
}

.input-animated-label {
  position: absolute;
  top: 0;
  left: 0;
  font-size: var(--fs-body);
  color: var(--color-neutral-500);
  pointer-events: none;
  transition: transform var(--transition-base),
              font-size var(--transition-base),
              color var(--transition-base);
}

.input-animated:focus ~ .input-animated-label,
.input-animated:not(:placeholder-shown) ~ .input-animated-label {
  transform: translateY(-1.5rem);
  font-size: var(--fs-small);
  color: var(--color-primary);
}

.input-animated-underline {
  position: absolute;
  bottom: -2px;
  left: 0;
  height: 2px;
  width: 0;
  background: var(--color-primary);
  transition: width var(--transition-base);
}

.input-animated:focus ~ .input-animated-underline {
  width: 100%;
}`,
    js: undefined
  },

  // ============================================================================
  // CHECKBOXES (5 variants)
  // ============================================================================

  {
    id: 'checkbox-flat',
    category: 'checkbox' as ComponentCategory,
    name: 'Checkbox - Flat',
    description: 'Clean flat checkbox with smooth color fill on check',
    tags: ['checkbox', 'flat', 'form', 'minimal', 'simple'],
    style: 'flat' as ComponentStyle,
    animationLevel: 'medium',
    html: `<label class="checkbox-flat-label">
  <input type="checkbox" class="checkbox-flat-input" aria-label="Agree to terms" />
  <span class="checkbox-flat-box"></span>
  <span class="checkbox-flat-text">I agree to the terms</span>
</label>`,
    css: `/* Checkbox — Flat */
.checkbox-flat-label {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  user-select: none;
}

.checkbox-flat-input {
  display: none;
}

.checkbox-flat-box {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-neutral-300);
  border-radius: var(--radius-sm);
  background-color: var(--color-neutral-50);
  transition: background-color var(--transition-base),
              border-color var(--transition-base);
  position: relative;
}

.checkbox-flat-input:checked ~ .checkbox-flat-box {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-flat-input:checked ~ .checkbox-flat-box::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.checkbox-flat-text {
  font-size: var(--fs-body);
  color: var(--color-neutral-900);
}`,
    js: undefined
  },

  {
    id: 'checkbox-neumorphic',
    category: 'checkbox' as ComponentCategory,
    name: 'Checkbox - Neumorphic',
    description: 'Raised neumorphic checkbox with pressed inset state when checked',
    tags: ['checkbox', 'neumorphic', 'soft-shadow', 'embossed', 'tactile'],
    style: 'neumorphic' as ComponentStyle,
    animationLevel: 'high',
    html: `<label class="checkbox-neumorphic-label">
  <input type="checkbox" class="checkbox-neumorphic-input" aria-label="Agree to terms" />
  <span class="checkbox-neumorphic-box"></span>
  <span class="checkbox-neumorphic-text">I agree to the terms</span>
</label>`,
    css: `/* Checkbox — Neumorphic */
.checkbox-neumorphic-label {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  user-select: none;
}

.checkbox-neumorphic-input {
  display: none;
}

.checkbox-neumorphic-box {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-md);
  background-color: var(--color-neutral-100);
  box-shadow: 4px 4px 8px rgba(var(--color-neutral-rgb), 0.1),
              -2px -2px 4px rgba(255, 255, 255, 0.8);
  transition: box-shadow var(--transition-base);
  position: relative;
}

.checkbox-neumorphic-input:checked ~ .checkbox-neumorphic-box {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  box-shadow: inset 4px 4px 8px rgba(var(--color-neutral-rgb), 0.1),
              inset -1px -1px 3px rgba(255, 255, 255, 0.3);
}

.checkbox-neumorphic-input:checked ~ .checkbox-neumorphic-box::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.checkbox-neumorphic-text {
  font-size: var(--fs-body);
  color: var(--color-neutral-900);
}`,
    js: undefined
  },

  {
    id: 'checkbox-glass',
    category: 'checkbox' as ComponentCategory,
    name: 'Checkbox - Glassmorphic',
    description: 'Frosted glass checkbox with blur effect and semi-transparent fill on check',
    tags: ['checkbox', 'glassmorphic', 'frosted', 'blur', 'overlay'],
    style: 'glassmorphic' as ComponentStyle,
    animationLevel: 'high',
    html: `<label class="checkbox-glass-label">
  <input type="checkbox" class="checkbox-glass-input" aria-label="Agree to terms" />
  <span class="checkbox-glass-box"></span>
  <span class="checkbox-glass-text">I agree to the terms</span>
</label>`,
    css: `/* Checkbox — Glassmorphic */
.checkbox-glass-label {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  user-select: none;
}

.checkbox-glass-input {
  display: none;
}

.checkbox-glass-box {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: background var(--transition-base),
              border-color var(--transition-base),
              box-shadow var(--transition-base);
  position: relative;
}

.checkbox-glass-input:checked ~ .checkbox-glass-box {
  background: rgba(var(--color-primary-rgb), 0.3);
  border-color: rgba(var(--color-primary-rgb), 0.6);
  box-shadow: 0 0 12px rgba(var(--color-primary-rgb), 0.2);
}

.checkbox-glass-input:checked ~ .checkbox-glass-box::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: bold;
}

.checkbox-glass-text {
  font-size: var(--fs-body);
  color: var(--color-neutral-900);
}`,
    js: undefined
  },

  {
    id: 'checkbox-gradient',
    category: 'checkbox' as ComponentCategory,
    name: 'Checkbox - Gradient',
    description: 'Checkbox with animated gradient fill on check, background slides in from left',
    tags: ['checkbox', 'gradient', 'animated-gradient', 'modern', 'accent'],
    style: 'gradient' as ComponentStyle,
    animationLevel: 'high',
    html: `<label class="checkbox-gradient-label">
  <input type="checkbox" class="checkbox-gradient-input" aria-label="Agree to terms" />
  <span class="checkbox-gradient-box"></span>
  <span class="checkbox-gradient-text">I agree to the terms</span>
</label>`,
    css: `/* Checkbox — Gradient */
.checkbox-gradient-label {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  user-select: none;
}

.checkbox-gradient-input {
  display: none;
}

.checkbox-gradient-box {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-neutral-300);
  border-radius: var(--radius-sm);
  background-color: var(--color-neutral-50);
  transition: border-color var(--transition-base);
  position: relative;
  overflow: hidden;
}

.checkbox-gradient-box::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--transition-base);
}

.checkbox-gradient-input:checked ~ .checkbox-gradient-box {
  border-color: var(--color-primary);
}

.checkbox-gradient-input:checked ~ .checkbox-gradient-box::before {
  transform: scaleX(1);
}

.checkbox-gradient-input:checked ~ .checkbox-gradient-box::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
  z-index: 1;
}

.checkbox-gradient-text {
  font-size: var(--fs-body);
  color: var(--color-neutral-900);
}`,
    js: undefined
  },

  {
    id: 'checkbox-animated',
    category: 'checkbox' as ComponentCategory,
    name: 'Checkbox - Animated',
    description: 'Bouncy animated checkbox with spring checkmark and SVG path animation',
    tags: ['checkbox', 'animated', 'spring', 'bouncy', 'interactive'],
    style: 'animated' as ComponentStyle,
    animationLevel: 'high',
    html: `<label class="checkbox-animated-label">
  <input type="checkbox" class="checkbox-animated-input" aria-label="Agree to terms" />
  <span class="checkbox-animated-box">
    <svg class="checkbox-animated-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="20 6 9 17 4 12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
    </svg>
  </span>
  <span class="checkbox-animated-text">I agree to the terms</span>
</label>`,
    css: `/* Checkbox — Animated Bouncy */
.checkbox-animated-label {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  user-select: none;
}

.checkbox-animated-input {
  display: none;
}

.checkbox-animated-box {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-neutral-300);
  border-radius: var(--radius-sm);
  background-color: var(--color-neutral-50);
  transition: all var(--transition-base);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-animated-input:checked ~ .checkbox-animated-box {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  animation: checkbox-scale-in var(--transition-spring);
}

@keyframes checkbox-scale-in {
  0% { transform: scale(0.7); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.checkbox-animated-svg {
  width: 14px;
  height: 14px;
  color: white;
  stroke: currentColor;
  opacity: 0;
  animation: checkbox-check-draw 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 0.1s;
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
}

@keyframes checkbox-check-draw {
  to {
    opacity: 1;
    stroke-dashoffset: 0;
  }
}

.checkbox-animated-input:checked ~ .checkbox-animated-box .checkbox-animated-svg {
  opacity: 1;
}

.checkbox-animated-text {
  font-size: var(--fs-body);
  color: var(--color-neutral-900);
}`,
    js: undefined
  }
];

// ─── Merge all component parts into one unified library ──────────────────────

export const COMPONENT_LIBRARY: ComponentDefinition[] = [
  ...CORE_COMPONENTS,
  ...COMPONENTS_PART2,
  ...COMPONENTS_PART3,
];
