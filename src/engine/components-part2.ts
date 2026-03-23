/**
 * UI Architect MCP — Components Part 2
 * Toggle, Radio, and Loader variants
 * All colors use CSS custom properties exclusively.
 * Follows strict Design Token Registry consistency rules.
 */

import type { ComponentDefinition, ComponentCategory, ComponentStyle } from './types.js';

export const COMPONENTS_PART2: ComponentDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // TOGGLES (5 variants)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'toggle-flat',
    category: 'toggle',
    style: 'flat',
    name: 'Toggle — Flat',
    description: 'Clean pill-shaped toggle with smooth track and knob slide.',
    tags: ['toggle', 'switch', 'flat', 'minimal'],
    animationLevel: 'medium',
    html: `
      <label class="toggle-flat-wrapper">
        <input type="checkbox" class="toggle-flat-input" aria-label="Toggle switch" />
        <span class="toggle-flat-track">
          <span class="toggle-flat-knob"></span>
        </span>
      </label>
    `.trim(),
    css: `
      .toggle-flat-wrapper {
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }

      .toggle-flat-input {
        display: none;
      }

      .toggle-flat-track {
        position: relative;
        display: inline-block;
        width: 52px;
        height: 28px;
        background-color: var(--color-neutral-300);
        border-radius: var(--radius-full);
        transition: background-color var(--transition-base);
      }

      .toggle-flat-knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 24px;
        height: 24px;
        background-color: white;
        border-radius: var(--radius-full);
        box-shadow: var(--shadow-sm);
        transition: left var(--transition-base), box-shadow var(--transition-base);
      }

      .toggle-flat-input:checked + .toggle-flat-track {
        background-color: var(--color-primary);
      }

      .toggle-flat-input:checked + .toggle-flat-track .toggle-flat-knob {
        left: 26px;
      }

      .toggle-flat-input:focus-visible + .toggle-flat-track {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }
    `.trim(),
    js: `
      const input = document.querySelector('.toggle-flat-input');
      if (input) {
        input.addEventListener('change', (e) => {
          e.target.dispatchEvent(new CustomEvent('toggle-change', {
            detail: { checked: e.target.checked }
          }));
        });
      }
    `.trim(),
  },

  {
    id: 'toggle-neumorphic',
    category: 'toggle',
    style: 'neumorphic',
    name: 'Toggle — Neumorphic',
    description: 'Tactile neumorphic toggle with depth shadows and inset/raised effects.',
    tags: ['toggle', 'switch', 'neumorphic', 'depth'],
    animationLevel: 'high',
    html: `
      <label class="toggle-neomorphic-wrapper">
        <input type="checkbox" class="toggle-neomorphic-input" aria-label="Toggle switch" />
        <span class="toggle-neomorphic-track">
          <span class="toggle-neomorphic-knob"></span>
        </span>
      </label>
    `.trim(),
    css: `
      .toggle-neomorphic-wrapper {
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }

      .toggle-neomorphic-input {
        display: none;
      }

      .toggle-neomorphic-track {
        position: relative;
        display: inline-block;
        width: 56px;
        height: 32px;
        background-color: var(--color-neutral-200);
        border-radius: var(--radius-full);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.08),
                    inset 0 -2px 4px rgba(255, 255, 255, 0.6);
        transition: background-color var(--transition-base);
      }

      .toggle-neomorphic-knob {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 26px;
        height: 26px;
        background-color: white;
        border-radius: var(--radius-full);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12),
                    0 -1px 2px rgba(255, 255, 255, 0.8);
        transition: left var(--transition-base), box-shadow var(--transition-base);
      }

      .toggle-neomorphic-input:checked + .toggle-neomorphic-track {
        background-color: var(--color-primary);
      }

      .toggle-neomorphic-input:checked + .toggle-neomorphic-track .toggle-neomorphic-knob {
        left: 27px;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12);
      }

      .toggle-neomorphic-input:focus-visible + .toggle-neomorphic-track {
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.08),
                    inset 0 -2px 4px rgba(255, 255, 255, 0.6),
                    0 0 0 3px rgba(var(--color-primary-rgb), 0.15);
      }
    `.trim(),
  },

  {
    id: 'toggle-glassmorphic',
    category: 'toggle',
    style: 'glassmorphic',
    name: 'Toggle — Glassmorphic',
    description: 'Frosted glass toggle with backdrop blur and semi-transparency.',
    tags: ['toggle', 'switch', 'glassmorphic', 'blur'],
    animationLevel: 'high',
    html: `
      <label class="toggle-glass-wrapper">
        <input type="checkbox" class="toggle-glass-input" aria-label="Toggle switch" />
        <span class="toggle-glass-track">
          <span class="toggle-glass-knob"></span>
        </span>
      </label>
    `.trim(),
    css: `
      .toggle-glass-wrapper {
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }

      .toggle-glass-input {
        display: none;
      }

      .toggle-glass-track {
        position: relative;
        display: inline-block;
        width: 54px;
        height: 30px;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-full);
        backdrop-filter: blur(10px);
        transition: background var(--transition-base), border-color var(--transition-base);
      }

      .toggle-glass-knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 26px;
        height: 26px;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: var(--radius-full);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: left var(--transition-spring);
      }

      .toggle-glass-input:checked + .toggle-glass-track {
        background: rgba(var(--color-primary-rgb), 0.3);
        border-color: var(--color-primary);
      }

      .toggle-glass-input:checked + .toggle-glass-track .toggle-glass-knob {
        left: 26px;
      }

      .toggle-glass-input:focus-visible + .toggle-glass-track {
        box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
      }
    `.trim(),
  },

  {
    id: 'toggle-gradient',
    category: 'toggle',
    style: 'gradient',
    name: 'Toggle — Gradient',
    description: 'Vibrant toggle with animated gradient fill on the track.',
    tags: ['toggle', 'switch', 'gradient', 'animated-bg'],
    animationLevel: 'high',
    html: `
      <label class="toggle-gradient-wrapper">
        <input type="checkbox" class="toggle-gradient-input" aria-label="Toggle switch" />
        <span class="toggle-gradient-track">
          <span class="toggle-gradient-knob"></span>
        </span>
      </label>
    `.trim(),
    css: `
      .toggle-gradient-wrapper {
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }

      .toggle-gradient-input {
        display: none;
      }

      .toggle-gradient-track {
        position: relative;
        display: inline-block;
        width: 54px;
        height: 30px;
        background-color: var(--color-neutral-300);
        border-radius: var(--radius-full);
        transition: background var(--transition-base);
      }

      .toggle-gradient-knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 26px;
        height: 26px;
        background-color: white;
        border-radius: var(--radius-full);
        box-shadow: var(--shadow-md);
        transition: left var(--transition-base), box-shadow var(--transition-base);
      }

      .toggle-gradient-input:checked + .toggle-gradient-track {
        background: linear-gradient(
          135deg,
          var(--color-primary),
          var(--color-secondary)
        );
        animation: gradient-shift-toggle 3s ease-in-out infinite;
      }

      .toggle-gradient-input:checked + .toggle-gradient-track .toggle-gradient-knob {
        left: 26px;
        box-shadow: 0 0 12px rgba(var(--color-primary-rgb), 0.4);
      }

      @keyframes gradient-shift-toggle {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .toggle-gradient-input:focus-visible + .toggle-gradient-track {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }
    `.trim(),
  },

  {
    id: 'toggle-animated',
    category: 'toggle',
    style: 'animated',
    name: 'Toggle — Animated',
    description: 'Playful toggle with spring-eased knob and bounce on activation.',
    tags: ['toggle', 'switch', 'animated', 'spring'],
    animationLevel: 'high',
    html: `
      <label class="toggle-animated-wrapper">
        <input type="checkbox" class="toggle-animated-input" aria-label="Toggle switch" />
        <span class="toggle-animated-track">
          <span class="toggle-animated-knob"></span>
        </span>
      </label>
    `.trim(),
    css: `
      .toggle-animated-wrapper {
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }

      .toggle-animated-input {
        display: none;
      }

      .toggle-animated-track {
        position: relative;
        display: inline-block;
        width: 54px;
        height: 30px;
        background-color: var(--color-neutral-300);
        border-radius: var(--radius-full);
        transition: background-color var(--transition-base);
      }

      .toggle-animated-knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 26px;
        height: 26px;
        background-color: white;
        border-radius: var(--radius-full);
        box-shadow: var(--shadow-md);
        transition: left var(--transition-spring);
      }

      .toggle-animated-input:checked + .toggle-animated-track {
        background-color: var(--color-primary);
      }

      .toggle-animated-input:checked + .toggle-animated-track .toggle-animated-knob {
        left: 26px;
        animation: knob-bounce 0.5s var(--ease-spring);
      }

      @keyframes knob-bounce {
        0% { transform: scale(1); }
        60% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }

      .toggle-animated-input:focus-visible + .toggle-animated-track {
        box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
      }
    `.trim(),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RADIO BUTTONS (5 variants)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'radio-flat',
    category: 'radio',
    style: 'flat',
    name: 'Radio — Flat',
    description: 'Clean circular radio with smooth border and inner dot selection.',
    tags: ['radio', 'button', 'flat', 'minimal'],
    animationLevel: 'medium',
    html: `
      <label class="radio-flat-wrapper">
        <input type="radio" name="option" class="radio-flat-input" value="option1" aria-label="Option 1" />
        <span class="radio-flat-circle">
          <span class="radio-flat-dot"></span>
        </span>
        <span class="radio-flat-label">Option</span>
      </label>
    `.trim(),
    css: `
      .radio-flat-wrapper {
        display: inline-flex;
        align-items: center;
        gap: var(--space-md);
        cursor: pointer;
        user-select: none;
        margin-bottom: var(--space-md);
      }

      .radio-flat-input {
        display: none;
      }

      .radio-flat-circle {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border: 2px solid var(--color-neutral-300);
        border-radius: var(--radius-full);
        transition: border-color var(--transition-base);
      }

      .radio-flat-dot {
        display: block;
        width: 8px;
        height: 8px;
        background-color: var(--color-primary);
        border-radius: var(--radius-full);
        opacity: 0;
        transform: scale(0);
        transition: opacity var(--transition-base), transform var(--transition-base);
      }

      .radio-flat-input:checked + .radio-flat-circle {
        border-color: var(--color-primary);
      }

      .radio-flat-input:checked + .radio-flat-circle .radio-flat-dot {
        opacity: 1;
        transform: scale(1);
      }

      .radio-flat-input:focus-visible + .radio-flat-circle {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      .radio-flat-label {
        font-size: var(--fs-body);
        color: var(--color-neutral-900);
      }
    `.trim(),
  },

  {
    id: 'radio-neumorphic',
    category: 'radio',
    style: 'neumorphic',
    name: 'Radio — Neumorphic',
    description: 'Tactile neumorphic radio with raised/inset shadow depth feedback.',
    tags: ['radio', 'button', 'neumorphic', 'depth'],
    animationLevel: 'high',
    html: `
      <label class="radio-neomorphic-wrapper">
        <input type="radio" name="option" class="radio-neomorphic-input" value="option1" aria-label="Option 1" />
        <span class="radio-neomorphic-circle">
          <span class="radio-neomorphic-dot"></span>
        </span>
        <span class="radio-neomorphic-label">Option</span>
      </label>
    `.trim(),
    css: `
      .radio-neomorphic-wrapper {
        display: inline-flex;
        align-items: center;
        gap: var(--space-md);
        cursor: pointer;
        user-select: none;
        margin-bottom: var(--space-md);
      }

      .radio-neomorphic-input {
        display: none;
      }

      .radio-neomorphic-circle {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        background-color: var(--color-neutral-200);
        border-radius: var(--radius-full);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08),
                    0 -1px 2px rgba(255, 255, 255, 0.6);
        transition: all var(--transition-base);
      }

      .radio-neomorphic-dot {
        display: block;
        width: 8px;
        height: 8px;
        background-color: var(--color-primary);
        border-radius: var(--radius-full);
        opacity: 0;
        transform: scale(0);
        transition: opacity var(--transition-base), transform var(--transition-base);
      }

      .radio-neomorphic-input:checked + .radio-neomorphic-circle {
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1),
                    inset 0 -1px 2px rgba(255, 255, 255, 0.4);
        background-color: var(--color-primary);
      }

      .radio-neomorphic-input:checked + .radio-neomorphic-circle .radio-neomorphic-dot {
        opacity: 1;
        transform: scale(1);
      }

      .radio-neomorphic-input:focus-visible + .radio-neomorphic-circle {
        box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
      }

      .radio-neomorphic-label {
        font-size: var(--fs-body);
        color: var(--color-neutral-900);
      }
    `.trim(),
  },

  {
    id: 'radio-glassmorphic',
    category: 'radio',
    style: 'glassmorphic',
    name: 'Radio — Glassmorphic',
    description: 'Frosted glass radio with backdrop blur and glowing selection.',
    tags: ['radio', 'button', 'glassmorphic', 'blur'],
    animationLevel: 'high',
    html: `
      <label class="radio-glass-wrapper">
        <input type="radio" name="option" class="radio-glass-input" value="option1" aria-label="Option 1" />
        <span class="radio-glass-circle">
          <span class="radio-glass-dot"></span>
        </span>
        <span class="radio-glass-label">Option</span>
      </label>
    `.trim(),
    css: `
      .radio-glass-wrapper {
        display: inline-flex;
        align-items: center;
        gap: var(--space-md);
        cursor: pointer;
        user-select: none;
        margin-bottom: var(--space-md);
      }

      .radio-glass-input {
        display: none;
      }

      .radio-glass-circle {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        background: rgba(255, 255, 255, 0.15);
        border: 1.5px solid rgba(255, 255, 255, 0.25);
        border-radius: var(--radius-full);
        backdrop-filter: blur(10px);
        transition: all var(--transition-base);
      }

      .radio-glass-dot {
        display: block;
        width: 8px;
        height: 8px;
        background-color: var(--color-primary);
        border-radius: var(--radius-full);
        opacity: 0;
        transform: scale(0);
        transition: opacity var(--transition-base), transform var(--transition-base);
        box-shadow: 0 0 8px rgba(var(--color-primary-rgb), 0.6);
      }

      .radio-glass-input:checked + .radio-glass-circle {
        background: rgba(var(--color-primary-rgb), 0.25);
        border-color: var(--color-primary);
      }

      .radio-glass-input:checked + .radio-glass-circle .radio-glass-dot {
        opacity: 1;
        transform: scale(1);
      }

      .radio-glass-input:focus-visible + .radio-glass-circle {
        box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.25);
      }

      .radio-glass-label {
        font-size: var(--fs-body);
        color: var(--color-neutral-900);
      }
    `.trim(),
  },

  {
    id: 'radio-gradient',
    category: 'radio',
    style: 'gradient',
    name: 'Radio — Gradient',
    description: 'Vibrant radio with gradient border and animated dot fill.',
    tags: ['radio', 'button', 'gradient', 'dynamic'],
    animationLevel: 'high',
    html: `
      <label class="radio-gradient-wrapper">
        <input type="radio" name="option" class="radio-gradient-input" value="option1" aria-label="Option 1" />
        <span class="radio-gradient-circle">
          <span class="radio-gradient-dot"></span>
        </span>
        <span class="radio-gradient-label">Option</span>
      </label>
    `.trim(),
    css: `
      .radio-gradient-wrapper {
        display: inline-flex;
        align-items: center;
        gap: var(--space-md);
        cursor: pointer;
        user-select: none;
        margin-bottom: var(--space-md);
      }

      .radio-gradient-input {
        display: none;
      }

      .radio-gradient-circle {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border: 2px solid var(--color-neutral-300);
        border-radius: var(--radius-full);
        transition: border-color var(--transition-base);
      }

      .radio-gradient-dot {
        display: block;
        width: 8px;
        height: 8px;
        background: linear-gradient(
          135deg,
          var(--color-primary),
          var(--color-secondary)
        );
        border-radius: var(--radius-full);
        opacity: 0;
        transform: scale(0);
        transition: opacity var(--transition-base), transform var(--transition-base);
      }

      .radio-gradient-input:checked + .radio-gradient-circle {
        border-color: var(--color-primary);
        animation: gradient-border-rotate 3s linear infinite;
      }

      .radio-gradient-input:checked + .radio-gradient-circle .radio-gradient-dot {
        opacity: 1;
        transform: scale(1);
      }

      @keyframes gradient-border-rotate {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }

      .radio-gradient-input:focus-visible + .radio-gradient-circle {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      .radio-gradient-label {
        font-size: var(--fs-body);
        color: var(--color-neutral-900);
      }
    `.trim(),
  },

  {
    id: 'radio-animated',
    category: 'radio',
    style: 'animated',
    name: 'Radio — Animated',
    description: 'Playful radio with spring-eased dot and outward ripple effect.',
    tags: ['radio', 'button', 'animated', 'ripple'],
    animationLevel: 'high',
    html: `
      <label class="radio-animated-wrapper">
        <input type="radio" name="option" class="radio-animated-input" value="option1" aria-label="Option 1" />
        <span class="radio-animated-circle">
          <span class="radio-animated-dot"></span>
          <span class="radio-animated-ripple"></span>
        </span>
        <span class="radio-animated-label">Option</span>
      </label>
    `.trim(),
    css: `
      .radio-animated-wrapper {
        display: inline-flex;
        align-items: center;
        gap: var(--space-md);
        cursor: pointer;
        user-select: none;
        margin-bottom: var(--space-md);
      }

      .radio-animated-input {
        display: none;
      }

      .radio-animated-circle {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border: 2px solid var(--color-neutral-300);
        border-radius: var(--radius-full);
        transition: border-color var(--transition-base);
      }

      .radio-animated-dot {
        display: block;
        width: 8px;
        height: 8px;
        background-color: var(--color-primary);
        border-radius: var(--radius-full);
        opacity: 0;
        transform: scale(0);
        transition: opacity var(--transition-base), transform var(--transition-spring);
      }

      .radio-animated-ripple {
        position: absolute;
        inset: -4px;
        border: 2px solid var(--color-primary);
        border-radius: var(--radius-full);
        opacity: 0;
        animation: none;
      }

      .radio-animated-input:checked + .radio-animated-circle {
        border-color: var(--color-primary);
      }

      .radio-animated-input:checked + .radio-animated-circle .radio-animated-dot {
        opacity: 1;
        transform: scale(1);
      }

      .radio-animated-input:checked + .radio-animated-circle .radio-animated-ripple {
        animation: ripple-out 0.6s ease-out;
      }

      @keyframes ripple-out {
        0% {
          transform: scale(0.5);
          opacity: 1;
        }
        100% {
          transform: scale(1.8);
          opacity: 0;
        }
      }

      .radio-animated-input:focus-visible + .radio-animated-circle {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      .radio-animated-label {
        font-size: var(--fs-body);
        color: var(--color-neutral-900);
      }
    `.trim(),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADERS / SPINNERS (5 variants)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'loader-flat',
    category: 'loader',
    style: 'flat',
    name: 'Loader — Flat',
    description: 'Simple spinning circle with primary-colored border-top.',
    tags: ['loader', 'spinner', 'flat', 'minimal'],
    animationLevel: 'medium',
    html: `
      <div class="loader-flat" aria-label="Loading"></div>
    `.trim(),
    css: `
      .loader-flat {
        width: 40px;
        height: 40px;
        border: 3px solid var(--color-neutral-200);
        border-top-color: var(--color-primary);
        border-radius: var(--radius-full);
        animation: loader-spin 0.8s linear infinite;
      }

      @keyframes loader-spin {
        to { transform: rotate(360deg); }
      }
    `.trim(),
  },

  {
    id: 'loader-neumorphic',
    category: 'loader',
    style: 'neumorphic',
    name: 'Loader — Neumorphic',
    description: 'Raised neumorphic spinner with shadow depth rotation.',
    tags: ['loader', 'spinner', 'neumorphic', 'depth'],
    animationLevel: 'high',
    html: `
      <div class="loader-neomorphic" aria-label="Loading"></div>
    `.trim(),
    css: `
      .loader-neomorphic {
        width: 44px;
        height: 44px;
        border-radius: var(--radius-full);
        background-color: var(--color-neutral-200);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08),
                    inset 0 2px 4px rgba(255, 255, 255, 0.6),
                    0 0 0 3px var(--color-primary);
        animation: loader-rotate-neomorphic 1s linear infinite;
      }

      @keyframes loader-rotate-neomorphic {
        to { transform: rotate(360deg); }
      }
    `.trim(),
  },

  {
    id: 'loader-glassmorphic',
    category: 'loader',
    style: 'glassmorphic',
    name: 'Loader — Glassmorphic',
    description: 'Frosted glass spinner with glowing arc and backdrop blur.',
    tags: ['loader', 'spinner', 'glassmorphic', 'glow'],
    animationLevel: 'high',
    html: `
      <div class="loader-glass" aria-label="Loading">
        <div class="loader-glass-arc"></div>
      </div>
    `.trim(),
    css: `
      .loader-glass {
        width: 42px;
        height: 42px;
        border-radius: var(--radius-full);
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        overflow: hidden;
      }

      .loader-glass-arc {
        position: absolute;
        inset: 3px;
        border-radius: var(--radius-full);
        border: 3px solid transparent;
        border-top-color: var(--color-primary);
        box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.6);
        animation: loader-spin 0.8s linear infinite;
      }

      @keyframes loader-spin {
        to { transform: rotate(360deg); }
      }
    `.trim(),
  },

  {
    id: 'loader-gradient',
    category: 'loader',
    style: 'gradient',
    name: 'Loader — Gradient',
    description: 'Vibrant conic-gradient spinner with rotating gradient stroke.',
    tags: ['loader', 'spinner', 'gradient', 'colorful'],
    animationLevel: 'high',
    html: `
      <div class="loader-gradient" aria-label="Loading"></div>
    `.trim(),
    css: `
      .loader-gradient {
        width: 44px;
        height: 44px;
        border-radius: var(--radius-full);
        background: conic-gradient(
          from 0deg,
          var(--color-primary),
          var(--color-secondary),
          var(--color-primary)
        );
        position: relative;
        animation: loader-spin 1s linear infinite;
      }

      .loader-gradient::after {
        content: '';
        position: absolute;
        inset: 3px;
        border-radius: var(--radius-full);
        background: white;
      }

      @keyframes loader-spin {
        to { transform: rotate(360deg); }
      }
    `.trim(),
  },

  {
    id: 'loader-animated',
    category: 'loader',
    style: 'animated',
    name: 'Loader — Animated',
    description: 'Pulsing concentric rings with staggered expansion animation.',
    tags: ['loader', 'spinner', 'animated', 'pulse'],
    animationLevel: 'high',
    html: `
      <div class="loader-animated" aria-label="Loading">
        <div class="loader-animated-ring"></div>
        <div class="loader-animated-ring"></div>
        <div class="loader-animated-ring"></div>
      </div>
    `.trim(),
    css: `
      .loader-animated {
        position: relative;
        width: 44px;
        height: 44px;
      }

      .loader-animated-ring {
        position: absolute;
        inset: 0;
        border: 3px solid var(--color-primary);
        border-radius: var(--radius-full);
        opacity: 1;
        animation: loader-pulse-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      }

      .loader-animated-ring:nth-child(1) {
        animation-delay: -0.45s;
      }

      .loader-animated-ring:nth-child(2) {
        animation-delay: -0.3s;
      }

      .loader-animated-ring:nth-child(3) {
        animation-delay: -0.15s;
      }

      @keyframes loader-pulse-ring {
        0% {
          transform: scale(0);
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 0;
        }
      }
    `.trim(),
  },
];
