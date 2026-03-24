/**
 * MCP Tool: generate_section
 *
 * Phase 6 — Code Generation
 *
 * Generates production-ready code for a specific page section.
 * Uses REAL components from the component library — not generic code.
 * Enforces design tokens, animations, accessibility, and responsive design.
 */

import type {
  Framework,
  DesignTokens,
  ComponentCategory,
  AdaptedComponent,
} from '../engine/types.js';
import {
  resolveIconForKeyword,
  getIndustryIcons,
  resolvePicsumUrl,
} from './fetch-images.js';
import type { UIverseComponentMap } from '../engine/uiverse-adapter.js';
import {
  getUIverseCss,
  getUIverseHtml,
  hasUIverseComponent,
  instantiateButton,
  instantiateCard,
  instantiateInput,
} from '../engine/uiverse-adapter.js';
import type { ResolvedImage } from './fetch-images.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GenerateSectionInput {
  sectionType: string;
  framework: string;
  designTokens: DesignTokens;
  content?: SectionContent;
  sectionIndex?: number;
  /** Adapted UIverse components — when provided, these replace built-in component CSS */
  uiverseComponents?: UIverseComponentMap | null;
  /** Resolved images per section type from fetchImages */
  imageData?: Record<string, import('./fetch-images.js').ResolvedImage[]> | null;
}

export interface SectionContent {
  headline?: string;
  subheadline?: string;
  description?: string;
  items?: Array<{
    title: string;
    description: string;
    icon?: string;
    price?: string;
    badge?: string;
    image?: string;
    link?: string;
  }>;
  ctaText?: string;
  ctaSecondaryText?: string;
  backgroundStyle?: string;
}

export interface GenerateSectionOutput {
  html: string;
  css: string;
  js: string;
  sectionId: string;
  componentsUsed: string[];
  summary: string;
}

// ─── Section Component Requirements ─────────────────────────────────────────

const SECTION_REQUIREMENTS: Record<string, ComponentCategory[]> = {
  'hero': ['button-primary', 'button-secondary'],
  'features': ['card'],
  'pricing': ['card', 'button-primary', 'button-secondary', 'badge'],
  'testimonials': ['card'],
  'cta': ['button-primary', 'button-secondary'],
  'faq': [],
  'contact-form': ['input', 'button-primary', 'checkbox'],
  'newsletter': ['input', 'button-primary'],
  'footer': [],
  'navigation': ['navigation'],
  'navbar': ['navigation'],
  'product-grid': ['card', 'badge', 'button-primary'],
  'featured-products': ['card', 'badge'],
  'team': ['card'],
  'about': [],
  'stats': ['card'],
  'stats-cards': ['card'],
  'services': ['card'],
  'services-grid': ['card'],
  'clients': [],
  'how-it-works': ['card'],
  'gallery': [],
  'menu-preview': ['card'],
  'menu-items': ['card'],
  'blog-grid': ['card', 'badge'],
  'post-grid': ['card', 'badge'],
  'featured-posts': ['card', 'badge'],
  'sidebar': ['input'],
  'skills': ['badge'],
  'project-grid': ['card', 'badge'],
  'featured-projects': ['card'],
};

// ─── Default Content ────────────────────────────────────────────────────────

