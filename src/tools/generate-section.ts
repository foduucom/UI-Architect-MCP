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
import { generateContent } from './generate-content.js';
import { resolveBrandName } from './generate-full-page.js';
import type { ResolvedImage } from './fetch-images.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PageInfo {
  name: string;
  slug: string;
  isHomepage?: boolean;
}

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
  /** Page definitions for multi-page navigation context */
  pages?: PageInfo[] | null;
  /** Current page slug for active-state highlighting */
  currentPageSlug?: string | null;
  /** Brand/project name for navigation and footer */
  brandName?: string | null;
  /** Skip per-section UIverse CSS injection — generate_full_page handles it at page level */
  skipUIverseInjection?: boolean;
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
  image?: string;
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
  'menu-preview': ['card', 'button-primary'],
  'menu-items': ['card', 'button-primary', 'button-secondary'],
  'menu-categories': ['card', 'button-primary', 'button-secondary'],
  'specials': ['card', 'badge'],
  'reservation-form': ['input', 'button-primary'],
  'blog-grid': ['card', 'badge'],
  'post-grid': ['card', 'badge'],
  'featured-posts': ['card', 'badge'],
  'sidebar': ['input'],
  'skills': ['badge'],
  'project-grid': ['card', 'badge'],
  'featured-projects': ['card'],
  'categories': ['card'],
  'map': ['button-primary'],
  'info': [],
};

// ─── Default Content ────────────────────────────────────────────────────────

// Industry-specific hero content so we don't show generic SaaS copy for restaurants
const INDUSTRY_HERO: Record<string, { headline: string; subheadline: string; ctaText: string; ctaSecondaryText: string }> = {
  restaurant: {
    headline: 'An Unforgettable Dining Experience',
    subheadline: 'Where culinary artistry meets timeless elegance. Discover hand-crafted dishes made from the finest seasonal ingredients.',
    ctaText: 'Book a Table',
    ctaSecondaryText: 'View Menu',
  },
  food: {
    headline: 'Savor Every Moment',
    subheadline: 'Fresh, locally sourced ingredients transformed into extraordinary dishes. A feast for all your senses.',
    ctaText: 'Order Now',
    ctaSecondaryText: 'Our Menu',
  },
  luxury: {
    headline: 'Experience True Elegance',
    subheadline: 'Meticulously crafted for those who appreciate the finest things in life. Where every detail matters.',
    ctaText: 'Explore',
    ctaSecondaryText: 'Learn More',
  },
  healthcare: {
    headline: 'Your Health, Our Priority',
    subheadline: 'Compassionate care backed by cutting-edge technology. Trusted by thousands of patients and families.',
    ctaText: 'Book Appointment',
    ctaSecondaryText: 'Our Services',
  },
  ecommerce: {
    headline: 'Discover What You Love',
    subheadline: 'Curated collections, exceptional quality, and free shipping on every order. Shop with confidence.',
    ctaText: 'Shop Now',
    ctaSecondaryText: 'New Arrivals',
  },
  education: {
    headline: 'Learn Without Limits',
    subheadline: 'Expert-led courses designed to help you grow. Start your journey today with world-class instruction.',
    ctaText: 'Get Started',
    ctaSecondaryText: 'Browse Courses',
  },
  realestate: {
    headline: 'Find Your Perfect Home',
    subheadline: 'Premium properties in the most desirable locations. Let us help you discover where you belong.',
    ctaText: 'View Listings',
    ctaSecondaryText: 'Contact Agent',
  },
  corporate: {
    headline: 'Solutions That Drive Results',
    subheadline: 'Enterprise-grade tools built for modern teams. Streamline operations and accelerate growth.',
    ctaText: 'Get Started',
    ctaSecondaryText: 'Learn More',
  },
};

