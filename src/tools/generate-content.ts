/**
 * MCP Tool: generate_content
 *
 * Generates industry-aware section copy — headlines, body text, CTAs,
 * feature descriptions, testimonials, etc.
 *
 * Uses a BUSINESS MODEL classifier instead of per-industry templates.
 * Any industry is classified into one of 4 models: product, service, saas, venue.
 * This makes the system handle ANY industry without manual template additions.
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

// ─── Business Model Classifier ──────────────────────────────────────────────

type BusinessModel = 'product' | 'service' | 'saas' | 'venue';

const MODEL_KEYWORDS: Record<BusinessModel, string[]> = {
  product: [
    'supplement', 'vitamin', 'ecommerce', 'shop', 'store', 'retail', 'fashion',
    'clothing', 'apparel', 'jewelry', 'beauty', 'cosmetics', 'skincare',
    'electronics', 'furniture', 'grocery', 'pet', 'toy', 'book', 'craft',
    'organic', 'nutrition', 'nutraceutical', 'merchandise', 'gadget',
    'shoe', 'accessory', 'watch', 'fragrance', 'candle', 'home decor',
    'plant', 'flower', 'art supply', 'sporting goods', 'outdoor gear',
  ],
  service: [
    'healthcare', 'health', 'medical', 'clinic', 'hospital', 'dental',
    'legal', 'law', 'attorney', 'consulting', 'agency', 'insurance',
    'accounting', 'financial', 'advisor', 'therapy', 'counseling',
    'veterinary', 'plumbing', 'electrical', 'cleaning', 'landscaping',
    'moving', 'photography', 'tutoring', 'coaching', 'coach', 'mentor', 'recruiting',
    'architecture', 'engineering', 'logistics', 'security', 'repair',
  ],
  saas: [
    'saas', 'software', 'platform', 'app', 'fintech', 'edtech', 'proptech',
    'martech', 'devtools', 'analytics', 'crm', 'erp', 'automation',
    'ai', 'machine learning', 'cloud', 'api', 'developer', 'startup',
    'tech', 'technology', 'data', 'cyber', 'iot', 'blockchain',
  ],
  venue: [
    'restaurant', 'cafe', 'coffee', 'bakery', 'bar', 'pub', 'brewery',
    'hotel', 'resort', 'spa', 'gym', 'fitness center', 'fitness', 'yoga',
    'salon', 'barbershop', 'cinema', 'theater', 'museum', 'gallery',
    'club', 'coworking', 'event space', 'wedding venue', 'winery',
    'food', 'dining', 'bistro', 'pizzeria', 'sushi', 'steakhouse',
  ],
};

function classifyBusinessModel(industry: string): BusinessModel {
  const lower = industry.toLowerCase();

  // Score each model by how many keywords match
  let bestModel: BusinessModel = 'service'; // default fallback — service is safer than saas for unknown industries
  let bestScore = 0;

  for (const [model, keywords] of Object.entries(MODEL_KEYWORDS) as [BusinessModel, string[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw) || kw.includes(lower)) {
        // Exact match gets more weight than substring
        score += (lower === kw) ? 10 : 5;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestModel = model;
    }
  }

  return bestModel;
}

// ─── Business Model Templates ───────────────────────────────────────────────

type SectionGenerator = (brand: string, count: number, industry: string) => GeneratedContent;

const MODEL_CONTENT: Record<BusinessModel, Record<string, SectionGenerator>> = {
  // ── PRODUCT MODEL ─────────────────────────────────────────────────────────
  product: {
    hero: (brand, _count, industry) => ({
      headline: `Discover ${brand}`,
      subheadline: `Premium ${industry} products crafted with care. Trusted by thousands of happy customers worldwide.`,
      ctaText: 'Shop Now',
      ctaSecondary: 'View Collection',
    }),
    features: (brand, count, _industry) => ({
      headline: `Why Choose ${brand}`,
      subheadline: 'Quality you can trust, results you can feel.',
      items: [
        { title: 'Premium Quality', description: 'Every product is carefully crafted and rigorously tested to meet the highest standards.' },
        { title: 'Natural Ingredients', description: 'Clean, transparent formulas with no artificial fillers or harmful additives.' },
        { title: 'Free Shipping', description: 'Fast, free shipping on all orders. Subscribe and save on repeat purchases.' },
        { title: 'Satisfaction Guaranteed', description: 'Not happy? Our hassle-free return policy has you covered — no questions asked.' },
        { title: 'Third-Party Tested', description: 'Independent lab testing ensures every product meets our strict quality benchmarks.' },
        { title: 'Eco-Friendly Packaging', description: 'Sustainably sourced and packaged with care for the planet.' },
      ].slice(0, count),
    }),
    testimonials: (_brand, count, _industry) => ({
      headline: 'Customer Reviews',
      items: [
        { title: 'Amanda Torres', description: 'I noticed a real difference within the first week. These products are the real deal.', author: 'Amanda Torres', role: 'Verified Buyer', company: '' },
        { title: 'David Park', description: 'Clean ingredients and great quality. Finally a brand I can trust completely.', author: 'David Park', role: 'Verified Buyer', company: '' },
        { title: 'Rachel Nguyen', description: 'Love the transparency and quality. I recommend this to everyone I know.', author: 'Rachel Nguyen', role: 'Repeat Customer', company: '' },
        { title: 'Marcus Bailey', description: 'Fast shipping, beautiful packaging, and the product exceeded my expectations.', author: 'Marcus Bailey', role: 'Verified Buyer', company: '' },
        { title: 'Sofia Reyes', description: 'Subscribed after my first order. Consistent quality every single time.', author: 'Sofia Reyes', role: 'Subscriber', company: '' },
      ].slice(0, count),
    }),
    about: (brand, _count, industry) => ({
      headline: `About ${brand}`,
      subheadline: `${brand} was founded with a simple mission: make premium ${industry} products accessible to everyone. We source the finest ingredients and never cut corners on quality.`,
      stats: [
        { value: '50K+', label: 'Happy Customers' },
        { value: '4.9/5', label: 'Average Rating' },
        { value: '100%', label: 'Quality Tested' },
        { value: '30-Day', label: 'Free Returns' },
      ],
    }),
    cta: (brand, _count, _industry) => ({
      headline: 'Ready to Experience the Difference?',
      subheadline: `Join thousands who trust ${brand} for quality they can feel.`,
      ctaText: 'Shop Now',
      ctaSecondary: 'Take Our Quiz',
    }),
    faq: (_brand, count, _industry) => ({
      headline: 'Frequently Asked Questions',
      items: [
        { title: 'What is your shipping policy?', description: 'We offer free standard shipping on all orders. Express and overnight options are available at checkout.' },
        { title: 'What is your return policy?', description: 'We offer a 30-day hassle-free return policy. If you are not satisfied, contact us for a full refund or exchange.' },
        { title: 'Are your products tested for quality?', description: 'Yes, every batch is independently tested to ensure it meets our strict quality and safety standards.' },
        { title: 'Do you offer subscriptions?', description: 'Yes! Subscribe and save up to 15% on every order with free shipping. Pause or cancel anytime.' },
      ].slice(0, count),
    }),
    pricing: (brand, count, _industry) => ({
      headline: 'Our Best Sellers',
      subheadline: `${brand}'s most popular products chosen by our customers.`,
      items: [
        { title: 'Starter Pack', price: '$29', description: 'Perfect for trying us out', features: ['1 Month Supply', 'Free Shipping', 'Satisfaction Guarantee'], ctaText: 'Add to Cart' },
        { title: 'Value Bundle', price: '$69', description: 'Our best value — save 20%', features: ['3 Month Supply', 'Free Shipping', 'Priority Support', 'Bonus Samples'], ctaText: 'Best Value' },
        { title: 'Subscribe & Save', price: '$24/mo', description: 'Never run out again', features: ['Monthly Delivery', 'Free Shipping', '15% Off Forever', 'Cancel Anytime'], ctaText: 'Subscribe' },
      ].slice(0, count),
    }),
    'how-it-works': (_brand, count, _industry) => ({
      headline: 'How It Works',
      subheadline: 'Getting started is simple.',
      items: [
        { title: 'Choose Your Products', description: 'Browse our collection and find the perfect products for your needs.' },
        { title: 'Place Your Order', description: 'Check out securely — every order ships free with tracking.' },
        { title: 'Enjoy the Results', description: 'Experience the difference that premium quality makes in your daily life.' },
      ].slice(0, count),
    }),
    team: (brand, count, _industry) => ({
      headline: `The Team Behind ${brand}`,
      subheadline: 'Passionate people committed to quality.',
      items: [
        { title: 'Alex Rivera', description: 'Founder with a decade of experience in product development and quality sourcing.', role: 'Founder & CEO' },
        { title: 'Dr. Priya Sharma', description: 'Leads our R&D team, ensuring every formula is science-backed and effective.', role: 'Head of R&D' },
        { title: 'Jordan Kim', description: 'Oversees supply chain and ensures our sustainability commitments are met.', role: 'Operations Director' },
        { title: 'Maria Santos', description: 'Curates our product line and builds partnerships with premium suppliers.', role: 'Product Manager' },
      ].slice(0, count),
    }),
    'product-grid': (_brand, count, _industry) => ({
      headline: 'Trending Products',
      subheadline: `Handpicked favorites our customers can't stop talking about.`,
      items: [
        { title: 'Best Seller', description: 'Our most popular product — loved by thousands of happy customers.', badge: 'Best Seller' },
        { title: 'New Arrival', description: 'Fresh from our latest collection — be the first to get it.', badge: 'New' },
        { title: 'Staff Pick', description: 'Hand-selected by our team for outstanding quality and value.', badge: 'Staff Pick' },
        { title: 'Limited Edition', description: 'Exclusive design available for a limited time only.', badge: 'Limited' },
        { title: 'Top Rated', description: 'Consistently rated 5 stars by our community of shoppers.', badge: 'Top Rated' },
        { title: 'Great Value', description: 'Premium quality at an unbeatable price point.', badge: 'Value' },
      ].slice(0, count),
      ctaText: 'View All Products',
    }),
    categories: (_brand, count, _industry) => ({
      headline: 'Shop by Category',
      subheadline: 'Find exactly what you\'re looking for in our curated collections.',
      items: [
        { title: 'Electronics', description: 'Gadgets, audio, and smart devices for modern living.' },
        { title: 'Fashion', description: 'Clothing, accessories, and footwear for every style.' },
        { title: 'Home & Garden', description: 'Everything to make your space beautiful and functional.' },
        { title: 'Sports & Outdoors', description: 'Gear and apparel for active lifestyles.' },
        { title: 'Beauty & Wellness', description: 'Skincare, cosmetics, and self-care essentials.' },
        { title: 'Toys & Games', description: 'Fun for all ages — games, puzzles, and more.' },
      ].slice(0, count),
    }),
    deals: (brand, _count, _industry) => ({
      headline: 'Flash Sale — Up to 60% Off',
      subheadline: `Don't miss out on ${brand}'s biggest deals of the season. Premium products at unbelievable prices — limited time only!`,
      ctaText: 'Shop the Sale',
    }),
    'special-offers': (brand, _count, _industry) => ({
      headline: 'Special Offers',
      subheadline: `Exclusive deals and discounts — only at ${brand}. Grab them before they're gone!`,
      ctaText: 'View Offers',
    }),
    newsletter: (brand, _count, _industry) => ({
      headline: 'Get Exclusive Deals',
      subheadline: `Subscribe to the ${brand} newsletter and get 15% off your first order plus early access to sales.`,
      ctaText: 'Subscribe',
    }),
    cart: (_brand, _count, _industry) => ({
      headline: 'Your Shopping Cart',
      subheadline: 'Review your items and proceed to checkout.',
      ctaText: 'Proceed to Checkout',
      ctaSecondary: 'Continue Shopping',
    }),
  },

  // ── SERVICE MODEL ─────────────────────────────────────────────────────────
  service: {
    hero: (brand, _count, industry) => ({
      headline: `Your Trusted ${capitalize(industry)} Partner`,
      subheadline: `${brand} delivers expert ${industry} services backed by years of experience. Trusted by thousands of satisfied clients.`,
      ctaText: 'Book Consultation',
      ctaSecondary: 'Our Services',
    }),
    features: (brand, count, _industry) => ({
      headline: `Why Choose ${brand}`,
      subheadline: 'Excellence in every interaction.',
      items: [
        { title: 'Expert Team', description: 'Certified professionals with decades of combined experience in their fields.' },
        { title: 'Personalized Approach', description: 'Every client receives a tailored plan designed around their unique needs and goals.' },
        { title: 'Proven Results', description: 'A track record of successful outcomes and satisfied clients who keep coming back.' },
        { title: 'Transparent Process', description: 'Clear communication and no surprises — you always know what to expect.' },
        { title: 'Flexible Scheduling', description: 'Convenient appointment times including evenings and weekends to fit your life.' },
        { title: 'Modern Technology', description: 'State-of-the-art tools and techniques to deliver the best possible results.' },
      ].slice(0, count),
    }),
    testimonials: (_brand, count, _industry) => ({
      headline: 'What Our Clients Say',
      items: [
        { title: 'Robert Miller', description: 'The entire team made me feel comfortable and taken care of throughout the process.', author: 'Robert Miller', role: 'Client', company: '' },
        { title: 'Jennifer Lee', description: 'Professional, thorough, and genuinely caring. I recommend them to everyone.', author: 'Jennifer Lee', role: 'Client', company: '' },
        { title: 'Thomas Brown', description: 'Finally found a team that listens. My experience has been excellent from day one.', author: 'Thomas Brown', role: 'Client', company: '' },
        { title: 'Linda Martinez', description: 'They exceeded every expectation. Transparent pricing and outstanding results.', author: 'Linda Martinez', role: 'Referred Client', company: '' },
        { title: 'Kevin Zhao', description: 'The best decision I made this year. Wish I had found them sooner.', author: 'Kevin Zhao', role: 'Client', company: '' },
      ].slice(0, count),
    }),
    about: (brand, _count, industry) => ({
      headline: `About ${brand}`,
      subheadline: `${brand} has been providing exceptional ${industry} services for over a decade. Our team of specialists is dedicated to improving lives through expert, personalized care.`,
      stats: [
        { value: '15+', label: 'Years Experience' },
        { value: '10K+', label: 'Clients Served' },
        { value: '4.9/5', label: 'Client Rating' },
        { value: '98%', label: 'Satisfaction Rate' },
      ],
    }),
    cta: (brand, _count, _industry) => ({
      headline: 'Ready to Get Started?',
      subheadline: `Take the first step. ${brand} is accepting new clients.`,
      ctaText: 'Book Consultation',
      ctaSecondary: 'Call Us',
    }),
    faq: (_brand, count, _industry) => ({
      headline: 'Frequently Asked Questions',
      items: [
        { title: 'How do I schedule a consultation?', description: 'You can book online through our website, call our front desk, or use our virtual scheduling system.' },
        { title: 'What should I expect at my first visit?', description: 'We will review your needs, discuss your goals, and create a personalized plan during your initial consultation.' },
        { title: 'Do you offer virtual consultations?', description: 'Yes, we offer convenient video consultations for follow-ups and initial assessments.' },
        { title: 'What are your hours of operation?', description: 'We are open Monday through Friday 9am-6pm, with evening and weekend appointments available by request.' },
      ].slice(0, count),
    }),
    pricing: (brand, count, _industry) => ({
      headline: 'Our Service Plans',
      subheadline: `${brand} offers flexible plans to meet your needs.`,
      items: [
        { title: 'Basic', price: '$99', description: 'Single consultation', features: ['Initial Assessment', '1-Hour Session', 'Follow-Up Report', 'Email Support'], ctaText: 'Book Now' },
        { title: 'Standard', price: '$249/mo', description: 'Ongoing support', features: ['Monthly Sessions', 'Priority Scheduling', 'Phone Support', 'Progress Tracking'], ctaText: 'Get Started' },
        { title: 'Premium', price: '$499/mo', description: 'Comprehensive care', features: ['Weekly Sessions', 'Dedicated Specialist', '24/7 Support', 'Custom Reports', 'Virtual Check-Ins'], ctaText: 'Contact Us' },
      ].slice(0, count),
    }),
    'how-it-works': (_brand, count, _industry) => ({
      headline: 'How It Works',
      subheadline: 'A simple, transparent process from start to finish.',
      items: [
        { title: 'Book a Consultation', description: 'Schedule your free initial consultation online or by phone.' },
        { title: 'Get a Custom Plan', description: 'We assess your needs and create a personalized plan just for you.' },
        { title: 'See Real Results', description: 'Follow your plan with ongoing support and watch the results unfold.' },
      ].slice(0, count),
    }),
    team: (brand, count, _industry) => ({
      headline: `Meet the ${brand} Team`,
      subheadline: 'Experienced professionals dedicated to your success.',
      items: [
        { title: 'Dr. Sarah Mitchell', description: 'Founder with 20+ years of experience and a passion for client outcomes.', role: 'Founder & Director' },
        { title: 'James Carter', description: 'Leads our client success team ensuring every interaction exceeds expectations.', role: 'Client Relations' },
        { title: 'Dr. Priya Nair', description: 'Specialist bringing deep expertise and a compassionate approach to every case.', role: 'Senior Specialist' },
        { title: 'Michael Torres', description: 'Ensures smooth operations so the team can focus on what matters most — you.', role: 'Operations Manager' },
      ].slice(0, count),
    }),
  },

  // ── SAAS MODEL ────────────────────────────────────────────────────────────
  saas: {
    hero: (brand, _count, _industry) => ({
      headline: `Welcome to ${brand}`,
      subheadline: 'Powerful tools designed for modern teams who demand excellence in every detail.',
      ctaText: 'Get Started',
      ctaSecondary: 'Learn More',
    }),
    features: (_brand, count, _industry) => ({
      headline: 'Built for Modern Teams',
      subheadline: 'Powerful tools crafted with precision for teams that demand the best.',
      items: [
        { title: 'Lightning Fast', description: 'Optimized performance that keeps your workflow moving at full speed.' },
        { title: 'Secure by Default', description: 'Enterprise-grade security with end-to-end encryption and compliance.' },
        { title: 'Always Available', description: 'Guaranteed 99.9% uptime with global CDN and auto-scaling.' },
        { title: 'Easy Integration', description: 'Connect with your favorite tools in minutes, not days.' },
        { title: 'Smart Analytics', description: 'Real-time insights and dashboards to drive informed decisions.' },
        { title: 'World-Class Support', description: 'Dedicated support team available around the clock when you need us.' },
      ].slice(0, count),
    }),
    testimonials: (_brand, count, _industry) => ({
      headline: 'Trusted by Industry Leaders',
      items: [
        { title: 'Sarah Chen', description: 'Transformed our workflow completely. We shipped 3x faster in the first quarter after switching.', author: 'Sarah Chen', role: 'CTO', company: 'TechFlow Inc.' },
        { title: 'Marcus Johnson', description: 'The best investment we made this year. Our team productivity increased by 40% within weeks.', author: 'Marcus Johnson', role: 'VP Engineering', company: 'Meridian Systems' },
        { title: 'Emily Rodriguez', description: 'Finally, a solution that actually delivers on its promises. Customer support is exceptional too.', author: 'Emily Rodriguez', role: 'Product Director', company: 'NovaBridge' },
        { title: 'David Kim', description: 'Seamless integration with our existing stack. The onboarding experience was incredibly smooth.', author: 'David Kim', role: 'Head of Operations', company: 'Apex Digital' },
        { title: 'Lisa Thompson', description: 'Game-changer for our operations. We reduced overhead costs by 35% in six months.', author: 'Lisa Thompson', role: 'CEO', company: 'Luminary Labs' },
      ].slice(0, count),
    }),
    about: (brand, _count, _industry) => ({
      headline: 'Our Story',
      subheadline: 'Building the future of digital experiences since day one.',
      bodyText: `We started with a simple belief: technology should empower people, not complicate their lives. Today, ${brand} serves thousands of teams worldwide, helping them build, ship, and scale with confidence.`,
      stats: [
        { value: '10K+', label: 'Active Teams' },
        { value: '99.9%', label: 'Uptime' },
        { value: '50+', label: 'Countries' },
        { value: '4.9/5', label: 'Rating' },
      ],
    }),
    cta: (brand, _count, _industry) => ({
      headline: 'Ready to Get Started?',
      subheadline: `Join thousands of teams already building better products with ${brand}.`,
      ctaText: 'Start Free Trial',
      ctaSecondary: 'Schedule Demo',
    }),
    faq: (_brand, count, _industry) => ({
      headline: 'Frequently Asked Questions',
      items: [
        { title: 'How do I get started?', description: 'Sign up for a free account and start using the platform immediately. No credit card required for the trial period.' },
        { title: 'Is there a free trial?', description: 'Yes! We offer a 14-day free trial with full access to all features. No credit card needed to start.' },
        { title: 'What kind of support do you offer?', description: 'We offer email support on all plans, with priority support and dedicated account managers available on higher tiers.' },
        { title: 'Can I cancel anytime?', description: 'Absolutely. All plans are month-to-month with no long-term contracts. Cancel anytime from your account settings.' },
      ].slice(0, count),
    }),
    pricing: (_brand, count, _industry) => ({
      headline: 'Simple, Transparent Pricing',
      subheadline: 'Choose the plan that fits your needs. No hidden fees.',
      items: [
        { title: 'Starter', price: '$9/mo', description: 'Perfect for individuals', features: ['5 Projects', '1GB Storage', 'Email Support', 'Basic Analytics'], ctaText: 'Start Free' },
        { title: 'Professional', price: '$29/mo', description: 'Best for growing teams', features: ['Unlimited Projects', '50GB Storage', 'Priority Support', 'Advanced Analytics', 'API Access'], ctaText: 'Get Started' },
        { title: 'Enterprise', price: 'Custom', description: 'For large organizations', features: ['Everything in Pro', 'Unlimited Storage', 'Dedicated Account Manager', 'SLA Guarantee', 'SSO & SAML'], ctaText: 'Contact Sales' },
      ].slice(0, count),
    }),
    'how-it-works': (_brand, count, _industry) => ({
      headline: 'How It Works',
      subheadline: 'Get up and running in three simple steps.',
      items: [
        { title: 'Sign Up', description: 'Create your free account in under 60 seconds. No credit card required.' },
        { title: 'Configure', description: 'Customize your workspace and connect your existing tools.' },
        { title: 'Launch', description: 'Go live and start seeing results from day one.' },
      ].slice(0, count),
    }),
    team: (_brand, count, _industry) => ({
      headline: 'Meet the Team',
      subheadline: 'The people behind the product you love.',
      items: [
        { title: 'Alex Rivera', description: '10+ years building scalable platforms at top tech companies.', role: 'CEO & Co-founder' },
        { title: 'Jordan Park', description: 'Former design lead at a Fortune 500, passionate about user experience.', role: 'Head of Design' },
        { title: 'Sam Mitchell', description: 'Full-stack engineer who loves turning complex problems into simple solutions.', role: 'Lead Engineer' },
        { title: 'Taylor Brooks', description: 'Growth strategist with a track record of 10x revenue scaling.', role: 'VP Growth' },
      ].slice(0, count),
    }),
  },

  // ── VENUE MODEL ───────────────────────────────────────────────────────────
  venue: {
    hero: (brand, _count, _industry) => ({
      headline: `Welcome to ${brand}`,
      subheadline: 'An unforgettable experience crafted with passion, care, and attention to every detail.',
      ctaText: 'Reserve Now',
      ctaSecondary: 'View Menu',
    }),
    features: (brand, count, _industry) => ({
      headline: `Why Choose ${brand}`,
      subheadline: 'Every detail crafted with care and passion.',
      items: [
        { title: 'Premium Experience', description: 'Every visit is thoughtfully designed to delight all your senses.' },
        { title: 'Expert Team', description: 'Passionate professionals who bring years of expertise to everything they do.' },
        { title: 'Warm Atmosphere', description: 'A cozy, welcoming space designed for memorable moments with loved ones.' },
        { title: 'Seasonal Offerings', description: 'Rotating selections that celebrate the best of each season.' },
        { title: 'Dietary Options', description: 'Thoughtful accommodations for all dietary needs and preferences.' },
        { title: 'Private Events', description: 'Beautiful spaces available for your special occasions and celebrations.' },
      ].slice(0, count),
    }),
    testimonials: (_brand, count, _industry) => ({
      headline: 'What Our Guests Say',
      items: [
        { title: 'Maria Santos', description: 'The most memorable experience. Every detail was absolutely perfect.', author: 'Maria Santos', role: 'Regular Guest', company: '' },
        { title: 'James Wilson', description: 'We celebrate every family occasion here. The staff makes us feel like family.', author: 'James Wilson', role: 'Regular Guest', company: '' },
        { title: 'Sophie Laurent', description: 'Incredible quality, beautiful atmosphere, and the warmest hospitality. A must-visit.', author: 'Sophie Laurent', role: 'Reviewer', company: '' },
        { title: 'David Park', description: 'Best experience in the city, hands down. Worth every visit.', author: 'David Park', role: 'Local Resident', company: '' },
        { title: 'Anna Chen', description: 'Perfect for special occasions. The ambiance creates such a wonderful atmosphere.', author: 'Anna Chen', role: 'Regular Guest', company: '' },
      ].slice(0, count),
    }),
    about: (brand, _count, _industry) => ({
      headline: 'Our Story',
      subheadline: `The heart and soul behind ${brand}.`,
      bodyText: `${brand} was born from a simple passion: creating experiences that bring people together. What started as a dream has grown into a beloved destination where every visit is crafted with love, care, and dedication to quality.`,
      stats: [
        { value: '10+', label: 'Years Serving' },
        { value: '50K+', label: 'Happy Guests' },
        { value: '200+', label: 'Offerings' },
        { value: '4.8/5', label: 'Rating' },
      ],
    }),
    cta: (brand, _count, _industry) => ({
      headline: 'Ready for an Unforgettable Experience?',
      subheadline: `Visit ${brand} and discover why our guests keep coming back.`,
      ctaText: 'Reserve Now',
      ctaSecondary: 'Contact Us',
    }),
    faq: (_brand, count, _industry) => ({
      headline: 'Frequently Asked Questions',
      items: [
        { title: 'Do you take reservations?', description: 'Yes! We recommend booking in advance, especially for weekends. You can reserve online or call us directly.' },
        { title: 'Do you accommodate special requests?', description: 'Absolutely. Please let us know about any dietary needs, accessibility requirements, or special occasions in advance.' },
        { title: 'Is there parking available?', description: 'Yes, we offer complimentary parking on weekends and free lot parking on weekdays.' },
        { title: 'Do you host private events?', description: 'We have beautiful private spaces available for groups. Contact us for event inquiries and custom packages.' },
      ].slice(0, count),
    }),
    pricing: (brand, count, _industry) => ({
      headline: 'Our Experiences',
      subheadline: `Choose from ${brand}'s curated offerings.`,
      items: [
        { title: 'Classic', price: '$49/person', description: 'The essential experience', features: ['Standard Seating', 'Full Menu Access', 'House Selections'], ctaText: 'Reserve' },
        { title: 'Premium', price: '$89/person', description: 'The elevated experience', features: ['Premium Seating', 'Chef\'s Specials', 'Curated Pairings', 'Priority Service'], ctaText: 'Reserve' },
        { title: 'Private', price: 'Custom', description: 'Exclusive group experience', features: ['Private Space', 'Custom Menu', 'Dedicated Staff', 'Event Coordinator'], ctaText: 'Inquire' },
      ].slice(0, count),
    }),
    'how-it-works': (_brand, count, _industry) => ({
      headline: 'Plan Your Visit',
      subheadline: 'Making your experience effortless from start to finish.',
      items: [
        { title: 'Make a Reservation', description: 'Book your preferred date and time online or by phone.' },
        { title: 'Arrive & Enjoy', description: 'Our team welcomes you and ensures every detail is taken care of.' },
        { title: 'Leave Happy', description: 'Take home wonderful memories and a reason to come back soon.' },
      ].slice(0, count),
    }),
    team: (brand, count, _industry) => ({
      headline: 'Meet Our Team',
      subheadline: `The talented people behind ${brand}.`,
      items: [
        { title: 'Marco Rivera', description: 'Award-winning leader with 15 years of industry experience and innovation.', role: 'Director' },
        { title: 'Sofia Chen', description: 'Creative visionary bringing artistry and passion to every detail.', role: 'Creative Lead' },
        { title: 'James Okafor', description: 'Expert curator ensuring every guest receives a world-class experience.', role: 'Experience Manager' },
        { title: 'Elena Vasquez', description: 'Warm hospitality leader ensuring every guest feels at home.', role: 'General Manager' },
      ].slice(0, count),
    }),
  },
};

// ─── Helper ─────────────────────────────────────────────────────────────────

function capitalize(str: string): string {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Content Generator ──────────────────────────────────────────────────────

function getFallbackContent(input: GenerateContentInput): GeneratedContent {
  const itemCount = input.itemCount || 3;
  const brand = input.brandName || 'Our Company';
  const industry = (input.industry || '').toLowerCase();

  // Classify industry into business model
  const model = classifyBusinessModel(industry);

  // Get template from the matched model
  const modelTemplates = MODEL_CONTENT[model];
  const generator = modelTemplates[input.sectionType];

  if (generator) {
    return generator(brand, itemCount, industry || model);
  }

  // Section type not found in model — shouldn't happen since all models have all sections
  // but fallback to saas model just in case
  const saasGenerator = MODEL_CONTENT['saas'][input.sectionType];
  if (saasGenerator) {
    return saasGenerator(brand, itemCount, industry || 'technology');
  }

  // Final fallback — return a generic features section
  return MODEL_CONTENT['saas']['features'](brand, itemCount, 'technology');
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