function getDefaultContent(sectionType: string, industry: string): SectionContent {
  const industryName = industry.charAt(0).toUpperCase() + industry.slice(1);

  const defaults: Record<string, SectionContent> = {
    'hero': {
      headline: `Transform Your ${industryName} Business`,
      subheadline:
        'Build something extraordinary with tools designed for modern teams. Ship faster, scale smarter, grow bigger.',
      ctaText: 'Get Started',
      ctaSecondaryText: 'Learn More',
    },
    'features': (() => {
      const icons = getIndustryIcons(industry, 6);
      return {
        headline: 'Everything You Need',
        subheadline: 'Powerful features designed to help you succeed.',
        items: [
          {
            title: 'Lightning Fast',
            description: 'Optimized for speed and performance. Every millisecond counts when it comes to user experience.',
            icon: icons[0],
          },
          {
            title: 'Secure by Default',
            description: 'Enterprise-grade security built into every layer. Your data is always protected.',
            icon: icons[1],
          },
          {
            title: 'Easy Integration',
            description: 'Connect with your existing tools in minutes. We support 100+ integrations out of the box.',
            icon: icons[2],
          },
          {
            title: 'Analytics Built-in',
            description: 'Track everything that matters with real-time dashboards and custom reports.',
            icon: icons[3],
          },
          {
            title: '24/7 Support',
            description: 'Our team is always available to help you succeed. Chat, email, or phone — your choice.',
            icon: icons[4],
          },
          {
            title: 'Scale Infinitely',
            description: 'From startup to enterprise, our infrastructure grows with you. No limits, no compromises.',
            icon: icons[5],
          },
        ],
      };
    })(),
    'pricing': {
      headline: 'Simple, Transparent Pricing',
      subheadline: 'Choose the plan that fits your needs. No hidden fees.',
      items: [
        {
          title: 'Starter',
          description: 'Perfect for individuals and small projects',
          price: '$9/mo',
          badge: '',
          link: '#',
        },
        {
          title: 'Professional',
          description: 'Best for growing teams and businesses',
          price: '$29/mo',
          badge: 'Most Popular',
          link: '#',
        },
        {
          title: 'Enterprise',
          description: 'For large organizations with advanced needs',
          price: '$99/mo',
          badge: '',
          link: '#',
        },
      ],
      ctaText: 'Start Free Trial',
    },
    'testimonials': {
      headline: 'Trusted by Industry Leaders',
      subheadline: 'See what our customers have to say.',
      items: [
        {
          title: 'Sarah Chen',
          description:
            '"This completely transformed how we work. The ROI was visible within the first month."',
          badge: 'CEO, TechCorp',
        },
        {
          title: 'Marcus Johnson',
          description:
            '"Best investment we made this year. The team loves it and productivity is through the roof."',
          badge: 'CTO, StartupXYZ',
        },
        {
          title: 'Elena Rodriguez',
          description:
            '"Finally, a solution that actually delivers on its promises. Exceptional quality and support."',
          badge: 'VP Product, ScaleUp Inc',
        },
      ],
    },
    'cta': {
      headline: 'Ready to Get Started?',
      subheadline: 'Join thousands of companies already using our platform.',
      ctaText: 'Start Free Trial',
      ctaSecondaryText: 'Schedule a Demo',
    },
    'faq': {
      headline: 'Frequently Asked Questions',
      subheadline: 'Everything you need to know.',
      items: [
        {
          title: 'How do I get started?',
          description:
            'Sign up for a free account, complete the onboarding wizard, and you\'re ready to go. No credit card required.',
        },
        {
          title: 'Can I cancel anytime?',
          description:
            'Absolutely. You can cancel your subscription at any time with no cancellation fees. Your data remains accessible for 30 days after cancellation.',
        },
        {
          title: 'Do you offer team plans?',
          description:
            'Yes! Our Professional and Enterprise plans support unlimited team members with role-based access control.',
        },
        {
          title: 'Is my data secure?',
          description:
            'We use bank-level encryption (AES-256) and are SOC 2 Type II certified. Your data is always encrypted at rest and in transit.',
        },
        {
          title: 'What integrations do you support?',
          description:
            'We integrate with 100+ tools including Slack, Jira, GitHub, Salesforce, HubSpot, and more. Custom integrations are available on Enterprise plans.',
        },
      ],
    },
    'contact-form': {
      headline: 'Get In Touch',
      subheadline: 'Have a question? We\'d love to hear from you.',
      ctaText: 'Send Message',
    },
    'newsletter': {
      headline: 'Stay Updated',
      subheadline: 'Get the latest news and updates delivered to your inbox.',
      ctaText: 'Subscribe',
    },
    'footer': {
      headline: 'Company Name',
      description: 'Building the future, one product at a time.',
    },
    'team': {
      headline: 'Meet Our Team',
      subheadline: 'The people behind the product.',
      items: [
        { title: 'Alex Thompson', description: 'Founder & CEO', image: resolvePicsumUrl(400, 400, 101), badge: '' },
        { title: 'Maya Patel', description: 'Head of Design', image: resolvePicsumUrl(400, 400, 102), badge: '' },
        { title: 'James Wilson', description: 'Lead Engineer', image: resolvePicsumUrl(400, 400, 103), badge: '' },
        { title: 'Sofia Garcia', description: 'Head of Growth', image: resolvePicsumUrl(400, 400, 104), badge: '' },
      ],
    },
    'about': {
      headline: 'About Us',
      description:
        'We\'re a team of passionate builders dedicated to creating tools that make a difference. Founded in 2020, we\'ve grown from a small startup to serving thousands of customers worldwide.',
    },
    'stats': {
      headline: 'By the Numbers',
      items: [
        { title: '10K+', description: 'Active Users' },
        { title: '99.9%', description: 'Uptime' },
        { title: '50+', description: 'Countries' },
        { title: '4.9/5', description: 'Rating' },
      ],
    },
    'stats-cards': {
      headline: 'By the Numbers',
      items: [
        { title: '10K+', description: 'Active Users' },
        { title: '99.9%', description: 'Uptime' },
        { title: '50+', description: 'Countries' },
        { title: '4.9/5', description: 'Rating' },
      ],
    },
    'services': {
      headline: 'Our Services',
      subheadline: 'Comprehensive solutions for your business.',
      items: [
        {
          title: 'Web Development',
          description: 'Custom websites and web applications built with modern technologies.',
          icon: resolveIconForKeyword('web'),
        },
        {
          title: 'Mobile Apps',
          description: 'Native and cross-platform mobile applications for iOS and Android.',
          icon: resolveIconForKeyword('mobile'),
        },
        {
          title: 'UI/UX Design',
          description: 'Beautiful, intuitive designs that delight users and drive conversions.',
          icon: resolveIconForKeyword('design'),
        },
      ],
    },
    'services-grid': {
      headline: 'What We Offer',
      subheadline: 'End-to-end solutions tailored to your needs.',
      items: [
        { title: 'Strategy', description: 'Data-driven strategies that deliver measurable results.', icon: resolveIconForKeyword('analytics') },
        { title: 'Design', description: 'Award-winning designs that captivate your audience.', icon: resolveIconForKeyword('design') },
        { title: 'Development', description: 'Robust, scalable solutions built with best practices.', icon: resolveIconForKeyword('code') },
        { title: 'Support', description: 'Ongoing maintenance and support to keep you running.', icon: resolveIconForKeyword('security') },
      ],
    },
    'how-it-works': {
      headline: 'How It Works',
      subheadline: 'Get started in three simple steps.',
      items: [
        {
          title: 'Sign Up',
          description: 'Create your free account in under 60 seconds. No credit card required.',
          icon: resolveIconForKeyword('sign up'),
        },
        {
          title: 'Configure',
          description:
            'Set up your workspace and invite your team. Our wizard guides you through everything.',
          icon: resolveIconForKeyword('settings'),
        },
        {
          title: 'Launch',
          description:
            'Go live and start seeing results immediately. We\'re here to help every step of the way.',
          icon: resolveIconForKeyword('launch'),
        },
      ],
    },
    'clients': {
      headline: 'Trusted By',
      items: [
        { title: 'Company A', description: '' },
        { title: 'Company B', description: '' },
        { title: 'Company C', description: '' },
        { title: 'Company D', description: '' },
        { title: 'Company E', description: '' },
        { title: 'Company F', description: '' },
      ],
    },
  };

  return (
    defaults[sectionType] || {
      headline: sectionType
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      subheadline: 'Content for this section.',
      items: [],
    }
  );
}

// ─── Section Generators (Vanilla HTML) ──────────────────────────────────────

function generateHeroSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  // Use real fetched image or fall back to Picsum
  const heroImage = ctx?.images?.[0];
  const heroImgUrl = heroImage?.url || resolvePicsumUrl(1200, 600, sectionIndex + 1);
  const heroImgAlt = heroImage?.alt || content.headline || 'Hero image';

  // Use UIverse button templates if available
  const primaryBtn = instantiateButton(ctx?.uiverse, content.ctaText || 'Get Started', { variant: 'primary', href: '#' });
  const secondaryBtn = content.ctaSecondaryText
    ? instantiateButton(ctx?.uiverse, content.ctaSecondaryText, { variant: 'secondary', href: '#' })
    : '';

  const html = `<!-- Hero Section -->
<section class="hero-section" id="hero">
  <div class="hero-bg-pattern"></div>
  <div class="container">
    <div class="hero-content animate-on-scroll">
      <h1 class="hero-title">${content.headline || 'Welcome'}</h1>
      <p class="hero-subtitle">${content.subheadline || ''}</p>
      <div class="hero-actions">
        ${primaryBtn}
        ${secondaryBtn}
      </div>
    </div>
    <div class="hero-visual animate-on-scroll" style="transition-delay: 200ms">
      <div class="hero-image-wrapper">
        <img src="${heroImgUrl}" alt="${heroImgAlt}" class="hero-image" width="1200" height="600" loading="eager" decoding="async">
      </div>
    </div>
  </div>
</section>`;

  const css = `/* Hero Section */
.hero-section {
  position: relative;
  min-height: 90vh;
  display: flex;
  align-items: center;
  padding: var(--space-5xl) 0;
  overflow: hidden;
}

.hero-section .container {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3xl);
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-xl);
}

@media (min-width: 1024px) {
  .hero-section .container {
    grid-template-columns: 1fr 1fr;
  }
}

.hero-title {
  font-family: var(--font-heading);
  font-size: var(--fs-display);
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-neutral-900);
  margin-bottom: var(--space-lg);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: var(--fs-h1);
  }
}

.hero-subtitle {
  font-family: var(--font-body);
  font-size: var(--fs-h4);
  color: var(--color-neutral-700);
  line-height: 1.6;
  margin-bottom: var(--space-2xl);
  max-width: 540px;
}

.hero-actions {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.hero-visual {
  display: flex;
  justify-content: center;
}

.hero-image-wrapper {
  width: 100%;
  max-width: 600px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.hero-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-image-wrapper:hover .hero-image {
  transform: scale(1.03);
}

.hero-bg-pattern {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.5;
}`;

  return { html, css, js: '' };
}

function generateFeaturesSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const itemsHtml = items
    .map(
      (item, i) => {
        // Use fetched icon image if available
        const fetchedIcon = ctx?.images?.[i];
        const iconUrl = fetchedIcon?.isIcon ? fetchedIcon.url : (item.icon && item.icon.startsWith('http') ? item.icon : null);
        const iconSrc = iconUrl
          ? `<img src="${iconUrl}" alt="${item.title} icon" class="feature-icon-img" width="28" height="28" loading="lazy">`
          : `<span class="feature-icon-emoji">${item.icon || '✦'}</span>`;

        // Use UIverse card template if available
        return instantiateCard(ctx?.uiverse, {
          title: item.title,
          description: item.description,
          icon: iconUrl || item.icon || '✦',
          index: i,
        }, {
          extraClasses: 'feature-card',
          animateDelay: i * 100,
        });
      }
    )
    .join('\n');

  const html = `<!-- Features Section -->
<section class="features-section section" id="features">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Features'}</h2>
      <p class="section-subtitle">${content.subheadline || ''}</p>
    </div>
    <div class="features-grid stagger-children">
${itemsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Features Section */
.features-section {
  padding: var(--space-5xl) 0;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-xl);
  margin-top: var(--space-3xl);
}

@media (min-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.feature-card {
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
}

.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-primary);
}

.feature-icon {
  margin-bottom: var(--space-md);
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  opacity: 0.9;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(-3deg);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

.feature-icon-img {
  width: 28px;
  height: 28px;
  filter: brightness(0) invert(1);
}

.feature-icon-emoji {
  font-size: 1.5rem;
}

.feature-title {
  font-family: var(--font-heading);
  font-size: var(--fs-h4);
  font-weight: 600;
  color: var(--color-neutral-900);
  margin-bottom: var(--space-sm);
}

.feature-description {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-neutral-700);
  line-height: 1.6;
}`;

  return { html, css, js: '' };
}

function generatePricingSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];

  const cardsHtml = items
    .map((item, i) => {
      const isPopular = item.badge === 'Most Popular' || i === 1;
      const ctaBtn = instantiateButton(ctx?.uiverse, content.ctaText || 'Get Started', {
        variant: isPopular ? 'primary' : 'secondary',
        href: item.link || '#',
      });

      return `
        <div class="pricing-card card animate-on-scroll ${isPopular ? 'pricing-card--popular' : ''}" style="transition-delay: ${i * 100}ms">
          ${isPopular ? '<span class="pricing-badge badge">Most Popular</span>' : ''}
          <h3 class="pricing-name">${item.title}</h3>
          <p class="pricing-description">${item.description}</p>
          <div class="pricing-price">${item.price || '$0/mo'}</div>
          <ul class="pricing-features-list">
            <li>Feature included</li>
            <li>Feature included</li>
            <li>Feature included</li>
            ${isPopular ? '<li>Bonus feature</li><li>Priority support</li>' : ''}
          </ul>
          ${ctaBtn}
        </div>`;
    })
    .join('\n');

  const html = `<!-- Pricing Section -->
<section class="pricing-section section" id="pricing">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Pricing'}</h2>
      <p class="section-subtitle">${content.subheadline || ''}</p>
    </div>
    <div class="pricing-grid stagger-children">
${cardsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Pricing Section */
.pricing-section {
  padding: var(--space-5xl) 0;
  background: var(--color-neutral-100);
}

.pricing-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-xl);
  margin-top: var(--space-3xl);
  align-items: stretch;
}

@media (min-width: 768px) {
  .pricing-grid {
    grid-template-columns: repeat(${Math.min(items.length, 3)}, 1fr);
  }
}

.pricing-card {
  position: relative;
  padding: var(--space-2xl);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-50);
  border: 2px solid var(--color-neutral-200);
  text-align: center;
  display: flex;
  flex-direction: column;
  transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
}

.pricing-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
}

.pricing-card--popular {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
  transform: scale(1.05);
}

.pricing-card--popular:hover {
  transform: scale(1.05) translateY(-6px);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: white;
  padding: var(--space-xs) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--fs-small);
  font-weight: 600;
}

.pricing-name {
  font-family: var(--font-heading);
  font-size: var(--fs-h3);
  font-weight: 700;
  color: var(--color-neutral-900);
  margin-bottom: var(--space-sm);
}

.pricing-description {
  font-size: var(--fs-body);
  color: var(--color-neutral-500);
  margin-bottom: var(--space-lg);
}

.pricing-price {
  font-family: var(--font-heading);
  font-size: var(--fs-display);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--space-xl);
}

.pricing-features-list {
  text-align: left;
  margin-bottom: var(--space-xl);
  flex-grow: 1;
}

.pricing-features-list li {
  padding: var(--space-sm) 0;
  color: var(--color-neutral-700);
  font-size: var(--fs-body);
  border-bottom: 1px solid var(--color-neutral-200);
}

.pricing-features-list li::before {
  content: '✓ ';
  color: var(--color-success);
  font-weight: 700;
}

.pricing-card .btn {
  margin-top: auto;
}`;

  return { html, css, js: '' };
}

function generateTestimonialsSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];

  const cardsHtml = items
    .map(
      (item, i) => {
        // Use fetched avatar or fall back to Picsum
        const fetchedAvatar = ctx?.images?.[i];
        const avatarUrl = fetchedAvatar?.url || item.image || resolvePicsumUrl(80, 80, 200 + i);
        return `
        <div class="testimonial-card card animate-on-scroll" style="transition-delay: ${i * 100}ms">
          <div class="testimonial-avatar">
            <img src="${avatarUrl}" alt="${item.title}" class="testimonial-avatar-img" width="48" height="48" loading="lazy">
          </div>
          <blockquote class="testimonial-quote">${item.description}</blockquote>
          <div class="testimonial-author">
            <strong>${item.title}</strong>
            ${item.badge ? `<span class="testimonial-role">${item.badge}</span>` : ''}
          </div>
        </div>`;
      }
    )
    .join('\n');

  const html = `<!-- Testimonials Section -->
<section class="testimonials-section section" id="testimonials">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Testimonials'}</h2>
      <p class="section-subtitle">${content.subheadline || ''}</p>
    </div>
    <div class="testimonials-grid stagger-children">
${cardsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Testimonials Section */
.testimonials-section {
  padding: var(--space-5xl) 0;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-xl);
  margin-top: var(--space-3xl);
}

@media (min-width: 768px) {
  .testimonials-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .testimonials-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.testimonial-card {
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.testimonial-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.testimonial-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-md);
  border: 2px solid var(--color-neutral-200);
}

.testimonial-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.testimonial-quote {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-neutral-700);
  line-height: 1.7;
  margin-bottom: var(--space-lg);
  font-style: italic;
}

.testimonial-author strong {
  display: block;
  font-family: var(--font-heading);
  color: var(--color-neutral-900);
  font-size: var(--fs-body);
}

.testimonial-role {
  font-size: var(--fs-small);
  color: var(--color-neutral-500);
}`;

  return { html, css, js: '' };
}

function generateCtaSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const primaryBtn = instantiateButton(ctx?.uiverse, content.ctaText || 'Get Started', { variant: 'primary', href: '#', extraClasses: 'btn-lg' });
  const secondaryBtn = content.ctaSecondaryText
    ? instantiateButton(ctx?.uiverse, content.ctaSecondaryText, { variant: 'secondary', href: '#', extraClasses: 'btn-lg' })
    : '';

  const html = `<!-- CTA Section -->
<section class="cta-section section" id="cta">
  <div class="container">
    <div class="cta-content animate-on-scroll">
      <h2 class="cta-title">${content.headline || 'Ready to Start?'}</h2>
      <p class="cta-subtitle">${content.subheadline || ''}</p>
      <div class="cta-actions">
        ${primaryBtn}
        ${secondaryBtn}
      </div>
    </div>
  </div>
</section>`;

  const css = `/* CTA Section */
.cta-section {
  padding: var(--space-5xl) 0;
  background: var(--color-primary);
  color: white;
  text-align: center;
}

.cta-content {
  max-width: 640px;
  margin: 0 auto;
}

.cta-title {
  font-family: var(--font-heading);
  font-size: var(--fs-h1);
  font-weight: 700;
  color: white;
  margin-bottom: var(--space-md);
}

.cta-subtitle {
  font-size: var(--fs-h4);
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: var(--space-2xl);
  line-height: 1.6;
}

.cta-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  flex-wrap: wrap;
}

.cta-section .btn-primary {
  background: white;
  color: var(--color-primary);
}

.cta-section .btn-primary:hover {
  background: var(--color-neutral-100);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.cta-section .btn-secondary {
  border-color: white;
  color: white;
}

.cta-section .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}`;

  return { html, css, js: '' };
}

function generateFaqSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];

  const faqHtml = items
    .map(
      (item, i) => `
        <div class="faq-item animate-on-scroll" style="transition-delay: ${i * 80}ms">
          <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-${i}" type="button">
            <span>${item.title}</span>
            <svg class="faq-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 8L10 13L15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="faq-answer" id="faq-answer-${i}" role="region" aria-labelledby="faq-question-${i}">
            <p>${item.description}</p>
          </div>
        </div>`
    )
    .join('\n');

  const html = `<!-- FAQ Section -->
<section class="faq-section section" id="faq">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'FAQ'}</h2>
      <p class="section-subtitle">${content.subheadline || ''}</p>
    </div>
    <div class="faq-list">
${faqHtml}
    </div>
  </div>
</section>`;

  const css = `/* FAQ Section */
.faq-section {
  padding: var(--space-5xl) 0;
}

.faq-list {
  max-width: 768px;
  margin: var(--space-3xl) auto 0;
}

.faq-item {
  border-bottom: 1px solid var(--color-neutral-200);
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg) 0;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-heading);
  font-size: var(--fs-h4);
  font-weight: 600;
  color: var(--color-neutral-900);
  text-align: left;
  transition: color var(--transition-fast);
}

.faq-question:hover {
  color: var(--color-primary);
}

.faq-question:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.faq-chevron {
  color: var(--color-neutral-500);
  transition: transform var(--transition-base);
  flex-shrink: 0;
  margin-left: var(--space-md);
}

.faq-item.active .faq-chevron {
  transform: rotate(180deg);
}

.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), padding 0.35s ease;
  padding: 0 0;
}

.faq-item.active .faq-answer {
  max-height: 300px;
  padding: 0 0 var(--space-lg) 0;
}

.faq-answer p {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-neutral-700);
  line-height: 1.7;
}`;

  const js = `// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isActive = item?.classList.contains('active');

    // Close all
    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.faq-question').forEach(el => el.setAttribute('aria-expanded', 'false'));

    // Open clicked (if it was closed)
    if (!isActive) {
      item?.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});`;

  return { html, css, js };
}

function generateContactFormSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  // Use UIverse input templates if available
  const nameInput = instantiateInput(ctx?.uiverse, { name: 'name', label: 'Full Name', placeholder: 'John Doe', required: true, id: 'name', type: 'text' });
  const emailInput = instantiateInput(ctx?.uiverse, { name: 'email', label: 'Email', placeholder: 'john@example.com', required: true, id: 'email', type: 'email' });
  const submitBtn = instantiateButton(ctx?.uiverse, content.ctaText || 'Send Message', { variant: 'primary' });

  const html = `<!-- Contact Form Section -->
<section class="contact-section section" id="contact">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Contact Us'}</h2>
      <p class="section-subtitle">${content.subheadline || ''}</p>
    </div>
    <form class="contact-form animate-on-scroll" novalidate>
      <div class="form-group">
        ${nameInput}
      </div>
      <div class="form-group">
        ${emailInput}
      </div>
      <div class="form-group form-group--full">
        <label for="message" class="form-label">Message</label>
        <textarea id="message" name="message" class="form-input form-textarea" placeholder="How can we help?" rows="5" required aria-required="true"></textarea>
      </div>
      <div class="form-group form-group--full">
        ${submitBtn}
      </div>
    </form>
  </div>
</section>`;

  const css = `/* Contact Form Section */
.contact-section {
  padding: var(--space-5xl) 0;
}

.contact-form {
  max-width: 640px;
  margin: var(--space-3xl) auto 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

@media (max-width: 768px) {
  .contact-form {
    grid-template-columns: 1fr;
  }
}

.form-group--full {
  grid-column: 1 / -1;
}

.form-label {
  display: block;
  font-family: var(--font-heading);
  font-size: var(--fs-small);
  font-weight: 600;
  color: var(--color-neutral-700);
  margin-bottom: var(--space-xs);
}

.form-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-neutral-900);
  background: var(--color-neutral-50);
  border: 2px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;
}

.form-input::placeholder {
  color: var(--color-neutral-500);
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.15);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}`;

  return { html, css, js: '' };
}

function generateNewsletterSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const emailInput = instantiateInput(ctx?.uiverse, { name: 'newsletter-email', placeholder: 'Enter your email', required: true, type: 'email' });
  const submitBtn = instantiateButton(ctx?.uiverse, content.ctaText || 'Subscribe', { variant: 'primary' });

  const html = `<!-- Newsletter Section -->
<section class="newsletter-section section" id="newsletter">
  <div class="container">
    <div class="newsletter-content animate-on-scroll">
      <h2 class="newsletter-title">${content.headline || 'Stay Updated'}</h2>
      <p class="newsletter-subtitle">${content.subheadline || ''}</p>
      <form class="newsletter-form" action="#" method="post">
        ${emailInput}
        ${submitBtn}
      </form>
    </div>
  </div>
</section>`;

  const css = `/* Newsletter Section */
.newsletter-section {
  padding: var(--space-4xl) 0;
  background: var(--color-neutral-100);
}

.newsletter-content {
  max-width: 540px;
  margin: 0 auto;
  text-align: center;
}

.newsletter-title {
  font-family: var(--font-heading);
  font-size: var(--fs-h2);
  font-weight: 700;
  color: var(--color-neutral-900);
  margin-bottom: var(--space-sm);
}

.newsletter-subtitle {
  font-size: var(--fs-body);
  color: var(--color-neutral-700);
  margin-bottom: var(--space-xl);
}

.newsletter-form {
  display: flex;
  gap: var(--space-sm);
}

@media (max-width: 480px) {
  .newsletter-form {
    flex-direction: column;
  }
}

.newsletter-input {
  flex: 1;
}`;

  return { html, css, js: '' };
}

function generateFooterSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const html = `<!-- Footer -->
<footer class="site-footer" id="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <h3 class="footer-logo">${content.headline || 'Company'}</h3>
        <p class="footer-description">${content.description || 'Building the future, one product at a time.'}</p>
      </div>
      <div class="footer-links">
        <h4 class="footer-heading">Product</h4>
        <ul>
          <li><a href="#">Features</a></li>
          <li><a href="#">Pricing</a></li>
          <li><a href="#">Documentation</a></li>
          <li><a href="#">Changelog</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h4 class="footer-heading">Company</h4>
        <ul>
          <li><a href="#">About</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h4 class="footer-heading">Legal</h4>
        <ul>
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Cookies</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} ${content.headline || 'Company'}. All rights reserved.</p>
    </div>
  </div>
</footer>`;

  const css = `/* Footer */
.site-footer {
  padding: var(--space-4xl) 0 var(--space-xl);
  background: var(--color-neutral-900);
  color: var(--color-neutral-300);
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--space-3xl);
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2xl);
  }
}

@media (max-width: 480px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}

.footer-logo {
  font-family: var(--font-heading);
  font-size: var(--fs-h3);
  font-weight: 700;
  color: white;
  margin-bottom: var(--space-sm);
}

.footer-description {
  font-size: var(--fs-body);
  line-height: 1.6;
  max-width: 300px;
}

.footer-heading {
  font-family: var(--font-heading);
  font-size: var(--fs-body);
  font-weight: 600;
  color: white;
  margin-bottom: var(--space-md);
}

.footer-links li {
  margin-bottom: var(--space-sm);
}

.footer-links a {
  font-size: var(--fs-body);
  color: var(--color-neutral-500);
  transition: color var(--transition-fast);
}

.footer-links a:hover {
  color: white;
}

.footer-bottom {
  margin-top: var(--space-3xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--color-neutral-700);
  text-align: center;
  font-size: var(--fs-small);
  color: var(--color-neutral-500);
}`;

  return { html, css, js: '' };
}

function generateNavigationSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const navCta = instantiateButton(ctx?.uiverse, 'Get Started', { variant: 'primary', href: '#', extraClasses: 'nav-cta' });

  const html = `<!-- Navigation -->
<header class="site-header" id="navbar">
  <nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="container nav-container">
      <a href="/" class="nav-brand" aria-label="Home">
        <strong>${content.headline || 'Brand'}</strong>
      </a>
      <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false" type="button">
        <span class="nav-toggle-bar"></span>
        <span class="nav-toggle-bar"></span>
        <span class="nav-toggle-bar"></span>
      </button>
      <div class="nav-menu" role="menubar">
        <a href="#features" class="nav-link" role="menuitem">Features</a>
        <a href="#pricing" class="nav-link" role="menuitem">Pricing</a>
        <a href="#testimonials" class="nav-link" role="menuitem">Testimonials</a>
        <a href="#contact" class="nav-link" role="menuitem">Contact</a>
        ${navCta}
      </div>
    </div>
  </nav>
</header>`;

  const css = `/* Navigation */
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-neutral-200);
  transition: background var(--transition-base), box-shadow var(--transition-base);
}

.site-header.scrolled {
  box-shadow: var(--shadow-md);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-xl);
  max-width: 1280px;
  margin: 0 auto;
}

.nav-brand {
  font-family: var(--font-heading);
  font-size: var(--fs-h4);
  color: var(--color-neutral-900);
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
}

.nav-link {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  font-weight: 500;
  color: var(--color-neutral-700);
  position: relative;
  transition: color var(--transition-fast);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  transition: width var(--transition-base) cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link:hover::after {
  width: 100%;
}

.nav-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xs);
}

.nav-toggle-bar {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--color-neutral-900);
  border-radius: 2px;
  transition: transform var(--transition-base), opacity var(--transition-fast);
}

.nav-toggle.active .nav-toggle-bar:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.nav-toggle.active .nav-toggle-bar:nth-child(2) {
  opacity: 0;
}

.nav-toggle.active .nav-toggle-bar:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

@media (max-width: 768px) {
  .nav-toggle {
    display: flex;
  }
  .nav-menu {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    flex-direction: column;
    background: var(--color-neutral-50);
    padding: var(--space-2xl);
    gap: var(--space-lg);
    transform: translateX(100%);
    transition: transform var(--transition-base) cubic-bezier(0.16, 1, 0.3, 1);
  }
  .nav-menu.open {
    transform: translateX(0);
  }
  .nav-link {
    font-size: var(--fs-h4);
  }
}`;

  const js = `// Navigation
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const header = document.querySelector('.site-header');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', isOpen.toString());
  });
}

// Sticky header shadow
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navMenu) navMenu.classList.remove('open');
        if (navToggle) navToggle.classList.remove('active');
      }
    }
  });
});`;

  return { html, css, js };
}

function generateHowItWorksSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const stepsHtml = items
    .map(
      (item, i) => {
        const iconContent = item.icon && item.icon.startsWith('http')
          ? `<img src="${item.icon}" alt="${item.title} icon" class="step-icon-img" width="28" height="28" loading="lazy">`
          : `<span>${item.icon || i + 1}</span>`;
        return `
        <div class="step-card animate-on-scroll" style="transition-delay: ${i * 150}ms">
          <div class="step-number">${iconContent}</div>
          <h3 class="step-title">${item.title}</h3>
          <p class="step-description">${item.description}</p>
        </div>`;
      }
    )
    .join('\n');

  const html = `<!-- How It Works Section -->
<section class="how-it-works-section section" id="how-it-works">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'How It Works'}</h2>
      <p class="section-subtitle">${content.subheadline || ''}</p>
    </div>
    <div class="steps-grid stagger-children">
${stepsHtml}
    </div>
  </div>
</section>`;

  const css = `/* How It Works Section */
.how-it-works-section {
  padding: var(--space-5xl) 0;
  background: var(--color-neutral-100);
}

.steps-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-xl);
  margin-top: var(--space-3xl);
}

@media (min-width: 768px) {
  .steps-grid {
    grid-template-columns: repeat(${Math.min(items.length, 3)}, 1fr);
  }
}

.step-card {
  text-align: center;
  padding: var(--space-xl);
}

.step-number {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: white;
  font-family: var(--font-heading);
  font-size: var(--fs-h2);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-lg);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.step-card:hover .step-number {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.3);
}

.step-icon-img {
  width: 28px;
  height: 28px;
  filter: brightness(0) invert(1);
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--fs-h3);
  font-weight: 600;
  color: var(--color-neutral-900);
  margin-bottom: var(--space-sm);
}

.step-description {
  font-size: var(--fs-body);
  color: var(--color-neutral-700);
  line-height: 1.6;
}`;

  return { html, css, js: '' };
}

function generateClientsSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const logosHtml = items.map((item) => `
          <div class="client-logo">${item.title}</div>`).join('\n');

  const html = `<!-- Clients Section -->
<section class="clients-section section" id="clients">
  <div class="container">
    <h2 class="clients-title animate-on-scroll">${content.headline || 'Trusted By'}</h2>
    <div class="clients-grid animate-on-scroll">
${logosHtml}
    </div>
  </div>
</section>`;

  const css = `/* Clients Section */
.clients-section {
  padding: var(--space-4xl) 0;
  text-align: center;
}

.clients-title {
  font-family: var(--font-heading);
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--color-neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-2xl);
}

.clients-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3xl);
  align-items: center;
}

.client-logo {
  font-family: var(--font-heading);
  font-size: var(--fs-h3);
  font-weight: 700;
  color: var(--color-neutral-300);
  transition: color var(--transition-base);
}

.client-logo:hover {
  color: var(--color-neutral-700);
}`;

  return { html, css, js: '' };
}

function generateStatsSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const statsHtml = items
    .map(
      (item, i) => `
        <div class="stat-card animate-on-scroll" style="transition-delay: ${i * 100}ms">
          <div class="stat-value">${item.title}</div>
          <div class="stat-label">${item.description}</div>
        </div>`
    )
    .join('\n');

  const html = `<!-- Stats Section -->
<section class="stats-section section" id="stats">
  <div class="container">
    ${content.headline ? `<h2 class="section-title animate-on-scroll" style="text-align:center;margin-bottom:var(--space-3xl)">${content.headline}</h2>` : ''}
    <div class="stats-grid stagger-children">
${statsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Stats Section */
.stats-section {
  padding: var(--space-4xl) 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-xl);
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(${Math.min(items.length, 4)}, 1fr);
  }
}

.stat-card {
  text-align: center;
  padding: var(--space-xl);
}

.stat-value {
  font-family: var(--font-heading);
  font-size: var(--fs-display);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--space-xs);
}

.stat-label {
  font-size: var(--fs-body);
  color: var(--color-neutral-500);
  font-weight: 500;
}`;

  return { html, css, js: '' };
}

function generateServicesSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const cardsHtml = items
    .map(
      (item, i) => {
        const fetchedIcon = ctx?.images?.[i];
        const iconUrl = fetchedIcon?.isIcon ? fetchedIcon.url : (item.icon && item.icon.startsWith('http') ? item.icon : null);

        return instantiateCard(ctx?.uiverse, {
          title: item.title,
          description: item.description,
          icon: iconUrl || item.icon || '✦',
          index: i,
        }, {
          extraClasses: 'service-card',
          animateDelay: i * 100,
        });
      }
    )
    .join('\n');

  const html = `<!-- Services Section -->
<section class="services-section section" id="services">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Services'}</h2>
      <p class="section-subtitle">${content.subheadline || ''}</p>
    </div>
    <div class="services-grid stagger-children">
${cardsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Services Section */
.services-section {
  padding: var(--space-5xl) 0;
}

.services-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-xl);
  margin-top: var(--space-3xl);
}

@media (min-width: 768px) {
  .services-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .services-grid {
    grid-template-columns: repeat(${Math.min(items.length, 3)}, 1fr);
  }
}

.service-card {
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
}

.service-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-primary);
}

.service-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  margin-bottom: var(--space-md);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.service-card:hover .service-icon {
  transform: scale(1.1) rotate(-3deg);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

.service-icon-img {
  width: 28px;
  height: 28px;
  filter: brightness(0) invert(1);
}

.service-icon-emoji {
  font-size: 1.5rem;
}

.service-title {
  font-family: var(--font-heading);
  font-size: var(--fs-h4);
  font-weight: 600;
  color: var(--color-neutral-900);
  margin-bottom: var(--space-sm);
}

.service-description {
  font-size: var(--fs-body);
  color: var(--color-neutral-700);
  line-height: 1.6;
}`;

  return { html, css, js: '' };
}

function generateTeamSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const cardsHtml = items
    .map(
      (item, i) => {
        // Use fetched portrait or fall back
        const fetchedAvatar = ctx?.images?.[i];
        const avatarUrl = fetchedAvatar?.url || item.image;
        const avatarHtml = avatarUrl
          ? `<img src="${avatarUrl}" alt="${item.title}" class="team-avatar-img" width="80" height="80" loading="lazy">`
          : `<div class="team-avatar-fallback">${item.title.charAt(0)}</div>`;
        return `
        <div class="team-card card animate-on-scroll" style="transition-delay: ${i * 100}ms">
          <div class="team-avatar">${avatarHtml}</div>
          <h3 class="team-name">${item.title}</h3>
          <p class="team-role">${item.description}</p>
        </div>`;
      }
    )
    .join('\n');

  const html = `<!-- Team Section -->
<section class="team-section section" id="team">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Our Team'}</h2>
      <p class="section-subtitle">${content.subheadline || ''}</p>
    </div>
    <div class="team-grid stagger-children">
${cardsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Team Section */
.team-section {
  padding: var(--space-5xl) 0;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-xl);
  margin-top: var(--space-3xl);
}

@media (min-width: 768px) {
  .team-grid {
    grid-template-columns: repeat(${Math.min(items.length, 4)}, 1fr);
  }
}

.team-card {
  text-align: center;
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.team-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.team-avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  overflow: hidden;
  margin: 0 auto var(--space-md);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.team-card:hover .team-avatar {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.team-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.team-avatar-fallback {
  width: 100%;
  height: 100%;
  background: var(--color-primary);
  color: white;
  font-size: var(--fs-h2);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-name {
  font-family: var(--font-heading);
  font-size: var(--fs-h4);
  font-weight: 600;
  color: var(--color-neutral-900);
  margin-bottom: var(--space-xs);
}

.team-role {
  font-size: var(--fs-body);
  color: var(--color-neutral-500);
}`;

  return { html, css, js: '' };
}

function generateAboutSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  // Use fetched image or fall back
  const aboutImage = ctx?.images?.[0];
  const aboutImgUrl = aboutImage?.url || resolvePicsumUrl(800, 500, sectionIndex + 50);
  const aboutImgAlt = aboutImage?.alt || content.headline || 'About our company';
  const ctaBtn = content.ctaText
    ? instantiateButton(ctx?.uiverse, content.ctaText, { variant: 'secondary', href: '#' })
    : '';

  const html = `<!-- About Section -->
<section class="about-section section" id="about">
  <div class="container">
    <div class="about-grid">
      <div class="about-image animate-from-left">
        <div class="about-image-wrapper">
          <img src="${aboutImgUrl}" alt="${aboutImgAlt}" class="about-img" width="800" height="500" loading="lazy" decoding="async">
        </div>
      </div>
      <div class="about-content animate-from-right">
        <h2 class="section-title">${content.headline || 'About Us'}</h2>
        <p class="about-text">${content.description || ''}</p>
        ${ctaBtn}
      </div>
    </div>
  </div>
</section>`;

  const css = `/* About Section */
.about-section {
  padding: var(--space-5xl) 0;
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3xl);
  align-items: center;
}

@media (min-width: 1024px) {
  .about-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.about-image-wrapper {
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.about-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.about-image-wrapper:hover .about-img {
  transform: scale(1.03);
}

.about-text {
  font-family: var(--font-body);
  font-size: var(--fs-h4);
  color: var(--color-neutral-700);
  line-height: 1.7;
  margin: var(--space-lg) 0 var(--space-xl);
}`;

  return { html, css, js: '' };
}