function getDefaultContent(sectionType: string, industry: string): SectionContent {
  const industryName = industry.charAt(0).toUpperCase() + industry.slice(1);
  const heroOverride = INDUSTRY_HERO[industry.toLowerCase()];

  const defaults: Record<string, SectionContent> = {
    'hero': heroOverride ? {
      headline: heroOverride.headline,
      subheadline: heroOverride.subheadline,
      ctaText: heroOverride.ctaText,
      ctaSecondaryText: heroOverride.ctaSecondaryText,
    } : {
      headline: `Transform Your ${industryName} Business`,
      subheadline:
        'Build something extraordinary with tools designed for modern teams. Ship faster, scale smarter, grow bigger.',
      ctaText: 'Get Started',
      ctaSecondaryText: 'Learn More',
    },
    'features': (() => {
      const icons = getIndustryIcons(industry, 6);
      return {
        headline: `Why ${industryName} Teams Choose Us`,
        subheadline: 'Powerful features designed to help you succeed.',
        items: [
          {
            title: 'Premium Quality',
            description: 'Every product and service meets the highest standards. Quality you can see and feel.',
            icon: icons[0],
          },
          {
            title: 'Trusted & Secure',
            description: 'Your trust is our priority. We protect your information and stand behind everything we offer.',
            icon: icons[1],
          },
          {
            title: 'Seamless Experience',
            description: 'Designed to be intuitive and effortless. Get started quickly with zero friction.',
            icon: icons[2],
          },
          {
            title: 'Transparent Pricing',
            description: 'No hidden fees, no surprises. What you see is exactly what you get.',
            icon: icons[3],
          },
          {
            title: 'Dedicated Support',
            description: 'Our team is always available to help. Reach us by chat, email, or phone anytime.',
            icon: icons[4],
          },
          {
            title: 'Built to Grow',
            description: 'Whether you are just starting out or scaling up, we grow with you every step of the way.',
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
    // ─── Restaurant / Food Sections ──────────────────────────────────────
    'menu-preview': {
      headline: 'Our Signature Dishes',
      subheadline: 'Hand-crafted masterpieces from our kitchen.',
      items: [
        { title: 'Grilled Ribeye Steak', description: 'Prime cut with herb butter, roasted garlic mash, and seasonal vegetables.', price: '$48', image: resolvePicsumUrl(600, 400, 301) },
        { title: 'Pan-Seared Salmon', description: 'Atlantic salmon with lemon dill sauce, wild rice, and grilled asparagus.', price: '$36', image: resolvePicsumUrl(600, 400, 302) },
        { title: 'Truffle Pappardelle', description: 'Fresh pappardelle with wild mushroom ragu, black truffle, and aged parmesan.', price: '$32', image: resolvePicsumUrl(600, 400, 303) },
        { title: 'Dark Chocolate Soufflé', description: 'Warm Valrhona chocolate soufflé with vanilla bean crème anglaise.', price: '$18', image: resolvePicsumUrl(600, 400, 304) },
      ],
      ctaText: 'View Full Menu',
    },
    'menu-items': {
      headline: 'Our Menu',
      subheadline: 'Explore our carefully curated selection of dishes.',
      items: [
        { title: 'Truffle Bruschetta', description: 'Grilled sourdough, whipped ricotta, black truffle, honey drizzle.', price: '$16', badge: 'starters' },
        { title: 'Tuna Tartare', description: 'Yellowfin tuna, avocado, sesame, crispy wonton, ponzu.', price: '$22', badge: 'starters' },
        { title: 'Lobster Bisque', description: 'Creamy lobster bisque, cognac cream, chive oil, brioche croutons.', price: '$18', badge: 'starters' },
        { title: 'Prime Ribeye', description: '28-day dry-aged prime ribeye, bone marrow butter, truffle fries.', price: '$58', badge: 'mains' },
        { title: 'Chilean Sea Bass', description: 'Miso-glazed sea bass, bok choy, ginger-scallion broth.', price: '$48', badge: 'mains' },
        { title: 'Duck Confit', description: 'Crispy duck leg, cherry gastrique, whipped sweet potato, arugula.', price: '$42', badge: 'mains' },
        { title: 'Rack of Lamb', description: 'Herb-crusted New Zealand lamb, rosemary jus, root vegetables.', price: '$52', badge: 'mains' },
        { title: 'Crème Brûlée', description: 'Classic vanilla bean crème brûlée with caramelized sugar crust.', price: '$16', badge: 'desserts' },
        { title: 'Tiramisu', description: 'Espresso-soaked ladyfingers, mascarpone, cocoa, amaretto.', price: '$18', badge: 'desserts' },
        { title: 'Molten Lava Cake', description: 'Warm chocolate fondant, raspberry coulis, vanilla gelato.', price: '$20', badge: 'desserts' },
        { title: 'Reserve Cabernet', description: 'Napa Valley reserve cabernet sauvignon, full-bodied, oak-aged.', price: '$24', badge: 'drinks' },
        { title: 'Smoky Old Fashioned', description: 'Smoked bourbon, demerara, angostura, flamed orange peel.', price: '$18', badge: 'drinks' },
      ],
    },
    'menu-categories': {
      headline: 'Menu Categories',
      subheadline: 'Browse by category.',
      items: [
        { title: 'All', description: 'all' },
        { title: 'Starters', description: 'starters' },
        { title: 'Main Course', description: 'mains' },
        { title: 'Desserts', description: 'desserts' },
        { title: 'Drinks', description: 'drinks' },
      ],
    },
    'specials': {
      headline: "Chef's Specials",
      subheadline: 'Limited-time creations from our head chef.',
      items: [
        { title: 'Wagyu Beef Tenderloin', description: 'Pan-seared A5 wagyu with black truffle jus and roasted garlic mash.', price: '$68', badge: "Chef's Pick", image: resolvePicsumUrl(600, 400, 305) },
        { title: 'Grilled Lobster Tail', description: 'Butter-poached Maine lobster with saffron risotto and champagne beurre blanc.', price: '$54', badge: 'Popular', image: resolvePicsumUrl(600, 400, 306) },
      ],
    },
    // ─── Gallery Sections ────────────────────────────────────────────────
    'gallery': {
      headline: 'Our Gallery',
      subheadline: 'A visual journey through our world.',
      items: [
        { title: 'Image 1', description: 'Gallery image', image: resolvePicsumUrl(600, 400, 310) },
        { title: 'Image 2', description: 'Gallery image', image: resolvePicsumUrl(600, 400, 311) },
        { title: 'Image 3', description: 'Gallery image', image: resolvePicsumUrl(600, 400, 312) },
        { title: 'Image 4', description: 'Gallery image', image: resolvePicsumUrl(600, 400, 313) },
        { title: 'Image 5', description: 'Gallery image', image: resolvePicsumUrl(600, 400, 314) },
        { title: 'Image 6', description: 'Gallery image', image: resolvePicsumUrl(600, 400, 315) },
      ],
    },
    'photo-grid': {
      headline: 'Photo Gallery',
      subheadline: 'Moments captured in time.',
      items: [
        { title: 'Photo 1', description: 'Gallery photo', image: resolvePicsumUrl(600, 400, 320) },
        { title: 'Photo 2', description: 'Gallery photo', image: resolvePicsumUrl(600, 400, 321) },
        { title: 'Photo 3', description: 'Gallery photo', image: resolvePicsumUrl(600, 400, 322) },
        { title: 'Photo 4', description: 'Gallery photo', image: resolvePicsumUrl(600, 400, 323) },
        { title: 'Photo 5', description: 'Gallery photo', image: resolvePicsumUrl(600, 400, 324) },
        { title: 'Photo 6', description: 'Gallery photo', image: resolvePicsumUrl(600, 400, 325) },
      ],
    },
    'lightbox': {
      headline: 'Gallery',
      subheadline: 'Click any image to view full size.',
    },
    // ─── Reservation / Booking ───────────────────────────────────────────
    'reservation-form': {
      headline: 'Reserve a Table',
      subheadline: 'Book your dining experience with us.',
      ctaText: 'Book Now',
    },
    // ─── Location / Hours ────────────────────────────────────────────────
    'hours': {
      headline: 'Opening Hours',
      subheadline: 'We look forward to welcoming you.',
      items: [
        { title: 'Monday', description: 'Closed' },
        { title: 'Tuesday – Thursday', description: '5:30 PM – 10:00 PM' },
        { title: 'Friday – Saturday', description: '5:30 PM – 11:00 PM' },
        { title: 'Sunday', description: '5:00 PM – 9:30 PM' },
      ],
    },
    'location': {
      headline: 'Find Us',
      subheadline: 'Visit us at our location.',
      description: '742 Culinary Lane, New York, NY 10012',
    },
    // ─── E-commerce Sections ─────────────────────────────────────────────
    'product-grid': {
      headline: 'Our Products',
      subheadline: 'Explore our latest collection.',
      items: [
        { title: 'Product One', description: 'Premium quality with attention to detail.', price: '$49.99', image: resolvePicsumUrl(400, 400, 330), badge: 'New' },
        { title: 'Product Two', description: 'Best-selling item loved by thousands.', price: '$79.99', image: resolvePicsumUrl(400, 400, 331), badge: 'Popular' },
        { title: 'Product Three', description: 'Limited edition exclusive release.', price: '$99.99', image: resolvePicsumUrl(400, 400, 332), badge: 'Limited' },
        { title: 'Product Four', description: 'Everyday essential at a great price.', price: '$29.99', image: resolvePicsumUrl(400, 400, 333) },
      ],
      ctaText: 'Shop Now',
    },
    'featured-products': {
      headline: 'Featured Products',
      subheadline: 'Hand-picked favorites from our collection.',
      items: [
        { title: 'Premium Item', description: 'Our most popular product this season.', price: '$129.99', image: resolvePicsumUrl(600, 400, 334), badge: 'Featured' },
        { title: 'Classic Essential', description: 'A timeless piece for every wardrobe.', price: '$89.99', image: resolvePicsumUrl(600, 400, 335) },
        { title: 'New Arrival', description: 'Fresh from our latest collection.', price: '$69.99', image: resolvePicsumUrl(600, 400, 336), badge: 'New' },
      ],
    },
    // ─── Categories Section ──────────────────────────────────────────────
    'categories': {
      headline: 'Browse Categories',
      subheadline: 'Explore our curated categories.',
      items: [
        { title: 'Clothing', description: 'Apparel for every occasion.', image: resolvePicsumUrl(400, 300, 360), link: '#' },
        { title: 'Accessories', description: 'Complete your look.', image: resolvePicsumUrl(400, 300, 361), link: '#' },
        { title: 'Electronics', description: 'Latest gadgets and tech.', image: resolvePicsumUrl(400, 300, 362), link: '#' },
        { title: 'Home & Living', description: 'Furnish your space.', image: resolvePicsumUrl(400, 300, 363), link: '#' },
        { title: 'Sports', description: 'Gear up for adventure.', image: resolvePicsumUrl(400, 300, 364), link: '#' },
        { title: 'Beauty', description: 'Skincare, makeup & more.', image: resolvePicsumUrl(400, 300, 365), link: '#' },
      ],
    },
    // ─── Contact Map & Info Sections ─────────────────────────────────────
    'map': {
      headline: 'Find Us',
      subheadline: 'Visit us at our location.',
      description: '123 Business Avenue, Suite 100, San Francisco, CA 94102',
      ctaText: 'Get Directions',
    },
    'info': {
      headline: 'Contact Information',
      subheadline: 'Get in touch through any channel below.',
      items: [
        { title: 'Email', description: 'hello@example.com', icon: 'mail' },
        { title: 'Phone', description: '+1 (555) 123-4567', icon: 'phone' },
        { title: 'Address', description: '123 Business Avenue, Suite 100, San Francisco, CA 94102', icon: 'map-pin' },
        { title: 'Business Hours', description: 'Mon-Fri: 9:00 AM - 6:00 PM', icon: 'clock' },
      ],
    },
    // ─── Blog Sections ───────────────────────────────────────────────────
    'blog-grid': {
      headline: 'Latest Articles',
      subheadline: 'Insights, tips, and stories from our team.',
      items: [
        { title: 'Getting Started with Modern Web Design', description: 'Learn the fundamentals of creating beautiful, responsive websites.', image: resolvePicsumUrl(600, 400, 340), badge: 'Design' },
        { title: '10 Tips for Better User Experience', description: 'Practical advice to improve usability and delight your users.', image: resolvePicsumUrl(600, 400, 341), badge: 'UX' },
        { title: 'The Future of Digital Products', description: 'Exploring trends that will shape the next generation of products.', image: resolvePicsumUrl(600, 400, 342), badge: 'Trends' },
      ],
    },
    'post-grid': {
      headline: 'Recent Posts',
      subheadline: 'Stay up to date with our latest content.',
      items: [
        { title: 'Building Scalable Systems', description: 'Architecture patterns for growth.', image: resolvePicsumUrl(600, 400, 343), badge: 'Engineering' },
        { title: 'Design Principles That Work', description: 'Timeless principles for modern interfaces.', image: resolvePicsumUrl(600, 400, 344), badge: 'Design' },
        { title: 'Launching Your First Product', description: 'A step-by-step guide to going live.', image: resolvePicsumUrl(600, 400, 345), badge: 'Startup' },
      ],
    },
    'featured-posts': {
      headline: 'Featured Stories',
      subheadline: 'Our most popular articles.',
      items: [
        { title: 'How We Built Our Platform', description: 'The story behind our technology and the decisions that shaped it.', image: resolvePicsumUrl(800, 400, 346), badge: 'Featured' },
        { title: 'Customer Success Story', description: 'How one company transformed their workflow with our tools.', image: resolvePicsumUrl(800, 400, 347), badge: 'Case Study' },
      ],
    },
    // ─── Portfolio Sections ──────────────────────────────────────────────
    'project-grid': {
      headline: 'Our Work',
      subheadline: 'Selected projects we are proud of.',
      items: [
        { title: 'Brand Redesign', description: 'Complete visual identity overhaul for a tech startup.', image: resolvePicsumUrl(600, 400, 350), badge: 'Branding' },
        { title: 'E-commerce Platform', description: 'Full-stack web application with 50K+ monthly users.', image: resolvePicsumUrl(600, 400, 351), badge: 'Web App' },
        { title: 'Mobile App', description: 'Cross-platform app with 4.8-star rating on both stores.', image: resolvePicsumUrl(600, 400, 352), badge: 'Mobile' },
        { title: 'Dashboard UI', description: 'Analytics dashboard for real-time data visualization.', image: resolvePicsumUrl(600, 400, 353), badge: 'UI/UX' },
      ],
    },
    'featured-projects': {
      headline: 'Featured Projects',
      subheadline: 'Showcase of our best work.',
      items: [
        { title: 'Flagship Project', description: 'Our award-winning project that pushed boundaries.', image: resolvePicsumUrl(800, 500, 354), badge: 'Award Winner' },
        { title: 'Innovation Lab', description: 'Experimental project exploring new technologies.', image: resolvePicsumUrl(800, 500, 355), badge: 'Innovation' },
      ],
    },
    'skills': {
      headline: 'Our Expertise',
      subheadline: 'Technologies and skills we excel at.',
      items: [
        { title: 'Frontend Development', description: 'React, Vue, Angular, TypeScript' },
        { title: 'Backend Development', description: 'Node.js, Python, Go, Rust' },
        { title: 'Design', description: 'Figma, UI/UX, Design Systems' },
        { title: 'DevOps', description: 'Docker, Kubernetes, CI/CD, AWS' },
      ],
    },
    'sidebar': {
      headline: 'Quick Links',
      subheadline: 'Navigate to popular sections.',
      items: [
        { title: 'About Us', description: 'Learn more about our mission.', link: '#about' },
        { title: 'Services', description: 'What we offer.', link: '#services' },
        { title: 'Contact', description: 'Get in touch.', link: '#contact' },
      ],
    },
  };

  if (defaults[sectionType]) {
    return defaults[sectionType];
  }

  // Try intelligent content generation for unknown section types
  try {
    const generated = generateContent({
      sectionType,
      industry,
      tone: 'professional',
    });
    if (generated.content.headline) {
      return {
        headline: generated.content.headline,
        subheadline: generated.content.subheadline || '',
        items: generated.content.items || [],
      };
    }
  } catch {
    // Fall through to generic fallback
  }

  const sectionLabel = sectionType
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    headline: sectionLabel,
    subheadline: `Explore our ${sectionLabel.toLowerCase()} to find exactly what you're looking for.`,
    items: [],
  };
}

// ─── Section Generators (Vanilla HTML) ──────────────────────────────────────

function generateHeroSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  // Use real fetched image, explicit content image, or fall back to Picsum
  const heroImage = ctx?.images?.[0];
  const heroImgUrl = heroImage?.url || content.image || resolvePicsumUrl(1200, 600, sectionIndex + 1);
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
        const iconSrc = fetchedIcon?.svgContent 
          ? fetchedIcon.svgContent 
          : (iconUrl
            ? `<img src="${iconUrl}" alt="${item.title} icon" class="feature-icon-img" width="28" height="28" loading="lazy">`
            : `<span class="feature-icon-emoji">${item.icon || '✦'}</span>`);

        // Use UIverse card template if available
        return instantiateCard(ctx?.uiverse, {
          title: item.title,
          description: item.description,
          icon: fetchedIcon?.svgContent || iconUrl || item.icon || '✦',
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
        <h3 class="footer-logo">${resolveBrandName(ctx?.brandName) || content.headline}</h3>
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

  // Use real page links from context when available, otherwise fall back to section anchors
  const brandName = resolveBrandName(ctx?.brandName) || content.headline;
  let navLinksHtml: string;

  if (ctx?.pages && ctx.pages.length > 0) {
    // Real multi-page navigation — generate links to actual pages
    navLinksHtml = ctx.pages.map(page => {
      const href = page.isHomepage ? 'index.html' : `${page.slug}.html`;
      const activeClass = ctx.currentPageSlug === page.slug ? ' active' : '';
      return `      <li><a href="${href}" class="nav-link${activeClass}">${page.name}</a></li>`;
    }).join('\n');
  } else {
    // Single-page fallback — generate anchor links to sections on the current page
    navLinksHtml = `      <li><a href="#features" class="nav-link">Features</a></li>
      <li><a href="#pricing" class="nav-link">Pricing</a></li>
      <li><a href="#testimonials" class="nav-link">Testimonials</a></li>
      <li><a href="#contact" class="nav-link">Contact</a></li>`;
  }

  const html = `<!-- Navigation -->
<nav class="navbar" role="navigation" aria-label="Main navigation">
  <div class="nav-container">
    <a href="index.html" class="nav-brand" aria-label="Home">
      <strong>${brandName}</strong>
    </a>
    <div class="nav-hamburger" aria-label="Toggle menu">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <ul class="nav-links">
${navLinksHtml}
      <li>${navCta}</li>
    </ul>
  </div>
</nav>`;

  const css = `/* Navigation — unified with generate-full-page System A classes */
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  padding: var(--space-md) 0;
  background: rgba(248, 247, 247, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background var(--transition-base), box-shadow var(--transition-base), padding var(--transition-base);
}
.navbar.scrolled {
  padding: var(--space-sm) 0;
  background: rgba(248, 247, 247, 0.98);
  box-shadow: var(--shadow-md);
}
.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-brand {
  font-family: var(--font-heading);
  font-size: var(--fs-h3);
  font-weight: var(--fw-bold);
  color: var(--color-primary);
}
.nav-links {
  display: flex;
  gap: var(--space-xl);
  align-items: center;
}
.nav-link {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  font-weight: var(--fw-medium);
  color: var(--color-neutral-700);
  padding: var(--space-xs) 0;
  position: relative;
  transition: color var(--transition-fast);
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0;
  width: 0; height: 2px;
  background: var(--color-primary);
  transition: width var(--transition-base);
}
.nav-link:hover, .nav-link.active { color: var(--color-primary); }
.nav-link:hover::after, .nav-link.active::after { width: 100%; }

.nav-hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  padding: var(--space-xs);
  z-index: 1001;
}
.nav-hamburger span {
  display: block;
  width: 24px; height: 2px;
  background: var(--color-neutral-900);
  transition: transform var(--transition-base), opacity var(--transition-fast);
}
.nav-hamburger.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.nav-hamburger.active span:nth-child(2) { opacity: 0; }
.nav-hamburger.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

.nav-cta { margin-left: var(--space-md); }

@media (max-width: 768px) {
  .nav-hamburger { display: flex; }
  .nav-links {
    position: fixed;
    top: 0; right: -100%;
    width: 280px; height: 100vh;
    background: var(--color-neutral-50);
    flex-direction: column;
    padding: var(--space-5xl) var(--space-xl) var(--space-xl);
    gap: var(--space-lg);
    box-shadow: var(--shadow-xl);
    transition: right var(--transition-slow);
    z-index: 1000;
  }
  .nav-links.open { right: 0; }
  body.menu-open { overflow: hidden; }
}`;

  const js = `// Navigation
var hamburger = document.querySelector('.nav-hamburger');
var navLinks = document.querySelector('.nav-links');
var navbar = document.querySelector('.navbar');

// Mobile hamburger toggle
if (hamburger && navLinks) {
  hamburger.addEventListener('click', function() {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
    document.body.classList.toggle('menu-open');
  });
  navLinks.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function() {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.classList.remove('menu-open');
    });
  });
}

// Sticky navbar
if (navbar) {
  window.addEventListener('scroll', function() {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(function(link) {
  link.addEventListener('click', function(e) {
    var href = link.getAttribute('href');
    if (href) {
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navLinks) navLinks.classList.remove('open');
        if (hamburger) hamburger.classList.remove('active');
        document.body.classList.remove('menu-open');
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
        const fetchedIcon = ctx?.images?.[i];
        const iconSrc = fetchedIcon?.svgContent
          ? fetchedIcon.svgContent
          : (item.icon && item.icon.startsWith('http')
            ? `<img src="${item.icon}" alt="${item.title} icon" class="step-icon-img" width="28" height="28" loading="lazy">`
            : `<span class="step-icon-emoji">${item.icon || (i + 1)}</span>`);
        return `
        <div class="step-card animate-on-scroll" style="transition-delay: ${i * 150}ms">
          <div class="step-number">${iconSrc}</div>
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
  // Use fetched image, explicit content image, or fall back
  const aboutImage = ctx?.images?.[0];
  const aboutImgUrl = aboutImage?.url || content.image || resolvePicsumUrl(800, 500, sectionIndex + 50);
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

// ─── Menu Preview Section ────────────────────────────────────────────────────

function generateMenuPreviewSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const images = ctx?.images || [];

  const cardsHtml = items.map((item, i) => {
    const imgSrc = images[i]?.url || item.image || resolvePicsumUrl(600, 400, 301 + i);
    return instantiateCard(ctx?.uiverse, {
      title: item.title,
      description: item.description,
      image: imgSrc,
      badge: item.badge,
      price: item.price || '',
      index: i,
    }, {
      extraClasses: 'menu-prev-card',
      animateDelay: i * 100,
    });
  }).join('\n');

  const ctaBtn = content.ctaText
    ? instantiateButton(ctx?.uiverse, content.ctaText, { variant: 'primary', href: '#menu' })
    : '';

  const html = `<!-- Menu Preview Section -->
<section class="menu-prev-section section" id="menu-preview">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Our Signature Dishes'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="menu-prev-grid stagger-children">
${cardsHtml}
    </div>
    ${ctaBtn ? `<div class="menu-prev-cta animate-on-scroll">${ctaBtn}</div>` : ''}
  </div>
</section>`;

  const css = `/* Menu Preview Section — layout only; card/button styling from UIverse components */
.menu-prev-section { padding: var(--space-5xl) 0; }
.menu-prev-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-2xl);
}
.menu-prev-cta { text-align: center; margin-top: var(--space-3xl); }
@media (max-width: 480px) {
  .menu-prev-grid { grid-template-columns: 1fr; }
}`;

  return { html, css, js: '' };
}

// ─── Menu Items Section (with category filtering) ────────────────────────────

function generateMenuItemsSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];

  // Extract unique categories from item badges
  const categories = ['all', ...new Set(items.map(item => item.badge || 'other').filter(Boolean))];

  // Use instantiateButton for filter buttons, inject data-filter attribute
  const filterBtns = categories.map((cat, i) => {
    const label = cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1);
    const btn = instantiateButton(ctx?.uiverse, label, {
      variant: i === 0 ? 'primary' : 'secondary',
      extraClasses: `menu-filter-btn${i === 0 ? ' active' : ''}`,
    });
    // Inject data-filter attribute on the root element
    return btn.replace(/^<(\w+)/, `<$1 data-filter="${cat}"`);
  }).join('\n          ');

  // Use instantiateCard for menu items, inject data-category for JS filtering
  const menuItemsHtml = items.map((item, i) => {
    const imgSrc = item.image || resolvePicsumUrl(200, 200, 400 + i);
    const category = item.badge || 'other';
    const cardHtml = instantiateCard(ctx?.uiverse, {
      title: item.title,
      description: item.description,
      image: imgSrc,
      badge: item.badge,
      price: item.price || '',
      index: i,
    }, {
      extraClasses: 'menu-item',
      animateDelay: (i % 4) * 80,
    });
    // Inject data-category attribute on the root element for filtering
    return cardHtml.replace(/^<(\w+)/, `<$1 data-category="${category}"`);
  }).join('\n');

  const html = `<!-- Menu Items Section -->
<section class="menu-items-section section" id="menu-items">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Our Menu'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="menu-filters animate-on-scroll">
          ${filterBtns}
    </div>
    <div class="menu-grid stagger-children" id="menuGrid">
${menuItemsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Menu Items Section — layout only; card/button styling from UIverse components */
.menu-items-section { padding: var(--space-5xl) 0; }
.menu-filters {
  display: flex; justify-content: center; gap: var(--space-md);
  margin-bottom: var(--space-3xl); flex-wrap: wrap;
}
.menu-filter-btn.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-xl);
}
/* Override card layout to horizontal for menu items */
.menu-item { display: flex; gap: var(--space-lg); }
.menu-item .card-image { width: 90px; height: 90px; flex-shrink: 0; }
.menu-item.hidden { display: none; }
@media (max-width: 768px) { .menu-grid { grid-template-columns: 1fr; } }`;

  const js = `// Menu category filtering
document.querySelectorAll('.menu-filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.menu-filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var filter = btn.getAttribute('data-filter');
    document.querySelectorAll('.menu-item').forEach(function(item) {
      if (filter === 'all' || item.getAttribute('data-category') === filter) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
  });
});`;

  return { html, css, js };
}

// ─── Menu Categories Section ─────────────────────────────────────────────────

function generateMenuCategoriesSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  // Menu categories is essentially the filter tabs — reuse menu-items logic
  return generateMenuItemsSection(content, sectionIndex, ctx);
}

// ─── Specials Section ────────────────────────────────────────────────────────

function generateSpecialsSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const images = ctx?.images || [];

  const cardsHtml = items.map((item, i) => {
    const imgSrc = images[i]?.url || item.image || resolvePicsumUrl(600, 400, 305 + i);
    return instantiateCard(ctx?.uiverse, {
      title: item.title,
      description: item.description,
      image: imgSrc,
      badge: item.badge,
      price: item.price,
      index: i,
    }, {
      extraClasses: 'special-card',
      animateDelay: i * 150,
    });
  }).join('\n');

  const html = `<!-- Specials Section -->
<section class="specials-section section" id="specials">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || "Chef's Specials"}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="specials-grid stagger-children">
${cardsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Specials Section — layout only; card styling from UIverse components */
.specials-section { padding: var(--space-5xl) 0; }
.specials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-2xl);
}
.special-card { border: 2px solid var(--color-accent); }
.special-card .badge {
  animation: pulse-badge 2s ease-in-out infinite;
}
@keyframes pulse-badge { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`;

  return { html, css, js: '' };
}

