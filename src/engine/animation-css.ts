/**
 * Shared Animation CSS — Single source of truth for scroll animation classes.
 *
 * Used by both scaffold-project.ts and generate-full-page.ts to ensure
 * the CSS class names always match the JS classList.add() calls.
 *
 * IMPORTANT: The JS animations handler adds the class `visible` (not `is-visible`).
 * All CSS selectors here must use `.visible` to match.
 */

/**
 * Base scroll animation CSS — entrance animations triggered by Intersection Observer.
 * Includes: .animate-on-scroll, .animate-from-left/right, .animate-scale-in, .stagger-children
 */
export function generateBaseAnimationCss(): string {
  return `/* ─── Scroll Entrance Animations ─── */

.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

.animate-from-left {
  opacity: 0;
  transform: translateX(-40px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-from-left.visible {
  opacity: 1;
  transform: translateX(0);
}

.animate-from-right {
  opacity: 0;
  transform: translateX(40px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-from-right.visible {
  opacity: 1;
  transform: translateX(0);
}

.animate-scale-in {
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-scale-in.visible {
  opacity: 1;
  transform: scale(1);
}

/* Staggered children animation */
.stagger-children > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
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
}`;
}

/**
 * Hero entrance animation CSS — staggered fade-in for hero content children.
 */
export function generateHeroEntranceCss(): string {
  return `/* Hero entrance animations */
.hero-content > * {
  animation: fadeInUp 0.8s var(--ease-out-expo) both;
}
.hero-content > *:nth-child(1) { animation-delay: 0.1s; }
.hero-content > *:nth-child(2) { animation-delay: 0.25s; }
.hero-content > *:nth-child(3) { animation-delay: 0.4s; }
.hero-content > *:nth-child(4) { animation-delay: 0.55s; }`;
}

/**
 * Animations JS handler — Intersection Observer that adds `visible` class on scroll.
 * Must use class name `visible` to match the CSS selectors above.
 */
export function generateAnimationsJs(): string {
  return `/**
 * Animation Handler
 * Manages scroll-triggered entrance animations using Intersection Observer
 */

const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Only animate once
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('.animate-on-scroll, .animate-from-left, .animate-from-right, .animate-scale-in, .stagger-children').forEach(el => {
  observer.observe(el);
});`;
}