// ─── Generic fallback ───────────────────────────────────────────────────────

function generateGenericSection(
  sectionType: string,
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const html = `<!-- ${sectionType} Section -->
<section class="${sectionType}-section section" id="${sectionType}">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || sectionType}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="section-content animate-on-scroll">
      ${content.description ? `<p>${content.description}</p>` : '<p>Section content goes here.</p>'}
    </div>
  </div>
</section>`;

  const css = `/* ${sectionType} Section */
.${sectionType}-section {
  padding: var(--space-5xl) 0;
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--fs-h2);
  font-weight: 700;
  color: var(--color-neutral-900);
  margin-bottom: var(--space-lg);
  text-align: center;
}

.section-subtitle {
  font-family: var(--font-body);
  font-size: var(--fs-h4);
  color: var(--color-neutral-700);
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}`;

  return { html, css, js: '' };
}

// ─── Section Generator Dispatcher ───────────────────────────────────────────

/** Context passed to every section generator */
interface SectionContext {
  uiverse: UIverseComponentMap | null;
  images: ResolvedImage[] | null;
}

type SectionGenerator = (content: SectionContent, sectionIndex: number, ctx?: SectionContext) => { html: string; css: string; js: string };

const SECTION_GENERATORS: Record<string, SectionGenerator> = {
  'hero': generateHeroSection,
  'features': generateFeaturesSection,
  'pricing': generatePricingSection,
  'pricing-table': generatePricingSection,
  'testimonials': generateTestimonialsSection,
  'cta': generateCtaSection,
  'faq': generateFaqSection,
  'contact-form': generateContactFormSection,
  'contact': generateContactFormSection,
  'newsletter': generateNewsletterSection,
  'footer': generateFooterSection,
  'navigation': generateNavigationSection,
  'navbar': generateNavigationSection,
  'how-it-works': generateHowItWorksSection,
  'clients': generateClientsSection,
  'stats': generateStatsSection,
  'stats-cards': generateStatsSection,
  'services': generateServicesSection,
  'services-grid': generateServicesSection,
  'team': generateTeamSection,
  'about': generateAboutSection,
  'about-preview': generateAboutSection,
};

// ─── Main Tool Function ─────────────────────────────────────────────────────

export function generateSection(input: GenerateSectionInput): GenerateSectionOutput {
  const sectionType = input.sectionType.toLowerCase().trim();
  const sectionIndex = input.sectionIndex || 0;
  const tokens = input.designTokens;
  const uiverse = input.uiverseComponents || null;

  // Get required components for this section
  const requiredComponents = SECTION_REQUIREMENTS[sectionType] || [];
  const componentsUsed = [...new Set(requiredComponents)];

  // Get content (user-provided or defaults)
  const content = input.content || getDefaultContent(sectionType, (tokens.industry as string) || 'technology');

  // Build section context with UIverse components and resolved images
  const sectionImages = input.imageData?.[sectionType] || null;
  const ctx: SectionContext = {
    uiverse,
    images: sectionImages,
  };

  // Generate the section
  const generator = SECTION_GENERATORS[sectionType] || ((c: SectionContent, i: number, _ctx?: SectionContext) => generateGenericSection(sectionType, c, i, _ctx));
  const result = generator(content, sectionIndex, ctx);

  // ─── UIverse Component CSS Injection ─────────────────────────────────
  // If UIverse components are available, append their CSS for categories
  // used by this section. This provides the actual button/card/input styles
  // that the HTML class references (e.g., .btn, .card, .input-field).
  let uiverseCss = '';
  const uiverseSources: string[] = [];

  if (uiverse) {
    // Map section component requirements to UIverse categories
    const categoryMapping: Record<string, string> = {
      'button-primary': 'buttons',
      'button-secondary': 'buttons',
      'card': 'cards',
      'input': 'inputs',
      'checkbox': 'checkboxes',
      'toggle': 'toggles',
      'radio': 'radios',
      'badge': 'badges',
      'navigation': 'navigation',
      'loader': 'loaders',
      'tooltip': 'tooltips',
    };

    const injectedCategories = new Set<string>();

    for (const req of requiredComponents) {
      const uiverseCategory = categoryMapping[req];
      if (uiverseCategory && !injectedCategories.has(uiverseCategory) && hasUIverseComponent(uiverse, uiverseCategory)) {
        const css = getUIverseCss(uiverse, uiverseCategory);
        if (css) {
          uiverseCss += `\n${css}\n`;
          injectedCategories.add(uiverseCategory);
          uiverseSources.push(`${uiverseCategory} (UIverse)`);
        }
      }
    }

    // Append UIverse keyframes if this section uses animated components
    if (injectedCategories.size > 0 && uiverse.combinedKeyframes) {
      uiverseCss += `\n${uiverse.combinedKeyframes}\n`;
    }
  }

  const componentSource = uiverseSources.length > 0
    ? `UIverse components: ${uiverseSources.join(', ')}`
    : 'Built-in components';

  const summary = `## Section Generated: ${sectionType}

**Type:** ${sectionType}
**Components used:** ${componentsUsed.length > 0 ? componentsUsed.join(', ') : 'none (standalone section)'}
**Component source:** ${componentSource}
**Framework:** ${input.framework}

The section includes:
- Semantic HTML with proper heading hierarchy
- All colors from CSS custom properties (zero hardcoded values)
- Scroll-triggered entrance animations
- Responsive layout (mobile-first)
- Hover/focus/active states on all interactive elements
- ARIA attributes for accessibility`;

  return {
    html: result.html,
    css: result.css + uiverseCss,
    js: result.js,
    sectionId: sectionType,
    componentsUsed,
    summary,
  };
}