// ─── Gallery Section ─────────────────────────────────────────────────────────

function generateGallerySection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const images = ctx?.images || [];

  const galleryItems = items.map((item, i) => {
    const imgSrc = images[i]?.url || item.image || resolvePicsumUrl(600, 400, 310 + i);
    const fullSrc = imgSrc.replace('/600/400', '/1200/800');
    return `
        <div class="gallery-item animate-on-scroll" data-src="${fullSrc}" style="transition-delay: ${i * 80}ms">
          <img src="${imgSrc}" alt="${item.title || 'Gallery image ' + (i + 1)}" width="600" height="400" loading="lazy" decoding="async">
          <div class="gallery-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="32" height="32"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
          </div>
        </div>`;
  }).join('\n');

  const html = `<!-- Gallery Section -->
<section class="gallery-section section" id="gallery">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Our Gallery'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="gallery-grid stagger-children">
${galleryItems}
    </div>
  </div>
</section>
<!-- Lightbox Modal -->
<div class="lightbox" id="lightbox" role="dialog" aria-label="Image gallery lightbox">
  <div class="lightbox-content">
    <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
    <button class="lightbox-nav lightbox-prev" aria-label="Previous image">&#8249;</button>
    <img src="" alt="Full size gallery image" id="lightboxImg">
    <button class="lightbox-nav lightbox-next" aria-label="Next image">&#8250;</button>
  </div>
</div>`;

  const css = `/* Gallery Section */
.gallery-section { padding: var(--space-5xl) 0; }
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 250px;
  gap: var(--space-md);
}
.gallery-grid .gallery-item:first-child { grid-column: span 2; grid-row: span 2; }
.gallery-item {
  position: relative; border-radius: var(--radius-md);
  overflow: hidden; cursor: pointer;
}
.gallery-item img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.gallery-item:hover img { transform: scale(1.08); }
.gallery-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0);
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition-base);
}
.gallery-overlay svg { color: #fff; opacity: 0; transform: scale(0.8); transition: all var(--transition-base); }
.gallery-item:hover .gallery-overlay { background: rgba(0,0,0,0.4); }
.gallery-item:hover .gallery-overlay svg { opacity: 1; transform: scale(1); }
/* Lightbox */
.lightbox {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.95); z-index: 2000;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; visibility: hidden;
  transition: all var(--transition-base);
}
.lightbox.active { opacity: 1; visibility: visible; }
.lightbox-content { position: relative; max-width: 90vw; max-height: 85vh; }
.lightbox-content img {
  max-width: 100%; max-height: 85vh; object-fit: contain;
  border-radius: var(--radius-md);
  transform: scale(0.9);
  transition: transform var(--transition-base) cubic-bezier(0.16, 1, 0.3, 1);
}
.lightbox.active .lightbox-content img { transform: scale(1); }
.lightbox-close {
  position: absolute; top: -50px; right: 0;
  background: none; border: none; color: #fff;
  font-size: 2rem; cursor: pointer; padding: var(--space-sm);
  transition: color var(--transition-fast);
}
.lightbox-close:hover { color: var(--color-primary); }
.lightbox-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,0.1); border: none; color: #fff;
  width: 50px; height: 50px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 1.5rem;
  transition: all var(--transition-fast);
  backdrop-filter: blur(10px);
}
.lightbox-nav:hover { background: var(--color-primary); }
.lightbox-prev { left: -70px; }
.lightbox-next { right: -70px; }
@media (max-width: 768px) {
  .gallery-grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 200px; }
  .gallery-grid .gallery-item:first-child { grid-column: span 2; grid-row: span 1; }
  .lightbox-prev { left: 10px; }
  .lightbox-next { right: 10px; }
}`;

  const js = `// Gallery Lightbox
(function() {
  var lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  var lightboxImg = document.getElementById('lightboxImg');
  var items = document.querySelectorAll('.gallery-item[data-src]');
  var images = Array.from(items).map(function(el) { return el.getAttribute('data-src'); });
  var currentIndex = 0;
  function openLightbox(i) {
    currentIndex = i;
    lightboxImg.src = images[currentIndex];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  function navigate(dir) {
    currentIndex = (currentIndex + dir + images.length) % images.length;
    lightboxImg.style.opacity = '0';
    setTimeout(function() {
      lightboxImg.src = images[currentIndex];
      lightboxImg.style.opacity = '1';
    }, 200);
  }
  items.forEach(function(item, i) { item.addEventListener('click', function() { openLightbox(i); }); });
  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', function() { navigate(-1); });
  lightbox.querySelector('.lightbox-next').addEventListener('click', function() { navigate(1); });
  lightbox.addEventListener('click', function(e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', function(e) {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });
})();`;

  return { html, css, js };
}

