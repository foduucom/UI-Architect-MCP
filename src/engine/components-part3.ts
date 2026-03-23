import type { ComponentDefinition, ComponentCategory, ComponentStyle } from './types.js';

export const COMPONENTS_PART3: ComponentDefinition[] = [
  // ============================================================================
  // BADGE COMPONENTS (5 variants)
  // ============================================================================

  {
    id: 'badge-flat',
    name: 'Badge - Flat',
    category: 'badge' as ComponentCategory,
    style: 'flat' as ComponentStyle,
    description: 'Minimal flat badge with color variants for status indication.',
    tags: ['badge', 'status', 'flat', 'label', 'indicator'],
    animationLevel: 'low',
    html: `
<span class="badge badge-flat" data-variant="default" role="status">
  New
</span>
<span class="badge badge-flat" data-variant="success" role="status">
  Active
</span>
<span class="badge badge-flat" data-variant="warning" role="status">
  Pending
</span>
<span class="badge badge-flat" data-variant="error" role="status">
  Failed
</span>
<span class="badge badge-flat" data-variant="info" role="status">
  Info
</span>
    `.trim(),
    css: `
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--fs-small);
  font-weight: 500;
  white-space: nowrap;
}

.badge-flat {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-700);
  border: 1px solid var(--color-neutral-200);
}

.badge-flat[data-variant="success"] {
  background-color: rgba(34, 197, 94, 0.12);
  color: var(--color-success);
  border-color: rgba(34, 197, 94, 0.2);
}

.badge-flat[data-variant="warning"] {
  background-color: rgba(245, 158, 11, 0.12);
  color: var(--color-warning);
  border-color: rgba(245, 158, 11, 0.2);
}

.badge-flat[data-variant="error"] {
  background-color: rgba(239, 68, 68, 0.12);
  color: var(--color-error);
  border-color: rgba(239, 68, 68, 0.2);
}

.badge-flat[data-variant="info"] {
  background-color: rgba(59, 130, 246, 0.12);
  color: var(--color-info);
  border-color: rgba(59, 130, 246, 0.2);
}
    `.trim(),
  },

  {
    id: 'badge-neumorphic',
    name: 'Badge - Neumorphic',
    category: 'badge' as ComponentCategory,
    style: 'neumorphic' as ComponentStyle,
    description: 'Neumorphic badge with soft shadows for elevated, tactile appearance.',
    tags: ['badge', 'neumorphic', 'shadow', 'status', 'soft'],
    animationLevel: 'medium',
    html: `
<span class="badge badge-neumorphic" data-variant="default" role="status">
  New
</span>
<span class="badge badge-neumorphic" data-variant="success" role="status">
  Active
</span>
<span class="badge badge-neumorphic" data-variant="error" role="status">
  Failed
</span>
    `.trim(),
    css: `
.badge-neumorphic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--fs-small);
  font-weight: 500;
  background-color: var(--color-neutral-50);
  color: var(--color-neutral-700);
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.06), -2px -2px 5px rgba(255, 255, 255, 0.8);
  border: none;
  transition: box-shadow var(--transition-fast), color var(--transition-fast);
}

.badge-neumorphic:hover {
  box-shadow: 3px 3px 7px rgba(0, 0, 0, 0.08), -3px -3px 7px rgba(255, 255, 255, 0.9);
}

.badge-neumorphic[data-variant="success"] {
  color: var(--color-success);
}

.badge-neumorphic[data-variant="success"]:hover {
  color: var(--color-success);
}

.badge-neumorphic[data-variant="error"] {
  color: var(--color-error);
}

.badge-neumorphic[data-variant="error"]:hover {
  color: var(--color-error);
}
    `.trim(),
  },

  {
    id: 'badge-glass',
    name: 'Badge - Glassmorphic',
    category: 'badge' as ComponentCategory,
    style: 'glassmorphic' as ComponentStyle,
    description: 'Glassmorphic badge with blur effect and transparency for modern look.',
    tags: ['badge', 'glass', 'blur', 'modern', 'transparent'],
    animationLevel: 'medium',
    html: `
<span class="badge badge-glass" data-variant="default" role="status">
  New
</span>
<span class="badge badge-glass" data-variant="success" role="status">
  Active
</span>
<span class="badge badge-glass" data-variant="warning" role="status">
  Pending
</span>
    `.trim(),
    css: `
.badge-glass {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--fs-small);
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-neutral-900);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.badge-glass[data-variant="success"] {
  background-color: rgba(34, 197, 94, 0.08);
  color: var(--color-success);
  border-color: rgba(34, 197, 94, 0.15);
}

.badge-glass[data-variant="warning"] {
  background-color: rgba(245, 158, 11, 0.08);
  color: var(--color-warning);
  border-color: rgba(245, 158, 11, 0.15);
}

.badge-glass:hover {
  background-color: rgba(255, 255, 255, 0.15);
}
    `.trim(),
  },

  {
    id: 'badge-gradient',
    name: 'Badge - Gradient',
    category: 'badge' as ComponentCategory,
    style: 'gradient' as ComponentStyle,
    description: 'Gradient badge with vibrant color transitions for eye-catching status.',
    tags: ['badge', 'gradient', 'colorful', 'vibrant', 'status'],
    animationLevel: 'medium',
    html: `
<span class="badge badge-gradient" data-variant="default" role="status">
  New
</span>
<span class="badge badge-gradient" data-variant="success" role="status">
  Active
</span>
<span class="badge badge-gradient" data-variant="info" role="status">
  Info
</span>
    `.trim(),
    css: `
.badge-gradient {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--fs-small);
  font-weight: 500;
  background: linear-gradient(135deg, var(--color-neutral-100), var(--color-neutral-200));
  color: var(--color-neutral-700);
  border: none;
  transition: transform var(--transition-fast);
}

.badge-gradient:hover {
  transform: scale(1.05);
}

.badge-gradient[data-variant="success"] {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.06));
  color: var(--color-success);
}

.badge-gradient[data-variant="info"] {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06));
  color: var(--color-info);
}
    `.trim(),
  },

  {
    id: 'badge-animated',
    name: 'Badge - Animated',
    category: 'badge' as ComponentCategory,
    style: 'animated' as ComponentStyle,
    description: 'Animated badge with pulse and scale effects for attention-grabbing status.',
    tags: ['badge', 'animated', 'pulse', 'active', 'dynamic'],
    animationLevel: 'high',
    html: `
<span class="badge badge-animated" data-variant="default" role="status">
  New
</span>
<span class="badge badge-animated" data-variant="success" role="status">
  Active
</span>
<span class="badge badge-animated" data-variant="error" role="status">
  Failed
</span>
    `.trim(),
    css: `
@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(var(--color-primary-rgb), 0.1); }
}

@keyframes badge-scale-in {
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

.badge-animated {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--fs-small);
  font-weight: 500;
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-700);
  border: 1px solid var(--color-neutral-200);
  animation: badge-scale-in var(--transition-spring);
}

.badge-animated[data-variant="success"] {
  background-color: rgba(34, 197, 94, 0.12);
  color: var(--color-success);
  border-color: rgba(34, 197, 94, 0.2);
  animation: badge-scale-in var(--transition-spring), badge-pulse 2s infinite;
}

.badge-animated[data-variant="error"] {
  background-color: rgba(239, 68, 68, 0.12);
  color: var(--color-error);
  border-color: rgba(239, 68, 68, 0.2);
}
    `.trim(),
  },

  // ============================================================================
  // TOOLTIP COMPONENTS (4 variants)
  // ============================================================================

  {
    id: 'tooltip-flat',
    name: 'Tooltip - Flat',
    category: 'tooltip' as ComponentCategory,
    style: 'flat' as ComponentStyle,
    description: 'Minimal flat tooltip with smooth fade-in animation on hover.',
    tags: ['tooltip', 'flat', 'help', 'info', 'hover'],
    animationLevel: 'medium',
    html: `
<div class="tooltip-container">
  <button class="tooltip-trigger" aria-describedby="tooltip-1">
    Hover me
  </button>
  <div class="tooltip tooltip-flat" id="tooltip-1" role="tooltip">
    <span class="tooltip-content">Helpful information</span>
    <span class="tooltip-arrow"></span>
  </div>
</div>
    `.trim(),
    css: `
.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--fs-small);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.tooltip-trigger:hover ~ .tooltip,
.tooltip-trigger:focus ~ .tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-12px);
}

.tooltip-flat {
  background-color: var(--color-neutral-900);
  color: var(--color-neutral-50);
}

.tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid var(--color-neutral-900);
}
    `.trim(),
  },

  {
    id: 'tooltip-glass',
    name: 'Tooltip - Glassmorphic',
    category: 'tooltip' as ComponentCategory,
    style: 'glassmorphic' as ComponentStyle,
    description: 'Glassmorphic tooltip with blur backdrop and modern transparency effects.',
    tags: ['tooltip', 'glass', 'blur', 'modern', 'help'],
    animationLevel: 'high',
    html: `
<div class="tooltip-container">
  <button class="tooltip-trigger" aria-describedby="tooltip-2">
    Hover me
  </button>
  <div class="tooltip tooltip-glass" id="tooltip-2" role="tooltip">
    <span class="tooltip-content">Helpful information</span>
    <span class="tooltip-arrow"></span>
  </div>
</div>
    `.trim(),
    css: `
.tooltip-glass {
  background-color: rgba(15, 23, 42, 0.85);
  color: var(--color-neutral-50);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-lg);
}

.tooltip-glass .tooltip-arrow {
  border-top-color: rgba(15, 23, 42, 0.85);
}

.tooltip-trigger:hover ~ .tooltip-glass,
.tooltip-trigger:focus ~ .tooltip-glass {
  animation: tooltip-slide-up var(--transition-spring) forwards;
}

@keyframes tooltip-slide-up {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(0) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(-12px) scale(1);
  }
}
    `.trim(),
  },

  {
    id: 'tooltip-gradient',
    name: 'Tooltip - Gradient',
    category: 'tooltip' as ComponentCategory,
    style: 'gradient' as ComponentStyle,
    description: 'Gradient tooltip with vibrant color transition for stylish help text.',
    tags: ['tooltip', 'gradient', 'colorful', 'info', 'hover'],
    animationLevel: 'high',
    html: `
<div class="tooltip-container">
  <button class="tooltip-trigger" aria-describedby="tooltip-3">
    Hover me
  </button>
  <div class="tooltip tooltip-gradient" id="tooltip-3" role="tooltip">
    <span class="tooltip-content">Helpful information</span>
    <span class="tooltip-arrow"></span>
  </div>
</div>
    `.trim(),
    css: `
.tooltip-gradient {
  background: linear-gradient(135deg, var(--color-neutral-900), rgba(15, 23, 42, 0.9));
  color: var(--color-neutral-50);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  box-shadow: var(--shadow-lg);
}

.tooltip-gradient .tooltip-arrow {
  border-top-color: var(--color-neutral-900);
}

.tooltip-trigger:hover ~ .tooltip-gradient,
.tooltip-trigger:focus ~ .tooltip-gradient {
  animation: tooltip-scale-up var(--transition-base) cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes tooltip-scale-up {
  0% {
    opacity: 0;
    transform: translateX(-50%) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(-12px) scale(1);
  }
}
    `.trim(),
  },

  {
    id: 'tooltip-animated',
    name: 'Tooltip - Animated',
    category: 'tooltip' as ComponentCategory,
    style: 'animated' as ComponentStyle,
    description: 'Animated tooltip with bounce and slide entrance effects for dynamic help.',
    tags: ['tooltip', 'animated', 'bounce', 'dynamic', 'info'],
    animationLevel: 'high',
    html: `
<div class="tooltip-container">
  <button class="tooltip-trigger" aria-describedby="tooltip-4">
    Hover me
  </button>
  <div class="tooltip tooltip-animated" id="tooltip-4" role="tooltip">
    <span class="tooltip-content">Helpful information</span>
    <span class="tooltip-arrow"></span>
  </div>
</div>
    `.trim(),
    css: `
.tooltip-animated {
  background-color: var(--color-neutral-900);
  color: var(--color-neutral-50);
  box-shadow: var(--shadow-lg);
}

.tooltip-animated .tooltip-arrow {
  border-top-color: var(--color-neutral-900);
}

.tooltip-trigger:hover ~ .tooltip-animated,
.tooltip-trigger:focus ~ .tooltip-animated {
  animation: tooltip-bounce var(--transition-spring) forwards;
}

@keyframes tooltip-bounce {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px) scale(0.95);
  }
  60% {
    transform: translateX(-50%) translateY(-14px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(-12px) scale(1);
  }
}
    `.trim(),
  },

  // ============================================================================
  // NAVIGATION COMPONENTS (4 variants)
  // ============================================================================

  {
    id: 'nav-flat',
    name: 'Navigation - Flat',
    category: 'navigation' as ComponentCategory,
    style: 'flat' as ComponentStyle,
    description: 'Minimal flat navigation with underline animation on hover.',
    tags: ['navigation', 'nav', 'flat', 'menu', 'link'],
    animationLevel: 'medium',
    html: `
<nav class="nav nav-flat" role="navigation">
  <a href="#" class="nav-link">Home</a>
  <a href="#" class="nav-link active">About</a>
  <a href="#" class="nav-link">Services</a>
  <a href="#" class="nav-link">Contact</a>
</nav>
    `.trim(),
    css: `
.nav {
  display: flex;
  gap: var(--space-lg);
}

.nav-link {
  color: var(--color-neutral-700);
  font-weight: 500;
  font-size: var(--fs-body);
  transition: color var(--transition-fast);
  position: relative;
}

.nav-flat .nav-link:hover {
  color: var(--color-primary);
}

.nav-flat .nav-link.active {
  color: var(--color-primary);
  font-weight: 600;
}
    `.trim(),
  },

  {
    id: 'nav-glass',
    name: 'Navigation - Glassmorphic',
    category: 'navigation' as ComponentCategory,
    style: 'glassmorphic' as ComponentStyle,
    description: 'Glassmorphic navigation with backdrop blur and modern transparency.',
    tags: ['navigation', 'glass', 'blur', 'modern', 'menu'],
    animationLevel: 'high',
    html: `
<nav class="nav nav-glass" role="navigation">
  <a href="#" class="nav-link">Home</a>
  <a href="#" class="nav-link active">About</a>
  <a href="#" class="nav-link">Services</a>
  <a href="#" class="nav-link">Contact</a>
</nav>
    `.trim(),
    css: `
.nav-glass {
  display: flex;
  gap: var(--space-md);
}

.nav-glass .nav-link {
  position: relative;
  color: var(--color-neutral-700);
  font-weight: 500;
  font-size: var(--fs-body);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.nav-glass .nav-link:hover {
  background-color: rgba(var(--color-primary-rgb), 0.08);
  color: var(--color-primary);
  backdrop-filter: blur(10px);
}

.nav-glass .nav-link.active {
  background-color: rgba(var(--color-primary-rgb), 0.12);
  color: var(--color-primary);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
    `.trim(),
  },

  {
    id: 'nav-gradient',
    name: 'Navigation - Gradient',
    category: 'navigation' as ComponentCategory,
    style: 'gradient' as ComponentStyle,
    description: 'Gradient navigation with colorful underline animation for active links.',
    tags: ['navigation', 'gradient', 'colorful', 'menu', 'active'],
    animationLevel: 'high',
    html: `
<nav class="nav nav-gradient" role="navigation">
  <a href="#" class="nav-link">Home</a>
  <a href="#" class="nav-link active">About</a>
  <a href="#" class="nav-link">Services</a>
  <a href="#" class="nav-link">Contact</a>
</nav>
    `.trim(),
    css: `
.nav-gradient {
  display: flex;
  gap: var(--space-lg);
}

.nav-gradient .nav-link {
  position: relative;
  color: var(--color-neutral-700);
  font-weight: 500;
  font-size: var(--fs-body);
  padding-bottom: var(--space-sm);
  transition: color var(--transition-base);
}

.nav-gradient .nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  transition: width var(--transition-base) cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-gradient .nav-link:hover::after {
  width: 100%;
}

.nav-gradient .nav-link.active {
  color: var(--color-primary);
}

.nav-gradient .nav-link.active::after {
  width: 100%;
}
    `.trim(),
  },

  {
    id: 'nav-animated',
    name: 'Navigation - Animated',
    category: 'navigation' as ComponentCategory,
    style: 'animated' as ComponentStyle,
    description: 'Animated navigation with dynamic underline reveal on hover.',
    tags: ['navigation', 'animated', 'underline', 'dynamic', 'menu'],
    animationLevel: 'high',
    html: `
<nav class="nav nav-animated" role="navigation">
  <a href="#" class="nav-link">Home</a>
  <a href="#" class="nav-link active">About</a>
  <a href="#" class="nav-link">Services</a>
  <a href="#" class="nav-link">Contact</a>
</nav>
    `.trim(),
    css: `
.nav-animated {
  display: flex;
  gap: var(--space-lg);
}

.nav-animated .nav-link {
  position: relative;
  color: var(--color-neutral-700);
  font-weight: 500;
  font-size: var(--fs-body);
  padding-bottom: var(--space-sm);
  transition: color var(--transition-base);
}

.nav-animated .nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--color-primary);
  transition: width var(--transition-base) cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-animated .nav-link:hover::after,
.nav-animated .nav-link.active::after {
  width: 100%;
}

.nav-animated .nav-link:hover {
  color: var(--color-primary);
}

.nav-animated .nav-link.active {
  color: var(--color-primary);
}
    `.trim(),
  },

  // ============================================================================
  // MODAL COMPONENTS (4 variants)
  // ============================================================================

  {
    id: 'modal-flat',
    name: 'Modal - Flat',
    category: 'modal' as ComponentCategory,
    style: 'flat' as ComponentStyle,
    description: 'Minimal flat modal dialog with fade and scale entrance animation.',
    tags: ['modal', 'dialog', 'flat', 'overlay', 'popup'],
    animationLevel: 'medium',
    html: `
<div class="modal-backdrop modal-flat-backdrop" role="presentation">
  <div class="modal modal-flat" role="dialog" aria-labelledby="modal-title">
    <div class="modal-header">
      <h2 id="modal-title" class="modal-title">Modal Title</h2>
      <button class="modal-close" aria-label="Close modal">×</button>
    </div>
    <div class="modal-body">
      <p>Modal content goes here.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
    `.trim(),
    css: `
.modal-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-base);
}

.modal-backdrop.active {
  opacity: 1;
  pointer-events: auto;
}

.modal {
  background-color: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.modal-backdrop.active .modal {
  opacity: 1;
  transform: translateY(0);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-neutral-200);
}

.modal-title {
  font-size: var(--fs-h3);
  color: var(--color-neutral-900);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--fs-h2);
  color: var(--color-neutral-700);
  cursor: pointer;
  padding: 0;
  transition: color var(--transition-fast);
}

.modal-close:hover {
  color: var(--color-neutral-900);
}

.modal-body {
  padding: var(--space-lg);
  color: var(--color-neutral-700);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid var(--color-neutral-200);
}
    `.trim(),
  },

  {
    id: 'modal-glass',
    name: 'Modal - Glassmorphic',
    category: 'modal' as ComponentCategory,
    style: 'glassmorphic' as ComponentStyle,
    description: 'Glassmorphic modal with backdrop blur and transparent panel effect.',
    tags: ['modal', 'glass', 'blur', 'modern', 'dialog'],
    animationLevel: 'high',
    html: `
<div class="modal-backdrop modal-glass-backdrop" role="presentation">
  <div class="modal modal-glass" role="dialog" aria-labelledby="modal-title-2">
    <div class="modal-header">
      <h2 id="modal-title-2" class="modal-title">Modal Title</h2>
      <button class="modal-close" aria-label="Close modal">×</button>
    </div>
    <div class="modal-body">
      <p>Modal content goes here.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
    `.trim(),
    css: `
.modal-glass-backdrop {
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.modal-glass {
  background-color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
}

.modal-glass .modal-header {
  border-bottom-color: rgba(255, 255, 255, 0.15);
}

.modal-glass .modal-footer {
  border-top-color: rgba(255, 255, 255, 0.15);
}

.modal-backdrop.active .modal-glass {
  animation: modal-glass-enter var(--transition-spring) forwards;
}

@keyframes modal-glass-enter {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
    `.trim(),
  },

  {
    id: 'modal-gradient',
    name: 'Modal - Gradient',
    category: 'modal' as ComponentCategory,
    style: 'gradient' as ComponentStyle,
    description: 'Gradient modal with vibrant color background for stylish dialogs.',
    tags: ['modal', 'gradient', 'colorful', 'vibrant', 'dialog'],
    animationLevel: 'high',
    html: `
<div class="modal-backdrop modal-gradient-backdrop" role="presentation">
  <div class="modal modal-gradient" role="dialog" aria-labelledby="modal-title-3">
    <div class="modal-header">
      <h2 id="modal-title-3" class="modal-title">Modal Title</h2>
      <button class="modal-close" aria-label="Close modal">×</button>
    </div>
    <div class="modal-body">
      <p>Modal content goes here.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
    `.trim(),
    css: `
.modal-gradient {
  background-color: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-gradient .modal-header {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border-bottom: none;
}

.modal-gradient .modal-title {
  color: white;
}

.modal-gradient .modal-close {
  color: white;
}

.modal-gradient .modal-close:hover {
  opacity: 0.8;
}

.modal-backdrop.active .modal-gradient {
  animation: modal-scale-enter var(--transition-spring) forwards;
}

@keyframes modal-scale-enter {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
    `.trim(),
  },

  {
    id: 'modal-animated',
    name: 'Modal - Animated',
    category: 'modal' as ComponentCategory,
    style: 'animated' as ComponentStyle,
    description: 'Animated modal with spring bounce and slide entrance effects.',
    tags: ['modal', 'animated', 'bounce', 'dynamic', 'dialog'],
    animationLevel: 'high',
    html: `
<div class="modal-backdrop modal-animated-backdrop" role="presentation">
  <div class="modal modal-animated" role="dialog" aria-labelledby="modal-title-4">
    <div class="modal-header">
      <h2 id="modal-title-4" class="modal-title">Modal Title</h2>
      <button class="modal-close" aria-label="Close modal">×</button>
    </div>
    <div class="modal-body">
      <p>Modal content goes here.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
    `.trim(),
    css: `
.modal-animated-backdrop {
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-base);
}

.modal-animated-backdrop.active {
  animation: backdrop-fade-in var(--transition-base) forwards;
}

@keyframes backdrop-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.modal-animated {
  background-color: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
  opacity: 0;
  transform: scale(0.95);
}

.modal-animated-backdrop.active .modal-animated {
  animation: modal-spring-in var(--transition-spring) forwards;
}

@keyframes modal-spring-in {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  70% {
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-animated .modal-header {
  border-bottom: 1px solid var(--color-neutral-200);
}

.modal-animated .modal-footer {
  border-top: 1px solid var(--color-neutral-200);
}
    `.trim(),
  },

  // ============================================================================
  // DROPDOWN COMPONENTS (4 variants)
  // ============================================================================

  {
    id: 'dropdown-flat',
    name: 'Dropdown - Flat',
    category: 'dropdown' as ComponentCategory,
    style: 'flat' as ComponentStyle,
    description: 'Minimal flat dropdown menu with smooth fade and slide animation.',
    tags: ['dropdown', 'menu', 'select', 'flat', 'list'],
    animationLevel: 'medium',
    html: `
<div class="dropdown-container">
  <button class="dropdown-trigger" aria-haspopup="true" aria-expanded="false">
    Options
  </button>
  <ul class="dropdown dropdown-flat" role="menu">
    <li><a href="#" role="menuitem">Option 1</a></li>
    <li><a href="#" role="menuitem">Option 2</a></li>
    <li><a href="#" role="menuitem">Option 3</a></li>
  </ul>
</div>
    `.trim(),
    css: `
.dropdown-container {
  position: relative;
  display: inline-block;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background-color: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  list-style: none;
  margin-top: var(--space-sm);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition: opacity var(--transition-base), transform var(--transition-base);
  padding: var(--space-sm) 0;
}

.dropdown.active {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.dropdown-flat li a {
  display: block;
  padding: var(--space-sm) var(--space-md);
  color: var(--color-neutral-700);
  transition: background-color var(--transition-fast);
}

.dropdown-flat li a:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-primary);
}
    `.trim(),
  },

  {
    id: 'dropdown-glass',
    name: 'Dropdown - Glassmorphic',
    category: 'dropdown' as ComponentCategory,
    style: 'glassmorphic' as ComponentStyle,
    description: 'Glassmorphic dropdown with backdrop blur and translucent panel.',
    tags: ['dropdown', 'glass', 'blur', 'modern', 'menu'],
    animationLevel: 'high',
    html: `
<div class="dropdown-container">
  <button class="dropdown-trigger" aria-haspopup="true" aria-expanded="false">
    Options
  </button>
  <ul class="dropdown dropdown-glass" role="menu">
    <li><a href="#" role="menuitem">Option 1</a></li>
    <li><a href="#" role="menuitem">Option 2</a></li>
    <li><a href="#" role="menuitem">Option 3</a></li>
  </ul>
</div>
    `.trim(),
    css: `
.dropdown-glass {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow-lg);
}

.dropdown-glass li a {
  display: block;
  padding: var(--space-sm) var(--space-md);
  color: var(--color-neutral-700);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.dropdown-glass li a:hover {
  background-color: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
}

.dropdown.active.dropdown-glass {
  animation: dropdown-slide-down var(--transition-spring) forwards;
}

@keyframes dropdown-slide-down {
  0% {
    opacity: 0;
    transform: translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
    `.trim(),
  },

  {
    id: 'dropdown-gradient',
    name: 'Dropdown - Gradient',
    category: 'dropdown' as ComponentCategory,
    style: 'gradient' as ComponentStyle,
    description: 'Gradient dropdown with vibrant color background for options menu.',
    tags: ['dropdown', 'gradient', 'colorful', 'menu', 'select'],
    animationLevel: 'high',
    html: `
<div class="dropdown-container">
  <button class="dropdown-trigger" aria-haspopup="true" aria-expanded="false">
    Options
  </button>
  <ul class="dropdown dropdown-gradient" role="menu">
    <li><a href="#" role="menuitem">Option 1</a></li>
    <li><a href="#" role="menuitem">Option 2</a></li>
    <li><a href="#" role="menuitem">Option 3</a></li>
  </ul>
</div>
    `.trim(),
    css: `
.dropdown-gradient {
  background-color: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  box-shadow: var(--shadow-lg);
}

.dropdown-gradient li a {
  display: block;
  padding: var(--space-sm) var(--space-md);
  color: var(--color-neutral-700);
  transition: all var(--transition-base);
}

.dropdown-gradient li a:hover {
  background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.15), rgba(var(--color-secondary-rgb), 0.1));
  color: var(--color-primary);
}

.dropdown.active.dropdown-gradient {
  animation: dropdown-fade-slide var(--transition-base) forwards;
}

@keyframes dropdown-fade-slide {
  0% {
    opacity: 0;
    transform: translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
    `.trim(),
  },

  {
    id: 'dropdown-animated',
    name: 'Dropdown - Animated',
    category: 'dropdown' as ComponentCategory,
    style: 'animated' as ComponentStyle,
    description: 'Animated dropdown with spring bounce and staggered item reveal.',
    tags: ['dropdown', 'animated', 'bounce', 'dynamic', 'menu'],
    animationLevel: 'high',
    html: `
<div class="dropdown-container">
  <button class="dropdown-trigger" aria-haspopup="true" aria-expanded="false">
    Options
  </button>
  <ul class="dropdown dropdown-animated" role="menu">
    <li><a href="#" role="menuitem">Option 1</a></li>
    <li><a href="#" role="menuitem">Option 2</a></li>
    <li><a href="#" role="menuitem">Option 3</a></li>
  </ul>
</div>
    `.trim(),
    css: `
.dropdown-animated {
  background-color: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-sm) 0;
}

.dropdown-animated li {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown.active.dropdown-animated {
  animation: dropdown-enter var(--transition-base) forwards;
}

.dropdown.active.dropdown-animated li:nth-child(1) {
  animation: dropdown-item-enter var(--transition-base) 0ms forwards;
}

.dropdown.active.dropdown-animated li:nth-child(2) {
  animation: dropdown-item-enter var(--transition-base) 100ms forwards;
}

.dropdown.active.dropdown-animated li:nth-child(3) {
  animation: dropdown-item-enter var(--transition-base) 200ms forwards;
}

@keyframes dropdown-enter {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes dropdown-item-enter {
  0% {
    opacity: 0;
    transform: translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-animated li a {
  display: block;
  padding: var(--space-sm) var(--space-md);
  color: var(--color-neutral-700);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.dropdown-animated li a:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-primary);
}
    `.trim(),
  },
];
