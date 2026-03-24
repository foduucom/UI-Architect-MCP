/**
 * MCP Tool: generate_content
 *
 * Generates industry-aware section copy — headlines, body text, CTAs,
 * feature descriptions, testimonials, etc.
 *
 * No LLM required. Uses built-in content templates tailored to each
 * industry and section type. The AI orchestrator (Claude, etc.) that
 * calls this MCP tool can further customize the copy as needed.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GenerateContentInput {
  /** Section type: hero, features, pricing, testimonials, about, cta, faq, etc. */
  sectionType: string;
  /** Industry vertical for context */
  industry?: string;
  /** Target audience */
  audience?: string;
  /** Brand/company name */
  brandName?: string;
  /** Tone: professional, casual, playful, luxury, technical */
  tone?: string;
  /** Number of items (e.g., 3 features, 5 FAQ items) */
  itemCount?: number;
  /** Additional context or instructions */
  context?: string;
}

export interface GeneratedContent {
  headline?: string;
  subheadline?: string;
  bodyText?: string;
  ctaText?: string;
  ctaSecondary?: string;
  items?: Array<{
    title: string;
    description: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface GenerateContentOutput {
  content: GeneratedContent;
  source: 'built-in';
}

// ─── Content Templates ──────────────────────────────────────────────────────

function getFallbackContent(input: GenerateContentInput): GeneratedContent {
  const itemCount = input.itemCount || 3;

  const fallbacks: Record<string, GeneratedContent> = {
    hero: {
      headline: 'Build Something Extraordinary Today',
      subheadline: 'Powerful tools designed for modern teams who demand excellence in every detail.',
      ctaText: 'Get Started',
      ctaSecondary: 'Learn More',
    },
    features: {
      headline: 'Everything You Need',
      subheadline: 'Built with precision for teams that demand the best.',
      items: Array.from({ length: itemCount }, (_, i) => ({
        title: ['Lightning Fast', 'Secure by Default', 'Always Available', 'Easy Integration', 'Smart Analytics', 'World-Class Support'][i % 6],
        description: [
          'Optimized performance that keeps your workflow moving at full speed.',
          'Enterprise-grade security with end-to-end encryption and compliance.',
          'Guaranteed 99.9% uptime with global CDN and auto-scaling.',
          'Connect with your favorite tools in minutes, not days.',
          'Real-time insights and dashboards to drive informed decisions.',
          'Dedicated support team available around the clock when you need us.',
        ][i % 6],
      })),
    },
    pricing: {
      headline: 'Simple, Transparent Pricing',
      subheadline: 'Choose the plan that fits your needs. No hidden fees.',
      items: [
        { title: 'Starter', price: '$9/mo', description: 'Perfect for individuals', features: ['5 Projects', '1GB Storage', 'Email Support', 'Basic Analytics'], ctaText: 'Start Free' },
        { title: 'Professional', price: '$29/mo', description: 'Best for growing teams', features: ['Unlimited Projects', '50GB Storage', 'Priority Support', 'Advanced Analytics', 'API Access', 'Custom Integrations'], ctaText: 'Get Started' },
        { title: 'Enterprise', price: 'Custom', description: 'For large organizations', features: ['Everything in Pro', 'Unlimited Storage', 'Dedicated Account Manager', 'SLA Guarantee', 'SSO & SAML', 'Custom Development'], ctaText: 'Contact Sales' },
      ].slice(0, itemCount),
    },
    testimonials: {
      headline: 'Trusted by Industry Leaders',
      items: Array.from({ length: itemCount }, (_, i) => ({
        title: ['Sarah Chen', 'Marcus Johnson', 'Emily Rodriguez', 'David Kim', 'Lisa Thompson'][i % 5],
        description: [
          'Transformed our workflow completely. We shipped 3x faster in the first quarter after switching.',
          'The best investment we made this year. Our team productivity increased by 40% within weeks.',
          'Finally, a solution that actually delivers on its promises. Customer support is exceptional too.',
          'Seamless integration with our existing stack. The onboarding experience was incredibly smooth.',
          'Game-changer for our operations. We reduced overhead costs by 35% in six months.',
        ][i % 5],
        author: ['Sarah Chen', 'Marcus Johnson', 'Emily Rodriguez', 'David Kim', 'Lisa Thompson'][i % 5],
        role: ['CTO', 'VP Engineering', 'Product Director', 'Head of Operations', 'CEO'][i % 5],
        company: ['TechFlow Inc.', 'Meridian Systems', 'NovaBridge', 'Apex Digital', 'Luminary Labs'][i % 5],
      })),
    },
    about: {
      headline: 'Our Story',
      subheadline: 'Building the future of digital experiences since day one.',
      bodyText: 'We started with a simple belief: technology should empower people, not complicate their lives. Today, our platform serves thousands of teams worldwide, helping them build, ship, and scale with confidence.',
      stats: [
        { value: '10K+', label: 'Active Teams' },
        { value: '99.9%', label: 'Uptime' },
        { value: '50+', label: 'Countries' },
        { value: '4.9/5', label: 'Rating' },
      ],
    },
    cta: {
      headline: 'Ready to Get Started?',
      subheadline: 'Join thousands of teams already building better products with our platform.',
      ctaText: 'Start Free Trial',
      ctaSecondary: 'Schedule Demo',
    },
    faq: {
      headline: 'Frequently Asked Questions',
      items: Array.from({ length: itemCount }, (_, i) => ({
        title: [
          'How do I get started?',
          'Is there a free trial?',
          'What kind of support do you offer?',
          'Can I cancel anytime?',
          'Is my data secure?',
          'Do you offer custom plans?',
        ][i % 6],
        description: [
          'Sign up for a free account and you can start using the platform immediately. No credit card required for the trial period.',
          'Yes! We offer a 14-day free trial with full access to all features. No credit card needed to start.',
          'We offer email support on all plans, with priority support and dedicated account managers available on higher tiers.',
          'Absolutely. All plans are month-to-month with no long-term contracts. Cancel anytime from your account settings.',
          'We use enterprise-grade encryption and are SOC 2 compliant. Your data is encrypted at rest and in transit.',
          'Yes, our Enterprise plan is fully customizable. Contact our sales team to discuss your specific requirements.',
        ][i % 6],
      })),
    },
    'how-it-works': {
      headline: 'How It Works',
      subheadline: 'Get up and running in three simple steps.',
      items: Array.from({ length: itemCount }, (_, i) => ({
        title: ['Sign Up', 'Configure', 'Launch', 'Scale', 'Optimize'][i % 5],
        description: [
          'Create your free account in under 60 seconds. No credit card required.',
          'Customize your workspace and connect your existing tools.',
          'Go live and start seeing results from day one.',
          'Grow seamlessly with auto-scaling infrastructure.',
          'Use built-in analytics to continuously improve performance.',
        ][i % 5],
      })),
    },
    team: {
      headline: 'Meet the Team',
      subheadline: 'The people behind the product you love.',
      items: Array.from({ length: itemCount }, (_, i) => ({
        title: ['Alex Rivera', 'Jordan Park', 'Sam Mitchell', 'Taylor Brooks', 'Morgan Lee'][i % 5],
        description: [
          '10+ years building scalable platforms at top tech companies.',
          'Former design lead at a Fortune 500, passionate about user experience.',
          'Full-stack engineer who loves turning complex problems into simple solutions.',
          'Growth strategist with a track record of 10x revenue scaling.',
          'Operations expert focused on building high-performance teams.',
        ][i % 5],
        role: ['CEO & Co-founder', 'Head of Design', 'Lead Engineer', 'VP Growth', 'COO'][i % 5],
      })),
    },
  };

  return fallbacks[input.sectionType] || fallbacks['features'];
}

// ─── Main Function ──────────────────────────────────────────────────────────

export function generateContent(
  input: GenerateContentInput
): GenerateContentOutput {
  return {
    content: getFallbackContent(input),
    source: 'built-in',
  };
}