// ─── Photo Grid Section (alias of gallery) ──────────────────────────────────

function generatePhotoGridSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  return generateGallerySection(content, sectionIndex, ctx);
}

// ─── Reservation Form Section ────────────────────────────────────────────────

function generateReservationFormSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  // Use instantiateInput for text/email/tel/date inputs
  const nameInput = instantiateInput(ctx?.uiverse, { name: 'res-name', label: 'Full Name', placeholder: 'John Doe', required: true, id: 'res-name', type: 'text' });
  const emailInput = instantiateInput(ctx?.uiverse, { name: 'res-email', label: 'Email', placeholder: 'john@example.com', required: true, id: 'res-email', type: 'email' });
  const phoneInput = instantiateInput(ctx?.uiverse, { name: 'res-phone', label: 'Phone', placeholder: '+1 (555) 000-0000', id: 'res-phone', type: 'tel' });
  const dateInput = instantiateInput(ctx?.uiverse, { name: 'res-date', label: 'Date', id: 'res-date', type: 'date', required: true });
  const submitBtn = instantiateButton(ctx?.uiverse, content.ctaText || 'Book Now', { variant: 'primary', extraClasses: 'reservation-submit' });

  const html = `<!-- Reservation Form Section -->
<section class="reservation-section section" id="reservation-form">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Reserve a Table'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="reservation-grid">
      <div class="reservation-form-wrap animate-from-left">
        <form class="reservation-form" id="reservationForm" novalidate>
          <div class="form-row">
            <div class="form-group">
              ${nameInput}
              <div class="form-error">Please enter your name</div>
            </div>
            <div class="form-group">
              ${emailInput}
              <div class="form-error">Please enter a valid email</div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              ${phoneInput}
            </div>
            <div class="form-group">
              <label class="form-label" for="res-guests">Guests</label>
              <select id="res-guests" class="form-input">
                <option>1 Guest</option><option>2 Guests</option><option selected>3 Guests</option>
                <option>4 Guests</option><option>5 Guests</option><option>6+ Guests</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              ${dateInput}
            </div>
            <div class="form-group">
              <label class="form-label" for="res-time">Time</label>
              <select id="res-time" class="form-input">
                <option>5:30 PM</option><option>6:00 PM</option><option selected>7:00 PM</option>
                <option>7:30 PM</option><option>8:00 PM</option><option>8:30 PM</option><option>9:00 PM</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="res-message">Special Requests</label>
            <textarea id="res-message" class="form-input form-textarea" placeholder="Dietary requirements, celebrations, seating preferences..."></textarea>
          </div>
          <div class="form-submit-wrap" style="width:100%;">${submitBtn}</div>
        </form>
        <div class="form-success" id="formSuccess">Reservation confirmed! We'll send a confirmation to your email.</div>
      </div>
      <div class="reservation-info animate-from-right">
        <div class="res-info-card">
          <h3>Opening Hours</h3>
          <ul class="res-hours">
            <li><span>Monday</span><span>Closed</span></li>
            <li><span>Tue – Thu</span><span>5:30 – 10:00 PM</span></li>
            <li><span>Fri – Sat</span><span>5:30 – 11:00 PM</span></li>
            <li><span>Sunday</span><span>5:00 – 9:30 PM</span></li>
          </ul>
        </div>
        <div class="res-info-card">
          <h3>Contact</h3>
          <p>+1 (212) 555-0189</p>
          <p>hello@restaurant.com</p>
          <p>742 Culinary Lane, New York, NY 10012</p>
        </div>
      </div>
    </div>
  </div>
</section>`;

  const css = `/* Reservation Section — layout + select/textarea fallback; input/button styling from UIverse components */
.reservation-section { padding: var(--space-5xl) 0; }
.reservation-grid {
  display: grid; grid-template-columns: 1.5fr 1fr;
  gap: var(--space-3xl); align-items: start;
}
.reservation-form-wrap {
  background: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); }
.form-group { margin-bottom: var(--space-lg); }
.form-label {
  display: block; font-size: var(--fs-small); font-weight: 600;
  color: var(--color-neutral-700); margin-bottom: var(--space-sm);
  text-transform: uppercase; letter-spacing: 0.5px;
}
/* Fallback styling for select/textarea elements not covered by instantiateInput */
.form-input {
  width: 100%; padding: var(--space-md) var(--space-lg);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  color: var(--color-neutral-900);
  font-size: var(--fs-body);
  transition: all var(--transition-fast);
}
.form-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.15); }
.form-textarea { min-height: 100px; resize: vertical; }
.form-submit-wrap { text-align: center; }
.form-submit-wrap .btn { width: 100%; justify-content: center; }
.form-error { font-size: var(--fs-caption); color: var(--color-error); margin-top: var(--space-xs); display: none; }
.form-success {
  background: rgba(5, 150, 105, 0.1); color: var(--color-success);
  padding: var(--space-lg); border-radius: var(--radius-md);
  text-align: center; font-weight: 600; display: none; margin-top: var(--space-lg);
}
.res-info-card {
  background: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
}
.res-info-card h3 {
  font-family: var(--font-heading); font-size: var(--fs-h4);
  color: var(--color-neutral-900); margin-bottom: var(--space-md);
}
.res-info-card p { color: var(--color-neutral-700); margin-bottom: var(--space-sm); }
.res-hours { list-style: none; }
.res-hours li {
  display: flex; justify-content: space-between;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-neutral-200);
  color: var(--color-neutral-700);
  font-size: var(--fs-small);
}
.res-hours li:last-child { border-bottom: none; }
@media (max-width: 768px) {
  .reservation-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
}`;

  const js = `// Reservation form validation
(function() {
  var form = document.getElementById('reservationForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var valid = true;
    var required = form.querySelectorAll('[required]');
    required.forEach(function(input) {
      var error = input.parentElement.querySelector('.form-error');
      if (!input.value.trim()) {
        input.style.borderColor = 'var(--color-error)';
        if (error) error.style.display = 'block';
        valid = false;
      } else {
        input.style.borderColor = '';
        if (error) error.style.display = 'none';
      }
    });
    var email = document.getElementById('res-email');
    if (email && email.value && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.value)) {
      email.style.borderColor = 'var(--color-error)';
      var emailErr = email.parentElement.querySelector('.form-error');
      if (emailErr) emailErr.style.display = 'block';
      valid = false;
    }
    if (valid) {
      form.style.display = 'none';
      var success = document.getElementById('formSuccess');
      if (success) success.style.display = 'block';
      setTimeout(function() {
        form.reset(); form.style.display = '';
        if (success) success.style.display = 'none';
      }, 4000);
    }
  });
})();`;

  return { html, css, js };
}

