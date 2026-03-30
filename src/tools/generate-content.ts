/**
 * MCP Tool: generate_content
 *
 * Generates industry-aware section copy — headlines, body text, CTAs,
 * feature descriptions, testimonials, etc.
 *
 * Uses a BUSINESS MODEL classifier instead of per-industry templates.
 * Any industry is classified into one of 4 models: product, service, saas, venue.
 * This makes the system handle ANY industry without manual template additions.
 *
 * Pattern-aware fallback: When a section type has no direct content generator,
 * the section classifier identifies the structural pattern (grid, detail, review, etc.)
 * and maps it to an appropriate content generator. This ensures every section type
 * gets meaningful content regardless of whether it was explicitly templated.
 */

import { classifySection, getContentFallbackForPattern } from '../engine/section-classifier.js';
import { classifyBusinessModel, classifyVenueSubtype, MODEL_KEYWORDS, type BusinessModel, type VenueSubtype } from '../engine/business-model.js';

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
  /** Variation index for content rotation (prevents repeated content across pages) */
  variationIndex?: number;
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

// ─── Business Model Classifier (imported from shared module) ────────────────
// classifyBusinessModel, MODEL_KEYWORDS, and BusinessModel are imported from
// ../engine/business-model.ts — single source of truth across the pipeline.

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
    'checkout-form': (brand, _count, _industry) => ({
      headline: 'Secure Checkout',
      subheadline: `Complete your ${brand} order. Your information is protected with 256-bit SSL encryption.`,
      ctaText: 'Place Order',
      items: [
        { title: 'Full Name', description: 'Enter your full name' },
        { title: 'Email Address', description: 'We\'ll send your confirmation here' },
        { title: 'Phone Number', description: 'For delivery updates' },
        { title: 'Shipping Address', description: 'Street address, apartment, suite' },
        { title: 'Card Number', description: 'Credit or debit card' },
        { title: 'Expiry & CVV', description: 'MM/YY and security code' },
      ],
    }),
    'order-summary': (_brand, _count, _industry) => ({
      headline: 'Order Summary',
      subheadline: 'Review your order before placing it.',
      ctaText: 'Place Order',
      items: [
        { title: 'Premium Wireless Headphones', description: 'Black · Qty: 1', price: '$129.99' },
        { title: 'Organic Cotton T-Shirt', description: 'White · Size M · Qty: 2', price: '$59.98' },
        { title: 'Stainless Steel Water Bottle', description: '750ml · Qty: 1', price: '$34.99' },
      ],
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

  // ── VENUE MODEL — subtype-aware for food/fitness/wellness/hospitality/entertainment ──
  venue: {
    hero: (brand, _count, industry) => {
      const sub = classifyVenueSubtype(industry);
      const V: Record<VenueSubtype, { ctaText: string; ctaSecondary: string; sub: string }> = {
        food:          { ctaText: 'Reserve Now',      ctaSecondary: 'View Menu',      sub: 'An unforgettable dining experience crafted with passion and the finest ingredients.' },
        fitness:       { ctaText: 'Start Training',   ctaSecondary: 'View Classes',   sub: 'Transform your body and mind with expert-led training and a supportive community.' },
        wellness:      { ctaText: 'Book Appointment',  ctaSecondary: 'View Services',  sub: 'Relax, rejuvenate, and look your best with our expert care and premium treatments.' },
        hospitality:   { ctaText: 'Book Your Stay',   ctaSecondary: 'View Rooms',     sub: 'Your perfect getaway awaits — exceptional comfort, service, and unforgettable experiences.' },
        entertainment: { ctaText: 'Get Tickets',      ctaSecondary: 'View Showtimes', sub: 'Immersive experiences that captivate, entertain, and create lasting memories.' },
        general:       { ctaText: 'Visit Us',         ctaSecondary: 'Learn More',     sub: 'An unforgettable experience crafted with passion, care, and attention to every detail.' },
      };
      const v = V[sub];
      return { headline: `Welcome to ${brand}`, subheadline: v.sub, ctaText: v.ctaText, ctaSecondary: v.ctaSecondary };
    },
    features: (brand, count, industry) => {
      const sub = classifyVenueSubtype(industry);
      const ITEMS: Record<VenueSubtype, Array<{ title: string; description: string }>> = {
        food: [
          { title: 'Premium Ingredients', description: 'We source the finest seasonal ingredients from trusted local suppliers.' },
          { title: 'Expert Chefs', description: 'Passionate culinary artists who bring creativity and skill to every dish.' },
          { title: 'Warm Atmosphere', description: 'A cozy, inviting space designed for memorable moments with loved ones.' },
          { title: 'Seasonal Menu', description: 'Rotating selections that celebrate the best flavors of each season.' },
          { title: 'Dietary Options', description: 'Thoughtful accommodations for all dietary needs and preferences.' },
          { title: 'Private Dining', description: 'Beautiful spaces available for your special occasions and celebrations.' },
        ],
        fitness: [
          { title: 'Expert Trainers', description: 'Certified professionals who tailor workouts to your unique goals and fitness level.' },
          { title: 'Premium Equipment', description: 'State-of-the-art machines and free weights maintained to the highest standards.' },
          { title: 'Group Classes', description: 'From HIIT to yoga — energizing classes led by passionate instructors.' },
          { title: 'Flexible Hours', description: 'Open early and late so you can train on your schedule, not ours.' },
          { title: 'Community Spirit', description: 'A motivating environment where members support and inspire each other.' },
          { title: 'Personal Programs', description: 'Custom training plans designed around your goals, timeline, and abilities.' },
        ],
        wellness: [
          { title: 'Skilled Professionals', description: 'Licensed specialists with years of experience and ongoing training.' },
          { title: 'Premium Products', description: 'We use only top-tier, professionally recommended products and tools.' },
          { title: 'Relaxing Atmosphere', description: 'A serene environment designed to help you unwind and recharge.' },
          { title: 'Personalized Service', description: 'Every treatment is tailored to your individual needs and preferences.' },
          { title: 'Hygiene Standards', description: 'Rigorous cleanliness protocols for your safety and peace of mind.' },
          { title: 'Online Booking', description: 'Easy scheduling through our website — book your appointment anytime.' },
        ],
        hospitality: [
          { title: 'Luxury Rooms', description: 'Beautifully appointed rooms designed for comfort and relaxation.' },
          { title: 'Exceptional Service', description: 'Attentive staff dedicated to making your stay truly memorable.' },
          { title: 'Prime Location', description: 'Perfectly situated near top attractions, dining, and entertainment.' },
          { title: 'Fine Dining', description: 'On-site restaurant serving locally inspired cuisine and craft cocktails.' },
          { title: 'Modern Amenities', description: 'Pool, fitness center, spa, and business facilities at your fingertips.' },
          { title: 'Event Spaces', description: 'Elegant venues for weddings, conferences, and special celebrations.' },
        ],
        entertainment: [
          { title: 'Immersive Experience', description: 'Cutting-edge technology that brings stories and adventures to life.' },
          { title: 'Curated Programming', description: 'A carefully selected lineup of shows, films, and events for all ages.' },
          { title: 'Premium Seating', description: 'Comfortable, spacious seating designed for the ultimate viewing experience.' },
          { title: 'Concessions & Bar', description: 'Delicious snacks, drinks, and specialty items to enhance your visit.' },
          { title: 'Group Packages', description: 'Special rates and private screenings for parties, teams, and events.' },
          { title: 'Easy Booking', description: 'Reserve your seats online in seconds — skip the line and save time.' },
        ],
        general: [
          { title: 'Premium Experience', description: 'Every visit is thoughtfully designed to delight all your senses.' },
          { title: 'Expert Team', description: 'Passionate professionals who bring years of expertise to everything they do.' },
          { title: 'Warm Atmosphere', description: 'A welcoming space designed for memorable moments.' },
          { title: 'Flexible Options', description: 'Services and offerings tailored to your needs and preferences.' },
          { title: 'Convenient Location', description: 'Easy to find with ample parking and public transit access.' },
          { title: 'Community Favorite', description: 'Loved by locals and visitors alike — a trusted destination.' },
        ],
      };
      return {
        headline: `Why Choose ${brand}`,
        subheadline: 'Every detail crafted with care and passion.',
        items: (ITEMS[sub] || ITEMS.general).slice(0, count),
      };
    },
    testimonials: (_brand, count, industry) => {
      const sub = classifyVenueSubtype(industry);
      const ITEMS: Record<VenueSubtype, Array<{ title: string; description: string; author: string; role: string; company: string }>> = {
        food: [
          { title: 'Maria Santos', description: 'The most memorable dining experience. Every dish was absolutely perfect.', author: 'Maria Santos', role: 'Regular Guest', company: '' },
          { title: 'James Wilson', description: 'We celebrate every family occasion here. The staff makes us feel like family.', author: 'James Wilson', role: 'Regular Guest', company: '' },
          { title: 'Sophie Laurent', description: 'Incredible flavors, beautiful atmosphere, and the warmest hospitality.', author: 'Sophie Laurent', role: 'Food Reviewer', company: '' },
        ],
        fitness: [
          { title: 'Sarah M.', description: 'Lost 30 lbs in 6 months. The trainers here genuinely care about your progress.', author: 'Sarah M.', role: 'Member since 2022', company: '' },
          { title: 'Marcus T.', description: 'Best gym I have ever been to. The equipment is top-notch and the community keeps me coming back.', author: 'Marcus T.', role: 'Member since 2021', company: '' },
          { title: 'Elena R.', description: 'The group classes are incredible. I went from barely running a mile to completing a half marathon.', author: 'Elena R.', role: 'Member since 2023', company: '' },
        ],
        wellness: [
          { title: 'Jessica L.', description: 'Best haircut I have ever had. They really listen and deliver exactly what you envision.', author: 'Jessica L.', role: 'Regular Client', company: '' },
          { title: 'David K.', description: 'The spa treatments here are next level. I leave feeling completely renewed every time.', author: 'David K.', role: 'Monthly Client', company: '' },
          { title: 'Aisha P.', description: 'Finally found a place that understands my hair. Would not go anywhere else now.', author: 'Aisha P.', role: 'Client since 2022', company: '' },
        ],
        hospitality: [
          { title: 'Robert & Lisa', description: 'Our anniversary stay was magical. The room, the service, the views — all perfect.', author: 'Robert & Lisa', role: 'Returning Guests', company: '' },
          { title: 'Kenji Tanaka', description: 'Outstanding business hotel. Fast wifi, quiet rooms, and a breakfast that rivals the best.', author: 'Kenji Tanaka', role: 'Business Traveler', company: '' },
          { title: 'Emma Clarke', description: 'The concierge team made our trip unforgettable with perfect restaurant and tour recommendations.', author: 'Emma Clarke', role: 'Family Vacation', company: '' },
        ],
        entertainment: [
          { title: 'Alex D.', description: 'The sound and picture quality blew me away. This is how movies are meant to be experienced.', author: 'Alex D.', role: 'Regular Visitor', company: '' },
          { title: 'Priya S.', description: 'Perfect for date night or a family outing. Something for everyone and always a great time.', author: 'Priya S.', role: 'Weekly Regular', company: '' },
          { title: 'Tom H.', description: 'The VIP experience was worth every penny. Comfortable seats, great food, and no crowds.', author: 'Tom H.', role: 'VIP Member', company: '' },
        ],
        general: [
          { title: 'Maria Santos', description: 'The most memorable experience. Every detail was absolutely perfect.', author: 'Maria Santos', role: 'Regular Guest', company: '' },
          { title: 'James Wilson', description: 'We keep coming back. The staff makes us feel like family every time.', author: 'James Wilson', role: 'Regular Guest', company: '' },
          { title: 'Sophie Laurent', description: 'Incredible quality, beautiful atmosphere, and the warmest hospitality.', author: 'Sophie Laurent', role: 'Reviewer', company: '' },
        ],
      };
      return { headline: sub === 'fitness' ? 'What Our Members Say' : sub === 'wellness' ? 'What Our Clients Say' : sub === 'hospitality' ? 'Guest Reviews' : 'What Our Guests Say', items: (ITEMS[sub] || ITEMS.general).slice(0, count) };
    },
    about: (brand, _count, industry) => {
      const sub = classifyVenueSubtype(industry);
      const STATS: Record<VenueSubtype, Array<{ value: string; label: string }>> = {
        food:          [{ value: '10+', label: 'Years Serving' }, { value: '50K+', label: 'Happy Guests' }, { value: '200+', label: 'Menu Items' }, { value: '4.8/5', label: 'Rating' }],
        fitness:       [{ value: '2,500+', label: 'Active Members' }, { value: '50+', label: 'Weekly Classes' }, { value: '15+', label: 'Expert Trainers' }, { value: '4.9/5', label: 'Member Rating' }],
        wellness:      [{ value: '5,000+', label: 'Happy Clients' }, { value: '30+', label: 'Treatments' }, { value: '12+', label: 'Specialists' }, { value: '4.9/5', label: 'Rating' }],
        hospitality:   [{ value: '100+', label: 'Rooms & Suites' }, { value: '50K+', label: 'Guest Stays' }, { value: '4.8/5', label: 'Guest Rating' }, { value: '15+', label: 'Years of Service' }],
        entertainment: [{ value: '500K+', label: 'Visitors/Year' }, { value: '200+', label: 'Events/Year' }, { value: '10+', label: 'Venues' }, { value: '4.7/5', label: 'Rating' }],
        general:       [{ value: '10+', label: 'Years Open' }, { value: '50K+', label: 'Happy Visitors' }, { value: '200+', label: 'Offerings' }, { value: '4.8/5', label: 'Rating' }],
      };
      return {
        headline: 'Our Story',
        subheadline: `The heart and soul behind ${brand}.`,
        bodyText: `${brand} was born from a simple passion: creating experiences that bring people together. What started as a dream has grown into a beloved destination where every visit is crafted with love, care, and dedication to quality.`,
        stats: STATS[sub] || STATS.general,
      };
    },
    cta: (brand, _count, industry) => {
      const sub = classifyVenueSubtype(industry);
      const V: Record<VenueSubtype, { headline: string; ctaText: string }> = {
        food:          { headline: 'Ready for an Unforgettable Meal?', ctaText: 'Reserve Now' },
        fitness:       { headline: 'Ready to Start Your Transformation?', ctaText: 'Join Now' },
        wellness:      { headline: 'Ready to Look and Feel Your Best?', ctaText: 'Book Now' },
        hospitality:   { headline: 'Ready for Your Perfect Getaway?', ctaText: 'Book Your Stay' },
        entertainment: { headline: 'Ready for an Amazing Experience?', ctaText: 'Get Tickets' },
        general:       { headline: 'Ready for an Unforgettable Experience?', ctaText: 'Visit Us' },
      };
      const v = V[sub] || V.general;
      return { headline: v.headline, subheadline: `Visit ${brand} and discover why our guests keep coming back.`, ctaText: v.ctaText, ctaSecondary: 'Contact Us' };
    },
    faq: (_brand, count, industry) => {
      const sub = classifyVenueSubtype(industry);
      const ITEMS: Record<VenueSubtype, Array<{ title: string; description: string }>> = {
        food: [
          { title: 'Do you take reservations?', description: 'Yes! We recommend booking in advance, especially for weekends. You can reserve online or call us directly.' },
          { title: 'Do you accommodate dietary needs?', description: 'Absolutely. Please let us know about any allergies or dietary requirements when you book.' },
          { title: 'Is there parking available?', description: 'Yes, we offer complimentary parking on weekends and free lot parking on weekdays.' },
          { title: 'Do you host private events?', description: 'We have beautiful private dining spaces available for groups. Contact us for event inquiries.' },
        ],
        fitness: [
          { title: 'Do I need a membership to work out?', description: 'Yes, but we offer a free day pass so you can try before you commit. No pressure, no obligations.' },
          { title: 'What should I bring to my first visit?', description: 'Just comfortable workout clothes and athletic shoes. We provide towels, lockers, and water stations.' },
          { title: 'Can I freeze my membership?', description: 'Yes, you can freeze your membership for up to 3 months per year at no additional cost.' },
          { title: 'Are group classes included?', description: 'Group classes are included in our Pro and Elite plans. Basic members can add classes for a small fee.' },
        ],
        wellness: [
          { title: 'Do I need to book in advance?', description: 'We recommend booking ahead to secure your preferred time, but walk-ins are welcome based on availability.' },
          { title: 'What should I expect on my first visit?', description: 'We will start with a consultation to understand your needs and preferences before your treatment.' },
          { title: 'What is your cancellation policy?', description: 'We ask for 24 hours notice for cancellations. Late cancellations may incur a fee.' },
          { title: 'Do you offer gift cards?', description: 'Yes! Gift cards are available in any amount and make the perfect present for any occasion.' },
        ],
        hospitality: [
          { title: 'What are the check-in and check-out times?', description: 'Check-in is from 3:00 PM and check-out is by 11:00 AM. Early check-in and late check-out may be arranged.' },
          { title: 'Is breakfast included?', description: 'Complimentary breakfast is included with most room packages. Check your booking for details.' },
          { title: 'Do you have parking?', description: 'Yes, we offer on-site parking for guests. Valet parking is also available for a fee.' },
          { title: 'Can I bring my pet?', description: 'We are pet-friendly! Select rooms are designated for guests traveling with pets. Fees may apply.' },
        ],
        entertainment: [
          { title: 'How do I buy tickets?', description: 'Tickets can be purchased online through our website, via our app, or at the box office.' },
          { title: 'Is there a group discount?', description: 'Yes! Groups of 10 or more receive special pricing. Contact us for group booking inquiries.' },
          { title: 'What is your refund policy?', description: 'Tickets can be refunded or exchanged up to 24 hours before the event. See our full policy online.' },
          { title: 'Do you offer food and drinks?', description: 'Yes, our concession stand offers a full menu of snacks, meals, and beverages including craft cocktails.' },
        ],
        general: [
          { title: 'Do I need an appointment?', description: 'We recommend booking in advance but walk-ins are welcome based on availability.' },
          { title: 'What are your hours?', description: 'Please check our website or contact page for the most up-to-date hours of operation.' },
          { title: 'Is there parking available?', description: 'Yes, free parking is available on site for all visitors.' },
          { title: 'How can I contact you?', description: 'You can reach us by phone, email, or through the contact form on our website.' },
        ],
      };
      return { headline: 'Frequently Asked Questions', items: (ITEMS[sub] || ITEMS.general).slice(0, count) };
    },
    pricing: (brand, count, industry) => {
      const sub = classifyVenueSubtype(industry);
      const ITEMS: Record<VenueSubtype, Array<{ title: string; price: string; description: string; features: string[]; ctaText: string }>> = {
        food: [
          { title: 'Classic', price: '$49/person', description: 'The essential dining experience', features: ['Standard Seating', 'Full Menu Access', 'House Selections'], ctaText: 'Reserve' },
          { title: 'Premium', price: '$89/person', description: 'The elevated experience', features: ['Premium Seating', 'Chef\'s Specials', 'Curated Pairings', 'Priority Service'], ctaText: 'Reserve' },
          { title: 'Private', price: 'Custom', description: 'Exclusive group dining', features: ['Private Space', 'Custom Menu', 'Dedicated Staff', 'Event Coordinator'], ctaText: 'Inquire' },
        ],
        fitness: [
          { title: 'Basic', price: '$29/mo', description: 'Essential gym access', features: ['Full Gym Access', 'Locker Room & Showers', 'Free WiFi'], ctaText: 'Join Now' },
          { title: 'Pro', price: '$59/mo', description: 'Unlimited everything', features: ['Full Gym Access', 'Unlimited Group Classes', 'Body Composition Analysis', 'Locker Room'], ctaText: 'Join Now' },
          { title: 'Elite', price: '$99/mo', description: 'The complete package', features: ['Everything in Pro', '4 PT Sessions/Month', 'Nutrition Plan', 'Recovery Zone', 'Guest Passes'], ctaText: 'Join Now' },
        ],
        wellness: [
          { title: 'Essential', price: '$65', description: 'Single treatment', features: ['Choice of Service', 'Professional Consultation', 'Aftercare Advice'], ctaText: 'Book Now' },
          { title: 'Premium', price: '$120', description: 'Enhanced experience', features: ['Premium Treatment', 'Extended Session', 'Luxury Products', 'Refreshments'], ctaText: 'Book Now' },
          { title: 'VIP Package', price: '$250', description: 'Full day of pampering', features: ['Multiple Treatments', 'Dedicated Specialist', 'Lunch Included', 'Take-Home Products'], ctaText: 'Book Now' },
        ],
        hospitality: [
          { title: 'Standard', price: '$149/night', description: 'Comfortable stay', features: ['Queen Bed', 'City View', 'Free WiFi', 'Breakfast Included'], ctaText: 'Book Now' },
          { title: 'Deluxe', price: '$249/night', description: 'Premium comfort', features: ['King Bed', 'Balcony', 'Mini Bar', 'Room Service', 'Late Checkout'], ctaText: 'Book Now' },
          { title: 'Suite', price: '$449/night', description: 'Ultimate luxury', features: ['Living Area', 'Panoramic View', 'Premium Mini Bar', 'Butler Service', 'Spa Access'], ctaText: 'Book Now' },
        ],
        entertainment: [
          { title: 'General', price: '$15', description: 'Standard admission', features: ['Standard Seating', 'Full Experience'], ctaText: 'Get Tickets' },
          { title: 'Premium', price: '$30', description: 'Enhanced experience', features: ['Premium Seating', 'Priority Entry', 'Free Drink'], ctaText: 'Get Tickets' },
          { title: 'VIP', price: '$60', description: 'The ultimate experience', features: ['VIP Lounge', 'Best Seats', 'Food & Drinks Included', 'Meet & Greet'], ctaText: 'Get Tickets' },
        ],
        general: [
          { title: 'Basic', price: '$29', description: 'Essential access', features: ['Standard Access', 'Core Services'], ctaText: 'Get Started' },
          { title: 'Premium', price: '$59', description: 'Full access', features: ['Full Access', 'All Services', 'Priority Support'], ctaText: 'Get Started' },
          { title: 'VIP', price: '$99', description: 'The complete experience', features: ['Everything Included', 'Dedicated Support', 'Exclusive Perks'], ctaText: 'Get Started' },
        ],
      };
      return { headline: sub === 'fitness' ? 'Membership Plans' : 'Our Experiences', subheadline: `Choose from ${brand}'s curated offerings.`, items: (ITEMS[sub] || ITEMS.general).slice(0, count) };
    },
    'how-it-works': (_brand, count, industry) => {
      const sub = classifyVenueSubtype(industry);
      const ITEMS: Record<VenueSubtype, Array<{ title: string; description: string }>> = {
        food: [
          { title: 'Make a Reservation', description: 'Book your preferred date and time online or by phone.' },
          { title: 'Arrive & Enjoy', description: 'Our team welcomes you and ensures every detail is taken care of.' },
          { title: 'Leave Happy', description: 'Take home wonderful memories and a reason to come back soon.' },
        ],
        fitness: [
          { title: 'Book a Free Trial', description: 'Sign up for a complimentary session to experience our facility and trainers.' },
          { title: 'Get Your Plan', description: 'Work with a trainer to create a personalized fitness program for your goals.' },
          { title: 'Train & Transform', description: 'Show up, put in the work, and watch your body and mind transform.' },
        ],
        wellness: [
          { title: 'Book Online', description: 'Choose your service and preferred time slot through our easy booking system.' },
          { title: 'Consultation', description: 'Your specialist will discuss your needs and customize the treatment.' },
          { title: 'Relax & Enjoy', description: 'Sit back and let our experts work their magic. You deserve it.' },
        ],
        hospitality: [
          { title: 'Choose Your Room', description: 'Browse our rooms and suites to find the perfect fit for your stay.' },
          { title: 'Book & Confirm', description: 'Reserve your dates online with instant confirmation and flexible cancellation.' },
          { title: 'Arrive & Enjoy', description: 'Check in and start enjoying world-class amenities and service.' },
        ],
        entertainment: [
          { title: 'Browse Events', description: 'Check out our upcoming shows, screenings, and special events.' },
          { title: 'Get Your Tickets', description: 'Book online or at the box office — choose your seats and extras.' },
          { title: 'Enjoy the Show', description: 'Arrive, grab your snacks, and immerse yourself in the experience.' },
        ],
        general: [
          { title: 'Explore Our Offerings', description: 'Browse what we have available and find something you love.' },
          { title: 'Book or Visit', description: 'Reserve your spot online or simply walk in during business hours.' },
          { title: 'Enjoy the Experience', description: 'Our team ensures every visit is seamless and memorable.' },
        ],
      };
      return { headline: 'How It Works', subheadline: 'Getting started is easy.', items: (ITEMS[sub] || ITEMS.general).slice(0, count) };
    },
    team: (brand, count, industry) => {
      const sub = classifyVenueSubtype(industry);
      const ITEMS: Record<VenueSubtype, Array<{ title: string; description: string; role: string }>> = {
        food: [
          { title: 'Marco Rivera', description: 'Award-winning chef with 15 years of culinary innovation.', role: 'Head Chef' },
          { title: 'Sofia Chen', description: 'Pastry artist bringing creativity to every dessert.', role: 'Pastry Chef' },
          { title: 'James Okafor', description: 'Expert sommelier curating our world-class wine selection.', role: 'Sommelier' },
          { title: 'Elena Vasquez', description: 'Warm hospitality leader ensuring every guest feels at home.', role: 'General Manager' },
        ],
        fitness: [
          { title: 'Coach Mike Torres', description: 'Certified trainer with 10+ years helping members reach peak performance.', role: 'Head Trainer' },
          { title: 'Coach Sarah Kim', description: 'Yoga and flexibility specialist focused on mind-body connection.', role: 'Yoga Instructor' },
          { title: 'Coach Jake Rivera', description: 'Strength and conditioning expert. Former collegiate athlete.', role: 'Strength Coach' },
          { title: 'Coach Priya Sharma', description: 'High-energy HIIT and group fitness specialist.', role: 'Group Fitness Lead' },
        ],
        wellness: [
          { title: 'Lauren Mitchell', description: 'Master stylist with 12 years of experience in cutting and color.', role: 'Lead Stylist' },
          { title: 'David Park', description: 'Licensed massage therapist specializing in deep tissue and sports recovery.', role: 'Lead Therapist' },
          { title: 'Aisha Johnson', description: 'Skincare expert certified in advanced aesthetic treatments.', role: 'Aesthetician' },
          { title: 'Maria Santos', description: 'Nail artist known for precision and creative designs.', role: 'Nail Technician' },
        ],
        hospitality: [
          { title: 'Richard Harmon', description: 'Seasoned hotelier dedicated to world-class guest experiences.', role: 'General Manager' },
          { title: 'Yuki Tanaka', description: 'Creates unforgettable dining experiences at our on-site restaurant.', role: 'Executive Chef' },
          { title: 'Camille Dubois', description: 'Local expert making every guest feel at home with perfect recommendations.', role: 'Head Concierge' },
          { title: 'Nadia Petrova', description: 'Ensures seamless events from intimate gatherings to grand celebrations.', role: 'Events Director' },
        ],
        entertainment: [
          { title: 'Alex Donovan', description: 'Visionary leader curating experiences that captivate audiences.', role: 'Creative Director' },
          { title: 'Maya Chen', description: 'Technical expert delivering flawless sound and visual experiences.', role: 'Technical Director' },
          { title: 'Jordan Blake', description: 'Ensures every event runs smoothly from start to finish.', role: 'Operations Manager' },
          { title: 'Sophie Grant', description: 'Connects with audiences and builds community through events and outreach.', role: 'Marketing Lead' },
        ],
        general: [
          { title: 'Marco Rivera', description: 'Experienced leader with a passion for excellence.', role: 'Director' },
          { title: 'Sofia Chen', description: 'Creative visionary bringing artistry to every detail.', role: 'Creative Lead' },
          { title: 'James Okafor', description: 'Expert ensuring every guest receives a world-class experience.', role: 'Experience Manager' },
          { title: 'Elena Vasquez', description: 'Warm leader ensuring every guest feels at home.', role: 'General Manager' },
        ],
      };
      return { headline: sub === 'fitness' ? 'Meet Our Trainers' : 'Meet Our Team', subheadline: `The talented people behind ${brand}.`, items: (ITEMS[sub] || ITEMS.general).slice(0, count) };
    },
  },
};

// ─── Helper ─────────────────────────────────────────────────────────────────

function capitalize(str: string): string {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Content Generator ──────────────────────────────────────────────────────

/**
 * GENERIC_SECTION_HEADLINES — section-specific headlines that override
 * the content generator's default headline when we're borrowing content
 * from a different section type via pattern fallback.
 */
const GENERIC_SECTION_HEADLINES: Record<string, { headline: string; subheadline?: string }> = {
  'categories': { headline: 'Browse Categories', subheadline: 'Explore our curated categories to find exactly what you\'re looking for.' },
  'filters': { headline: 'Refine Your Search', subheadline: 'Use filters to narrow down results by price, rating, category, and more.' },
  'pagination': { headline: 'Browse More', subheadline: 'Navigate through our full collection of products and services.' },
  'product-gallery': { headline: 'Product Gallery', subheadline: 'View detailed images from every angle to make an informed choice.' },
  'product-info': { headline: 'Product Details', subheadline: 'Complete specifications, materials, and sizing information.' },
  'reviews': { headline: 'Customer Reviews', subheadline: 'Read authentic reviews from verified customers who purchased this product.' },
  'related-products': { headline: 'You May Also Like', subheadline: 'Curated recommendations based on your current selection.' },
  'cart-items': { headline: 'Your Shopping Cart', subheadline: 'Review your selected items before proceeding to checkout.' },
  'cart-summary': { headline: 'Order Summary', subheadline: 'Your subtotal, shipping, and estimated total at a glance.' },
  'recommended': { headline: 'Recommended For You', subheadline: 'Handpicked suggestions based on your shopping preferences.' },
  'sidebar': { headline: 'Quick Navigation', subheadline: 'Jump to specific sections or filter content.' },
  'social-links': { headline: 'Connect With Us', subheadline: 'Follow us on social media for the latest updates.' },
  'mission-values': { headline: 'Our Mission & Values', subheadline: 'The principles that guide everything we do.' },
  'milestones': { headline: 'Our Journey', subheadline: 'Key moments that shaped who we are today.' },
  'company-story': { headline: 'Our Story', subheadline: 'How it all began and where we\'re headed next.' },
  'process': { headline: 'Our Process', subheadline: 'A transparent look at how we deliver results.' },
  'case-studies': { headline: 'Case Studies', subheadline: 'Real results from real clients — see the impact of our work.' },
  'office-locations': { headline: 'Our Offices', subheadline: 'Find the location nearest to you.' },
  'bio': { headline: 'About the Author', subheadline: 'Learn more about the person behind the content.' },
  'experience': { headline: 'Experience', subheadline: 'Professional background and expertise.' },
  'article-content': { headline: 'Article', subheadline: 'Full article content.' },
  'author-bio': { headline: 'About the Author', subheadline: 'Background and expertise of the author.' },
  'related-posts': { headline: 'Related Articles', subheadline: 'More articles you might enjoy reading.' },
  'comments': { headline: 'Comments', subheadline: 'Join the conversation below.' },
  'feature-comparison': { headline: 'Compare Plans', subheadline: 'See what\'s included in each plan at a glance.' },
  'support-info': { headline: 'Support', subheadline: 'Get help when you need it — our team is here for you.' },
  'date-range': { headline: 'Date Range', subheadline: 'Select a time period to view your data.' },
  'export': { headline: 'Export Data', subheadline: 'Download your data in various formats.' },
  'chart-grid': { headline: 'Analytics Overview', subheadline: 'Visual insights into your key performance metrics.' },
  'profile-form': { headline: 'Profile Settings', subheadline: 'Update your personal information and preferences.' },
  'preferences': { headline: 'Preferences', subheadline: 'Customize your experience.' },
  'notifications': { headline: 'Notifications', subheadline: 'Manage your notification preferences.' },
  'security': { headline: 'Security', subheadline: 'Manage passwords, two-factor authentication, and security settings.' },
  'user-table': { headline: 'User Management', subheadline: 'View, search, and manage user accounts.' },
  'search': { headline: 'Search', subheadline: 'Find what you\'re looking for quickly.' },
  'quick-actions': { headline: 'Quick Actions', subheadline: 'Frequently used actions at your fingertips.' },
  'recent-activity': { headline: 'Recent Activity', subheadline: 'See what\'s been happening across your workspace.' },
  'skills': { headline: 'Skills & Expertise', subheadline: 'Core competencies and technical proficiency.' },
  'values': { headline: 'Our Values', subheadline: 'What we stand for and why it matters.' },
  'mission': { headline: 'Our Mission', subheadline: 'The purpose that drives everything we do.' },
  'checkout-form': { headline: 'Secure Checkout', subheadline: 'Complete your order with confidence — your data is encrypted and secure.' },
  'order-summary': { headline: 'Order Summary', subheadline: 'Review your items and total before placing your order.' },
  'order-review': { headline: 'Review Your Order', subheadline: 'Double-check everything before confirming your purchase.' },
  'shipping-form': { headline: 'Shipping Information', subheadline: 'Enter your delivery address and contact details.' },
  'payment-form': { headline: 'Payment Details', subheadline: 'Enter your payment information securely.' },
  // Contact & location sections
  'contact': { headline: 'Get In Touch', subheadline: 'We would love to hear from you.' },
  'contact-form': { headline: 'Get In Touch', subheadline: 'Send us a message and we\'ll get back to you shortly.' },
  'map': { headline: 'Find Us', subheadline: 'Visit us at our location.' },
  'location': { headline: 'Our Location', subheadline: 'Here is where you can find us.' },
  'hours': { headline: 'Hours & Location', subheadline: 'Plan your visit.' },
  'info': { headline: 'Information', subheadline: 'Everything you need to know.' },
  // Restaurant / venue sections
  'reservation-form': { headline: 'Make a Reservation', subheadline: 'Book your table online.' },
  'menu-categories': { headline: 'Our Menu', subheadline: 'Explore our full selection of offerings.' },
  'menu-items': { headline: 'Menu', subheadline: 'Browse our selection.' },
  'menu-preview': { headline: 'Featured Menu', subheadline: 'A taste of what awaits you.' },
  'specials': { headline: 'Today\'s Specials', subheadline: 'Chef\'s featured selections.' },
  'photo-grid': { headline: 'Gallery', subheadline: 'A visual journey through our space.' },
  'lightbox': { headline: 'Gallery', subheadline: 'Explore our space in detail.' },
};

/**
 * Apply content variation — when the same generator is reused across pages,
 * rotate to different item sets based on variationIndex.
 */
function applyVariation(content: GeneratedContent, variationIndex: number): GeneratedContent {
  const variants = (content as any)._variants as Array<Array<{ title: string; description: string }>> | undefined;
  if (!variants || variants.length === 0 || variationIndex === 0) {
    // Remove _variants from output, return base content
    const { _variants, ...clean } = content as any;
    return clean;
  }

  // Pick a variant set based on variationIndex (1-indexed into variants array)
  const variantIdx = ((variationIndex - 1) % variants.length);
  const variantItems = variants[variantIdx];

  const { _variants, ...clean } = content as any;
  if (variantItems && clean.items) {
    clean.items = variantItems.slice(0, clean.items.length);
  }
  return clean;
}

function getFallbackContent(input: GenerateContentInput): GeneratedContent {
  const itemCount = input.itemCount || 3;
  const brand = input.brandName || 'Our Company';
  const industry = (input.industry || '').toLowerCase();
  const variationIndex = input.variationIndex || 0;

  // Classify industry into business model
  const model = classifyBusinessModel(industry);

  // Get template from the matched model
  const modelTemplates = MODEL_CONTENT[model];
  const generator = modelTemplates[input.sectionType];

  if (generator) {
    const content = generator(brand, itemCount, industry || model);
    return applyVariation(content, variationIndex);
  }

  // ── Pattern-aware fallback ──────────────────────────────────────────────
  // Section type not in this model's templates. Use the section classifier
  // to find the structural pattern and pick an appropriate content generator.
  const pattern = classifySection(input.sectionType);
  const fallbackSectionType = getContentFallbackForPattern(pattern, model);

  // Try the fallback section type on the current model first, then saas
  const patternGenerator =
    modelTemplates[fallbackSectionType] ||
    MODEL_CONTENT['saas'][fallbackSectionType];

  if (patternGenerator) {
    const content = patternGenerator(brand, itemCount, industry || model);

    // Apply variation BEFORE headline override so rotated items get correct title
    const varied = applyVariation(content, variationIndex);

    // Override headline/subheadline with section-specific text if available
    const headlineOverride = GENERIC_SECTION_HEADLINES[input.sectionType];
    if (headlineOverride) {
      varied.headline = headlineOverride.headline;
      if (headlineOverride.subheadline) {
        varied.subheadline = headlineOverride.subheadline;
      }
    }

    return varied;
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