// ─── Hours Section ───────────────────────────────────────────────────────────

function generateHoursSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const hoursHtml = items.map(item =>
    `<li><span>${item.title}</span><span>${item.description}</span></li>`
  ).join('\n            ');

  const html = `<!-- Hours Section -->
<section class="hours-section section" id="hours">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Opening Hours'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="hours-card animate-on-scroll">
      <ul class="hours-list">
            ${hoursHtml}
      </ul>
    </div>
  </div>
</section>`;

  const css = `/* Hours Section */
.hours-section { padding: var(--space-5xl) 0; }
.hours-card {
  max-width: 500px; margin: 0 auto;
  background: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
}
.hours-list { list-style: none; }
.hours-list li {
  display: flex; justify-content: space-between;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--color-neutral-200);
  font-size: var(--fs-body); color: var(--color-neutral-700);
}
.hours-list li:last-child { border-bottom: none; }
.hours-list li span:first-child { font-weight: 600; color: var(--color-neutral-900); }`;

  return { html, css, js: '' };
}

// ─── Location Section ────────────────────────────────────────────────────────

function generateLocationSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const html = `<!-- Location Section -->
<section class="location-section section" id="location">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Find Us'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="location-card animate-on-scroll">
      <div class="location-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="48" height="48"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      </div>
      <p class="location-address">${content.description || '742 Culinary Lane, New York, NY 10012'}</p>
    </div>
  </div>
</section>`;

  const css = `/* Location Section */
.location-section { padding: var(--space-5xl) 0; }
.location-card {
  max-width: 500px; margin: 0 auto; text-align: center;
  background: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-3xl);
}
.location-icon { margin-bottom: var(--space-lg); color: var(--color-primary); }
.location-icon svg { margin: 0 auto; }
.location-address {
  font-size: var(--fs-h4); color: var(--color-neutral-700);
  line-height: 1.6;
}`;

  return { html, css, js: '' };
}

// ─── Product Grid Section ────────────────────────────────────────────────────

function generateProductGridSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const images = ctx?.images || [];

  const productsHtml = items.map((item, i) => {
    const imgSrc = images[i]?.url || item.image || resolvePicsumUrl(400, 400, 330 + i);
    return instantiateCard(ctx?.uiverse, {
      title: item.title,
      description: item.description,
      image: imgSrc,
      badge: item.badge,
      price: item.price || '',
      link: item.link || '#',
      index: i,
    }, {
      extraClasses: 'product-card',
      animateDelay: i * 100,
    });
  }).join('\n');

  const html = `<!-- Product Grid Section -->
<section class="product-grid-section section" id="product-grid">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Our Products'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="product-grid stagger-children">
${productsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Product Grid Section — layout only; card styling from UIverse components */
.product-grid-section { padding: var(--space-5xl) 0; }
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-2xl);
}`;

  return { html, css, js: '' };
}

// ─── Blog Grid Section ───────────────────────────────────────────────────────

function generateBlogGridSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const images = ctx?.images || [];

  const postsHtml = items.map((item, i) => {
    const imgSrc = images[i]?.url || item.image || resolvePicsumUrl(600, 400, 340 + i);
    return instantiateCard(ctx?.uiverse, {
      title: item.title,
      description: item.description,
      image: imgSrc,
      badge: item.badge,
      link: item.link || '#',
      index: i,
    }, {
      extraClasses: 'blog-card',
      animateDelay: i * 100,
    });
  }).join('\n');

  const html = `<!-- Blog Grid Section -->
<section class="blog-grid-section section" id="blog-grid">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Latest Articles'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="blog-grid stagger-children">
${postsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Blog Grid Section — layout only; card styling from UIverse components */
.blog-grid-section { padding: var(--space-5xl) 0; }
.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-2xl);
}`;

  return { html, css, js: '' };
}

// ─── Project Grid Section ────────────────────────────────────────────────────

function generateProjectGridSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const images = ctx?.images || [];

  const projectsHtml = items.map((item, i) => {
    const imgSrc = images[i]?.url || item.image || resolvePicsumUrl(600, 400, 350 + i);
    return instantiateCard(ctx?.uiverse, {
      title: item.title,
      description: item.description,
      image: imgSrc,
      badge: item.badge,
      index: i,
    }, {
      extraClasses: 'project-card',
      animateDelay: i * 100,
    });
  }).join('\n');

  const html = `<!-- Project Grid Section -->
<section class="project-grid-section section" id="project-grid">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Our Work'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="project-grid stagger-children">
${projectsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Project Grid Section — layout + overlay effect on UIverse cards */
.project-grid-section { padding: var(--space-5xl) 0; }
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-xl);
}
/* Override UIverse card to create image-overlay layout */
.project-card { position: relative; overflow: hidden; border-radius: var(--radius-lg); }
.project-card .card-image { position: absolute; inset: 0; height: 100%; }
.project-card .card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
.project-card:hover .card-image img { transform: scale(1.05); }
.project-card .card-content {
  position: relative; z-index: 1; min-height: 300px;
  display: flex; flex-direction: column; justify-content: flex-end;
  padding: var(--space-xl);
}
.project-card::after {
  content: ''; position: absolute; inset: 0; z-index: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%);
  transition: background var(--transition-base);
  pointer-events: none;
}
.project-card:hover::after { background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.2) 70%); }
.project-card .card-title { color: #fff; position: relative; z-index: 1; }
.project-card .card-description { color: rgba(255,255,255,0.8); position: relative; z-index: 1; }
.project-card .badge {
  position: relative; z-index: 1;
  display: inline-block; width: fit-content;
  background: var(--color-primary); color: #fff;
  font-size: var(--fs-caption); font-weight: 700;
  text-transform: uppercase; padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm); margin-bottom: var(--space-sm);
}`;

  return { html, css, js: '' };
}

// ─── Categories Section ──────────────────────────────────────────────────────

function generateCategoriesSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];
  const images = ctx?.images || [];

  const cardsHtml = items.map((item, i) => {
    const imgSrc = images[i]?.url || item.image || resolvePicsumUrl(400, 300, 360 + i);
    return instantiateCard(ctx?.uiverse, {
      title: item.title,
      description: item.description,
      image: imgSrc,
      link: item.link || '#',
      index: i,
    }, {
      extraClasses: 'category-card',
      animateDelay: i * 100,
    });
  }).join('\n');

  const html = `<!-- Categories Section -->
<section class="categories-section section" id="categories">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Browse Categories'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="categories-grid stagger-children">
${cardsHtml}
    </div>
  </div>
</section>`;

  const colCount = Math.min(items.length, 4);

  const css = `/* Categories Section */
.categories-section { padding: var(--space-5xl) 0; }
.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-xl);
  margin-top: var(--space-3xl);
}

@media (min-width: 768px) {
  .categories-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .categories-grid {
    grid-template-columns: repeat(${colCount}, 1fr);
  }
}

.category-card {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-height: 200px;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.category-card .card-image {
  position: absolute;
  inset: 0;
}

.category-card .card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.category-card:hover .card-image img {
  transform: scale(1.08);
}

.category-card .card-title {
  position: relative;
  z-index: 1;
  color: #fff;
  font-family: var(--font-heading);
  font-size: var(--fs-h4);
  font-weight: 600;
  padding: var(--space-lg);
  margin-top: auto;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent 80%);
  min-height: 200px;
  display: flex;
  align-items: flex-end;
}

.category-card .card-description {
  position: relative;
  z-index: 1;
  color: rgba(255,255,255,0.8);
  font-size: var(--fs-small);
  padding: 0 var(--space-lg) var(--space-lg);
  background: rgba(0,0,0,0.5);
}`;

  return { html, css, js: '' };
}

// ─── Map Section ─────────────────────────────────────────────────────────────

function generateMapSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const address = content.description || '123 Business Avenue, Suite 100, San Francisco, CA 94102';
  const encodedAddress = address.replace(/\s+/g, '+');
  const directionsBtn = instantiateButton(ctx?.uiverse, content.ctaText || 'Get Directions', {
    variant: 'primary',
    href: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
  });

  const html = `<!-- Map Section -->
<section class="map-section section" id="map">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Find Us'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="map-wrapper animate-on-scroll">
      <div class="map-embed">
        <div class="map-placeholder" aria-label="Map showing business location">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" width="64" height="64">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <p class="map-placeholder-text">Interactive map</p>
        </div>
      </div>
      <div class="map-info-panel">
        <div class="map-address-icon">
          <img src="${resolveIconForKeyword('map-pin')}" alt="" width="24" height="24" class="map-icon-img" />
        </div>
        <p class="map-address">${address}</p>
        <div class="map-directions-btn">
          ${directionsBtn}
        </div>
      </div>
    </div>
  </div>
</section>`;

  const css = `/* Map Section */
.map-section { padding: var(--space-5xl) 0; }

.map-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  margin-top: var(--space-3xl);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-neutral-200);
  background: var(--color-neutral-50);
}

@media (min-width: 768px) {
  .map-wrapper {
    grid-template-columns: 1.5fr 1fr;
  }
}

.map-embed {
  min-height: 300px;
  background: var(--color-neutral-200);
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-placeholder {
  text-align: center;
  color: var(--color-neutral-500);
  padding: var(--space-xl);
}

.map-placeholder svg {
  margin: 0 auto var(--space-md);
  opacity: 0.5;
}

.map-placeholder-text {
  font-size: var(--fs-small);
  color: var(--color-neutral-400);
}

.map-info-panel {
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-md);
}

.map-address-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-primary);
}

.map-icon-img {
  filter: brightness(0) invert(1);
}

.map-address {
  font-size: var(--fs-h4);
  color: var(--color-neutral-700);
  line-height: 1.6;
}

.map-directions-btn {
  margin-top: var(--space-sm);
}`;

  return { html, css, js: '' };
}

// ─── Contact Info Section ────────────────────────────────────────────────────

function generateInfoSection(
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  const items = content.items || [];

  const cardsHtml = items.map((item, i) => {
    const iconUrl = resolveIconForKeyword(item.icon || item.title.toLowerCase());
    return `
      <div class="info-card animate-on-scroll" style="transition-delay: ${i * 100}ms">
        <div class="info-card-icon">
          <img src="${iconUrl}" alt="" width="24" height="24" class="info-icon-img" />
        </div>
        <h3 class="info-card-title">${item.title}</h3>
        <p class="info-card-detail">${item.description}</p>
      </div>`;
  }).join('\n');

  const colCount = Math.min(items.length, 4);

  const html = `<!-- Contact Info Section -->
<section class="info-section section" id="info">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${content.headline || 'Contact Information'}</h2>
      ${content.subheadline ? `<p class="section-subtitle">${content.subheadline}</p>` : ''}
    </div>
    <div class="info-grid stagger-children">
${cardsHtml}
    </div>
  </div>
</section>`;

  const css = `/* Contact Info Section */
.info-section { padding: var(--space-5xl) 0; }

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-xl);
  margin-top: var(--space-3xl);
}

@media (min-width: 640px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .info-grid {
    grid-template-columns: repeat(${colCount}, 1fr);
  }
}

.info-card {
  text-align: center;
  padding: var(--space-2xl);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.info-card-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  margin: 0 auto var(--space-lg);
  transition: transform var(--transition-base);
}

.info-card:hover .info-card-icon {
  transform: scale(1.1);
}

.info-icon-img {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}

.info-card-title {
  font-family: var(--font-heading);
  font-size: var(--fs-h4);
  font-weight: 600;
  color: var(--color-neutral-900);
  margin-bottom: var(--space-sm);
}

.info-card-detail {
  font-size: var(--fs-body);
  color: var(--color-neutral-600);
  line-height: 1.6;
}`;

  return { html, css, js: '' };
}

// ─── Generic fallback ───────────────────────────────────────────────────────

// Meaningful fallback descriptions for section types without dedicated generators
const GENERIC_SECTION_CONTENT: Record<string, { headline: string; description: string }> = {
  'categories': { headline: 'Browse Categories', description: 'Explore our curated categories to find exactly what you\'re looking for.' },
  'filters': { headline: 'Refine Your Search', description: 'Use filters to narrow down results by price, rating, category, and more.' },
  'pagination': { headline: 'Browse More', description: 'Navigate through our full collection of products and services.' },
  'product-gallery': { headline: 'Product Gallery', description: 'View detailed images from every angle to make an informed choice.' },
  'product-info': { headline: 'Product Details', description: 'Complete specifications, materials, and sizing information.' },
  'reviews': { headline: 'Customer Reviews', description: 'Read authentic reviews from verified customers who purchased this product.' },
  'related-products': { headline: 'You May Also Like', description: 'Curated recommendations based on your current selection.' },
  'cart-items': { headline: 'Your Shopping Cart', description: 'Review your selected items before proceeding to checkout.' },
  'cart-summary': { headline: 'Order Summary', description: 'Your subtotal, shipping, and estimated total at a glance.' },
  'recommended': { headline: 'Recommended For You', description: 'Handpicked suggestions based on your shopping preferences.' },
  'sidebar': { headline: 'Quick Navigation', description: 'Jump to specific sections or filter content.' },
  'social-links': { headline: 'Connect With Us', description: 'Follow us on social media for the latest updates and behind-the-scenes content.' },
  'mission-values': { headline: 'Our Mission & Values', description: 'The principles that guide everything we do.' },
  'milestones': { headline: 'Our Journey', description: 'Key moments that shaped who we are today.' },
  'company-story': { headline: 'Our Story', description: 'How it all began and where we\'re headed next.' },
  'process': { headline: 'Our Process', description: 'A transparent look at how we deliver results.' },
  'case-studies': { headline: 'Case Studies', description: 'Real results from real clients — see the impact of our work.' },
  'office-locations': { headline: 'Our Offices', description: 'Find the location nearest to you.' },
  'bio': { headline: 'About the Author', description: 'Learn more about the person behind the content.' },
  'experience': { headline: 'Experience', description: 'Professional background and expertise.' },
  'article-content': { headline: 'Article', description: 'Full article content.' },
  'author-bio': { headline: 'About the Author', description: 'Background and expertise of the author.' },
  'related-posts': { headline: 'Related Articles', description: 'More articles you might enjoy reading.' },
  'comments': { headline: 'Comments', description: 'Join the conversation below.' },
  'feature-comparison': { headline: 'Compare Plans', description: 'See what\'s included in each plan at a glance.' },
  'support-info': { headline: 'Support', description: 'Get help when you need it — our team is here for you.' },
  'date-range': { headline: 'Date Range', description: 'Select a time period to view your data.' },
  'export': { headline: 'Export Data', description: 'Download your data in various formats.' },
  'chart-grid': { headline: 'Analytics Overview', description: 'Visual insights into your key performance metrics.' },
  'profile-form': { headline: 'Profile Settings', description: 'Update your personal information and preferences.' },
  'preferences': { headline: 'Preferences', description: 'Customize your experience.' },
  'notifications': { headline: 'Notifications', description: 'Manage your notification preferences.' },
  'security': { headline: 'Security', description: 'Manage passwords, two-factor authentication, and security settings.' },
  'user-table': { headline: 'User Management', description: 'View, search, and manage user accounts.' },
  'search': { headline: 'Search', description: 'Find what you\'re looking for quickly.' },
  'quick-actions': { headline: 'Quick Actions', description: 'Frequently used actions at your fingertips.' },
  'recent-activity': { headline: 'Recent Activity', description: 'See what\'s been happening across your workspace.' },
  'map': { headline: 'Find Us', description: 'Visit us at our location — we\'d love to see you in person.' },
};

function generateGenericSection(
  sectionType: string,
  content: SectionContent,
  sectionIndex: number,
  ctx?: SectionContext
): { html: string; css: string; js: string } {
  // Use provided content, then section-specific defaults, then format the type name
  const defaults = GENERIC_SECTION_CONTENT[sectionType];
  const headline = content.headline || (defaults?.headline) || formatSectionName(sectionType);
  const subtitle = content.subheadline || '';
  const description = content.description || (defaults?.description) || '';

  const html = `<!-- ${formatSectionName(sectionType)} Section -->
<section class="${sectionType}-section section" id="${sectionType}">
  <div class="container">
    <div class="section-header animate-on-scroll">
      <h2 class="section-title">${headline}</h2>
      ${subtitle ? `<p class="section-subtitle">${subtitle}</p>` : ''}
    </div>
    <div class="section-content animate-on-scroll">
      ${description ? `<p>${description}</p>` : ''}
    </div>
  </div>
</section>`;

  const cssClass = sectionType;
  const css = `/* ${formatSectionName(sectionType)} Section */
.${cssClass}-section {
  padding: var(--space-5xl) 0;
}`;

  return { html, css, js: '' };
}

/** Converts "cart-items" → "Cart Items", "product-gallery" → "Product Gallery" */
function formatSectionName(sectionType: string): string {
  return sectionType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ─── Section Generator Dispatcher ───────────────────────────────────────────

/** Context passed to every section generator */
interface SectionContext {
  uiverse: UIverseComponentMap | null;
  images: ResolvedImage[] | null;
  pages?: PageInfo[] | null;
  currentPageSlug?: string | null;
  brandName?: string | null;
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
  // Restaurant / Food
  'menu-preview': generateMenuPreviewSection,
  'menu-items': generateMenuItemsSection,
  'menu-categories': generateMenuCategoriesSection,
  'specials': generateSpecialsSection,
  'reservation-form': generateReservationFormSection,
  'hours': generateHoursSection,
  'location': generateLocationSection,
  // Gallery
  'gallery': generateGallerySection,
  'photo-grid': generatePhotoGridSection,
  'lightbox': generateGallerySection,
  // E-commerce
  'product-grid': generateProductGridSection,
  'featured-products': generateProductGridSection,
  // Categories
  'categories': generateCategoriesSection,
  // Contact page
  'map': generateMapSection,
  'info': generateInfoSection,
  // Blog
  'blog-grid': generateBlogGridSection,
  'post-grid': generateBlogGridSection,
  'featured-posts': generateBlogGridSection,
  // Portfolio
  'project-grid': generateProjectGridSection,
  'featured-projects': generateProjectGridSection,
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
    pages: input.pages || null,
    currentPageSlug: input.currentPageSlug || null,
    brandName: input.brandName || null,
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

  if (uiverse && !input.skipUIverseInjection) {
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
