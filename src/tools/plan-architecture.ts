/**
 * MCP Tool: plan_architecture
 *
 * Phase 2 — System Analyst / Solutions Architect
 *
 * Takes the project scope from analyze_project and produces:
 * - Technology stack decision
 * - Component architecture map per page
 * - Section-to-component mappings
 * - Interactivity and animation plan
 * - File structure for the chosen framework
 */

type Framework = 'html' | 'react' | 'nextjs' | 'vue' | 'nuxt' | 'angular' | 'svelte' | 'astro';
type ComponentCategory = string;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PageDefinition {
  name: string;
  slug: string;
  sections: string[];
  isHomepage: boolean;
  description: string;
}

export interface SectionBlueprint {
  id: string;
  name: string;
  description: string;
  components: ComponentCategory[];
  layout: string;
  animations: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface PageBlueprint {
  name: string;
  slug: string;
  route: string;
  isHomepage: boolean;
  sections: SectionBlueprint[];
  sharedComponents: ComponentCategory[];
}

export interface FileStructure {
  path: string;
  type: 'file' | 'directory';
  description: string;
}

export interface InteractivityPlan {
  scrollAnimations: string[];
  hoverEffects: string[];
  formBehaviors: string[];
  navigationBehavior: string[];
  loadingStates: string[];
}

export interface ArchitecturePlan {
  framework: Framework;
  stylingApproach: string;
  buildTool: string;
  pages: PageBlueprint[];
  sharedLayout: {
    navbar: boolean;
    footer: boolean;
    sidebar: boolean;
  };
  allComponentsNeeded: ComponentCategory[];
  fileStructure: FileStructure[];
  interactivity: InteractivityPlan;
  routingStrategy: string;
}

export interface PlanArchitectureInput {
  projectType: string;
  industry: string;
  tone: string;
  framework: string;
  pages: PageDefinition[];
  features: string[];
}

export interface PlanArchitectureOutput {
  plan: ArchitecturePlan;
  summary: string;
}

// ─── Section → Component Mapping ────────────────────────────────────────────

const SECTION_COMPONENT_MAP: Record<string, { components: ComponentCategory[]; layout: string; animations: string[] }> = {
  'hero': {
    components: ['button-primary', 'button-secondary', 'navigation'],
    layout: 'full-width with centered or split content (image + text)',
    animations: ['fade-in-up for headline (delay 0)', 'fade-in-up for subtitle (delay 100ms)', 'scale-in for CTA buttons (delay 200ms)', 'fade-in for hero image/illustration (delay 300ms)', 'ambient float animation on decorative elements'],
  },
  'features': {
    components: ['card'],
    layout: 'responsive grid: 1 col mobile, 2 col tablet, 3 col desktop',
    animations: ['staggered fade-in-up for each feature card (100ms delay between)', 'card hover: translateY(-6px) + shadow elevation', 'scale-in for feature icons'],
  },
  'pricing': {
    components: ['card', 'button-primary', 'button-secondary', 'badge'],
    layout: 'responsive grid: 1 col mobile, 2-3 col desktop, highlighted card for recommended plan',
    animations: ['staggered scale-in for pricing cards', 'pulse-glow on recommended badge', 'button hover with shine effect'],
  },
  'pricing-table': {
    components: ['card', 'button-primary', 'button-secondary', 'badge', 'toggle'],
    layout: 'responsive grid with monthly/yearly toggle, 2-3 pricing cards',
    animations: ['toggle slide animation for monthly/yearly', 'staggered card entrance', 'price counter animation on toggle'],
  },
  'testimonials': {
    components: ['card'],
    layout: 'grid or carousel: 1 col mobile, 2-3 col desktop',
    animations: ['fade-in-up staggered entrance', 'subtle hover lift on cards'],
  },
  'faq': {
    components: ['button-secondary'],
    layout: 'single column accordion list, max-width 800px centered',
    animations: ['slide-down for answer reveal', 'rotate chevron icon on open/close', 'staggered fade-in on scroll'],
  },
  'cta': {
    components: ['button-primary', 'button-secondary'],
    layout: 'full-width banner with centered text and buttons',
    animations: ['fade-in-up for text', 'scale-in for buttons', 'gradient-shift on background'],
  },
  'contact-form': {
    components: ['input', 'button-primary', 'checkbox'],
    layout: 'centered form with max-width 600px, or split layout with form + contact info',
    animations: ['staggered fade-in for form fields', 'input focus: border color + shadow ring animation', 'button loading state on submit'],
  },
  'newsletter': {
    components: ['input', 'button-primary'],
    layout: 'inline input + button, centered, max-width 500px',
    animations: ['fade-in-up entrance', 'input focus ring animation', 'success checkmark animation on submit'],
  },
  'product-grid': {
    components: ['card', 'badge', 'button-primary'],
    layout: 'responsive grid: 2 col mobile, 3-4 col desktop, with hover overlays',
    animations: ['staggered scale-in entrance', 'card hover: image zoom + overlay reveal', 'add-to-cart button slide-up on hover'],
  },
  'featured-products': {
    components: ['card', 'badge', 'button-primary'],
    layout: 'featured grid: 1 large + 2-4 smaller cards',
    animations: ['staggered fade-in', 'hover zoom on product images', 'badge pulse for "NEW" or "SALE"'],
  },
  'categories': {
    components: ['card'],
    layout: 'grid: 2 col mobile, 3-4 col desktop, image background cards',
    animations: ['staggered fade-in-up', 'hover: dark overlay + scale on image'],
  },
  'product-gallery': {
    components: ['button-secondary'],
    layout: '1 main image + thumbnail strip, or grid gallery',
    animations: ['fade transition between images', 'thumbnail active indicator animation', 'zoom on hover'],
  },
  'product-info': {
    components: ['button-primary', 'button-secondary', 'badge', 'radio', 'input'],
    layout: 'split: gallery left, info right (desktop), stacked (mobile)',
    animations: ['fade-in for content', 'size/color selector animations', 'add-to-cart button animation'],
  },
  'cart-items': {
    components: ['card', 'button-primary', 'button-secondary', 'input'],
    layout: 'list of cart items with quantity controls + order summary sidebar',
    animations: ['slide-out on remove', 'counter animation on quantity change', 'price update animation'],
  },
  'cart-summary': {
    components: ['card', 'button-primary'],
    layout: 'sticky sidebar with price breakdown and checkout CTA',
    animations: ['price counter animation', 'button pulse on total change'],
  },
  'project-grid': {
    components: ['card', 'badge'],
    layout: 'masonry or grid: 1-2 col mobile, 3 col desktop',
    animations: ['staggered scale-in', 'hover: image overlay with project title', 'filter transition animations'],
  },
  'featured-projects': {
    components: ['card', 'button-secondary'],
    layout: 'large showcase cards: 1-2 col, with hover detail reveal',
    animations: ['parallax scroll on images', 'staggered entrance', 'hover overlay with slide-up details'],
  },
  'about': {
    components: ['card'],
    layout: 'split layout: image + text, or full-width with background',
    animations: ['fade-from-left for image', 'fade-from-right for text', 'counter animation for stats'],
  },
  'about-preview': {
    components: ['button-secondary'],
    layout: 'split: image left, text right (desktop)',
    animations: ['fade-from-left for image', 'fade-from-right for text'],
  },
  'bio': {
    components: ['card'],
    layout: 'centered with avatar, name, bio text',
    animations: ['scale-in for avatar', 'fade-in-up for text'],
  },
  'team': {
    components: ['card'],
    layout: 'grid: 2 col mobile, 3-4 col desktop, with hover social links reveal',
    animations: ['staggered scale-in for team cards', 'hover: flip or overlay with social links'],
  },
  'skills': {
    components: ['badge'],
    layout: 'grid of skill badges or progress bars',
    animations: ['staggered scale-in', 'progress bar fill animation on scroll'],
  },
  'stats-cards': {
    components: ['card'],
    layout: 'grid: 2 col mobile, 4 col desktop, with icon + number + label',
    animations: ['counter animation for numbers', 'staggered scale-in entrance'],
  },
  'charts': {
    components: ['card', 'dropdown'],
    layout: 'grid of chart containers with controls',
    animations: ['chart draw-in animation', 'fade transition on data change'],
  },
  'recent-activity': {
    components: ['card', 'badge'],
    layout: 'timeline or list with timestamps',
    animations: ['staggered slide-in-right', 'new item highlight pulse'],
  },
  'user-table': {
    components: ['input', 'button-primary', 'button-secondary', 'dropdown', 'badge'],
    layout: 'full-width table with search bar, filters, and pagination',
    animations: ['row hover highlight', 'sort column animation', 'pagination fade transition'],
  },
  'services': {
    components: ['card', 'button-secondary'],
    layout: 'alternating rows: icon/image left + text right, then swap',
    animations: ['fade-from-left / fade-from-right alternating per row', 'icon scale-in'],
  },
  'services-grid': {
    components: ['card'],
    layout: 'grid: 2-3 col with icon, title, description',
    animations: ['staggered fade-in-up', 'card hover lift + icon color change'],
  },
  'clients': {
    components: [],
    layout: 'logo strip: horizontal scroll or grid',
    animations: ['infinite scroll animation for logo strip', 'grayscale → color on hover'],
  },
  'how-it-works': {
    components: ['card'],
    layout: 'numbered steps: horizontal on desktop, vertical on mobile',
    animations: ['staggered fade-in with connecting line draw', 'step number counter animation'],
  },
  'feature-comparison': {
    components: ['badge', 'button-primary'],
    layout: 'comparison table with checkmarks',
    animations: ['row-by-row fade-in on scroll', 'checkmark pop-in animation'],
  },
  'process': {
    components: ['card'],
    layout: 'numbered steps or timeline layout',
    animations: ['line draw animation connecting steps', 'staggered entrance'],
  },
  'menu-categories': {
    components: ['button-secondary'],
    layout: 'horizontal filter tabs for menu categories',
    animations: ['tab underline slide animation', 'content fade transition on tab change'],
  },
  'menu-items': {
    components: ['card'],
    layout: 'grid: 1-2 col with image, name, description, price',
    animations: ['staggered fade-in', 'hover: subtle scale on food image'],
  },
  'menu-preview': {
    components: ['card', 'button-secondary'],
    layout: 'featured dishes in a styled grid, 3-4 items',
    animations: ['staggered scale-in', 'hover lift'],
  },
  'reservation-form': {
    components: ['input', 'button-primary', 'radio', 'dropdown'],
    layout: 'styled form with date picker, time, party size, contact info',
    animations: ['staggered field entrance', 'date picker slide-down', 'confirmation animation'],
  },
  'gallery': {
    components: ['card'],
    layout: 'masonry grid with lightbox on click',
    animations: ['staggered scale-in', 'hover zoom effect', 'lightbox fade-in + scale'],
  },
  'photo-grid': {
    components: [],
    layout: 'masonry or uniform grid',
    animations: ['staggered scale-in', 'hover: subtle zoom + overlay'],
  },
  'post-grid': {
    components: ['card', 'badge'],
    layout: 'grid: 1 col mobile, 2-3 col desktop, with featured post at top',
    animations: ['staggered fade-in-up', 'card hover lift'],
  },
  'featured-posts': {
    components: ['card', 'badge'],
    layout: '1 large featured card + 2-3 smaller cards',
    animations: ['fade-in for featured', 'staggered entrance for smaller cards'],
  },
  'article-content': {
    components: [],
    layout: 'centered content column, max-width 768px, with typography styles',
    animations: ['fade-in on load', 'smooth heading anchor scroll'],
  },
  'sidebar': {
    components: ['input', 'badge', 'navigation'],
    layout: 'fixed sidebar with search, categories, recent posts',
    animations: ['collapsible sections animation', 'hover effects on links'],
  },
  'social-links': {
    components: ['button-secondary'],
    layout: 'horizontal icon row with hover effects',
    animations: ['staggered scale-in', 'hover: lift + color fill'],
  },
  'filters': {
    components: ['checkbox', 'radio', 'dropdown', 'button-secondary'],
    layout: 'sidebar filters (desktop) or drawer (mobile)',
    animations: ['slide-in drawer on mobile', 'checkbox bounce animation', 'filter count badge update'],
  },
  'pagination': {
    components: ['button-secondary'],
    layout: 'centered page number row with prev/next',
    animations: ['active page indicator animation', 'content fade on page change'],
  },
  'quick-actions': {
    components: ['button-primary', 'button-secondary', 'card'],
    layout: 'grid of action cards or button row',
    animations: ['staggered scale-in', 'hover: icon animation + lift'],
  },
  'profile-form': {
    components: ['input', 'button-primary', 'toggle', 'checkbox'],
    layout: 'form sections with labels, grouped by category',
    animations: ['staggered fade-in for sections', 'toggle slide animation', 'save button loading state'],
  },
  'preferences': {
    components: ['toggle', 'radio', 'dropdown'],
    layout: 'settings list with toggle switches and dropdowns',
    animations: ['toggle animations', 'dropdown slide-down'],
  },
  'notifications': {
    components: ['toggle', 'checkbox'],
    layout: 'notification preference list with toggles',
    animations: ['toggle slide animation', 'save confirmation'],
  },
  'security': {
    components: ['input', 'button-primary', 'button-secondary'],
    layout: 'password change form, 2FA settings, session management',
    animations: ['form field entrance', 'password strength indicator animation'],
  },
  'mission-values': {
    components: ['card'],
    layout: 'grid of value cards with icons',
    animations: ['staggered fade-in-up', 'icon entrance animation'],
  },
  'company-story': {
    components: [],
    layout: 'timeline or narrative layout with images',
    animations: ['timeline line draw on scroll', 'alternating fade-from-left/right for milestones'],
  },
  'milestones': {
    components: ['card', 'badge'],
    layout: 'horizontal timeline or vertical milestone list',
    animations: ['line draw animation', 'staggered fade-in for milestones', 'counter animation for years/numbers'],
  },
  'case-studies': {
    components: ['card', 'button-secondary'],
    layout: 'large cards with image, client logo, summary, results',
    animations: ['staggered fade-in', 'hover: image overlay with "View Case Study"'],
  },
  'office-locations': {
    components: ['card'],
    layout: 'grid of location cards with address, phone, hours',
    animations: ['staggered fade-in-up'],
  },
  'map': {
    components: [],
    layout: 'embedded map (Google Maps or static image fallback)',
    animations: ['fade-in on scroll'],
  },
  'info': {
    components: ['card'],
    layout: 'contact info cards: email, phone, address, hours',
    animations: ['staggered scale-in'],
  },
  'support-info': {
    components: ['card'],
    layout: 'support channels: email, chat, phone, docs',
    animations: ['staggered fade-in-up'],
  },
  'date-range': {
    components: ['input', 'button-secondary', 'dropdown'],
    layout: 'date range picker with preset options',
    animations: ['dropdown slide-down', 'calendar fade-in'],
  },
  'chart-grid': {
    components: ['card', 'dropdown'],
    layout: 'responsive grid of chart containers',
    animations: ['chart draw-in on load', 'data transition animations'],
  },
  'export': {
    components: ['button-primary', 'dropdown'],
    layout: 'export button with format dropdown',
    animations: ['dropdown slide-down', 'download progress indicator'],
  },
  'search': {
    components: ['input'],
    layout: 'search bar with autocomplete',
    animations: ['autocomplete dropdown slide-down', 'highlight matching text'],
  },
  'specials': {
    components: ['card', 'badge'],
    layout: 'featured special items with highlight styling',
    animations: ['pulse on "special" badge', 'entrance fade-in'],
  },
  'lightbox': {
    components: ['modal', 'button-secondary'],
    layout: 'fullscreen overlay with image, navigation arrows',
    animations: ['fade + scale entrance', 'swipe transition between images'],
  },
  'hours': {
    components: ['card'],
    layout: 'simple list of days/hours',
    animations: ['fade-in on scroll'],
  },
  'location': {
    components: ['card'],
    layout: 'map + address card',
    animations: ['fade-in on scroll'],
  },
  'author-bio': {
    components: ['card'],
    layout: 'author card with avatar, name, bio, social links',
    animations: ['fade-in-up'],
  },
  'related-posts': {
    components: ['card'],
    layout: 'grid: 2-3 related article cards',
    animations: ['staggered fade-in-up'],
  },
  'comments': {
    components: ['input', 'button-primary', 'card'],
    layout: 'threaded comment list with reply form',
    animations: ['new comment slide-in', 'reply form expand animation'],
  },
  'recommended': {
    components: ['card', 'button-primary'],
    layout: 'horizontal scroll of recommended product cards',
    animations: ['scroll snap animation', 'card hover lift'],
  },
  'related-products': {
    components: ['card'],
    layout: 'horizontal scroll or 2-4 col grid',
    animations: ['staggered fade-in', 'card hover effect'],
  },
  'reviews': {
    components: ['card', 'badge'],
    layout: 'review list with star ratings, sorted by date',
    animations: ['staggered fade-in', 'star fill animation'],
  },
  'experience': {
    components: ['card'],
    layout: 'timeline of work experience entries',
    animations: ['timeline line draw on scroll', 'staggered fade-in'],
  },
};

// ─── Framework File Structures ──────────────────────────────────────────────

function generateFileStructure(framework: Framework, pages: PageDefinition[]): FileStructure[] {
  const files: FileStructure[] = [];

  switch (framework) {
    case 'html': {
      files.push({ path: '/', type: 'directory', description: 'Project root' });
      files.push({ path: '/css/', type: 'directory', description: 'Stylesheets' });
      files.push({ path: '/css/reset.css', type: 'file', description: 'Modern CSS reset' });
      files.push({ path: '/css/variables.css', type: 'file', description: 'CSS custom properties (design tokens)' });
      files.push({ path: '/css/base.css', type: 'file', description: 'Base element styles' });
      files.push({ path: '/css/layout.css', type: 'file', description: 'Grid/flex layout utilities' });
      files.push({ path: '/css/components/', type: 'directory', description: 'Component styles' });
      files.push({ path: '/css/components/navbar.css', type: 'file', description: 'Navigation styles' });
      files.push({ path: '/css/components/buttons.css', type: 'file', description: 'Button styles (primary + secondary)' });
      files.push({ path: '/css/components/cards.css', type: 'file', description: 'Card component styles' });
      files.push({ path: '/css/components/forms.css', type: 'file', description: 'Form input styles' });
      files.push({ path: '/css/components/footer.css', type: 'file', description: 'Footer styles' });
      files.push({ path: '/css/animations.css', type: 'file', description: 'Scroll animations, transitions, keyframes' });
      files.push({ path: '/css/utilities.css', type: 'file', description: 'Helper classes' });
      files.push({ path: '/js/', type: 'directory', description: 'JavaScript' });
      files.push({ path: '/js/main.js', type: 'file', description: 'Initialization, event delegation' });
      files.push({ path: '/js/animations.js', type: 'file', description: 'Intersection Observer scroll animations' });
      files.push({ path: '/js/navigation.js', type: 'file', description: 'Mobile menu, smooth scroll, sticky header' });
      files.push({ path: '/assets/', type: 'directory', description: 'Images, icons, fonts' });
      for (const page of pages) {
        files.push({ path: `/${page.slug}.html`, type: 'file', description: `${page.name} page` });
      }
      break;
    }
    case 'react':
    case 'nextjs': {
      const isNext = framework === 'nextjs';
      files.push({ path: '/src/', type: 'directory', description: 'Source directory' });
      files.push({ path: isNext ? '/src/app/' : '/src/', type: 'directory', description: isNext ? 'App Router' : 'Source root' });
      files.push({ path: '/src/components/', type: 'directory', description: 'React components' });
      files.push({ path: '/src/components/ui/', type: 'directory', description: 'Atomic UI components (buttons, cards, inputs)' });
      files.push({ path: '/src/components/sections/', type: 'directory', description: 'Page sections (Hero, Features, Pricing)' });
      files.push({ path: '/src/components/layout/', type: 'directory', description: 'Layout components (Navbar, Footer)' });
      files.push({ path: '/src/styles/', type: 'directory', description: 'Global styles' });
      files.push({ path: '/src/styles/globals.css', type: 'file', description: 'Reset + CSS variables + base styles' });
      files.push({ path: '/src/styles/animations.css', type: 'file', description: 'Keyframes and scroll animation classes' });
      files.push({ path: '/src/hooks/', type: 'directory', description: 'Custom React hooks' });
      files.push({ path: '/src/hooks/useIntersectionObserver.ts', type: 'file', description: 'Scroll animation hook' });
      for (const page of pages) {
        const pagePath = isNext
          ? (page.isHomepage ? '/src/app/page.tsx' : `/src/app/${page.slug}/page.tsx`)
          : (page.isHomepage ? '/src/pages/Home.tsx' : `/src/pages/${page.name.replace(/\s/g, '')}.tsx`);
        files.push({ path: pagePath, type: 'file', description: `${page.name} page component` });
      }
      if (!isNext) {
        files.push({ path: '/src/App.tsx', type: 'file', description: 'Root component with routing' });
      }
      files.push({ path: '/public/', type: 'directory', description: 'Static assets' });
      files.push({ path: '/package.json', type: 'file', description: 'Dependencies' });
      break;
    }
    case 'vue':
    case 'nuxt': {
      const isNuxt = framework === 'nuxt';
      files.push({ path: '/components/', type: 'directory', description: 'Vue components' });
      files.push({ path: '/components/ui/', type: 'directory', description: 'Atomic UI components' });
      files.push({ path: '/components/sections/', type: 'directory', description: 'Page sections' });
      files.push({ path: '/components/layout/', type: 'directory', description: 'Layout components' });
      files.push({ path: isNuxt ? '/pages/' : '/src/views/', type: 'directory', description: 'Page views' });
      for (const page of pages) {
        const pagePath = isNuxt
          ? (page.isHomepage ? '/pages/index.vue' : `/pages/${page.slug}.vue`)
          : `/src/views/${page.name.replace(/\s/g, '')}View.vue`;
        files.push({ path: pagePath, type: 'file', description: `${page.name} page` });
      }
      files.push({ path: '/assets/css/', type: 'directory', description: 'Global styles' });
      files.push({ path: '/assets/css/variables.css', type: 'file', description: 'CSS custom properties' });
      files.push({ path: '/assets/css/base.css', type: 'file', description: 'Reset + base styles' });
      break;
    }
    case 'angular': {
      files.push({ path: '/src/app/', type: 'directory', description: 'Angular app' });
      files.push({ path: '/src/app/components/', type: 'directory', description: 'Shared components' });
      files.push({ path: '/src/app/components/ui/', type: 'directory', description: 'UI components' });
      files.push({ path: '/src/app/components/sections/', type: 'directory', description: 'Section components' });
      files.push({ path: '/src/app/components/layout/', type: 'directory', description: 'Layout components' });
      files.push({ path: '/src/app/pages/', type: 'directory', description: 'Page components' });
      for (const page of pages) {
        const slug = page.slug.replace(/\s/g, '-').toLowerCase();
        files.push({ path: `/src/app/pages/${slug}/`, type: 'directory', description: `${page.name} page module` });
      }
      files.push({ path: '/src/styles/', type: 'directory', description: 'Global styles' });
      files.push({ path: '/src/styles/_variables.scss', type: 'file', description: 'CSS custom properties' });
      files.push({ path: '/src/styles/styles.scss', type: 'file', description: 'Global styles + reset' });
      break;
    }
    case 'svelte': {
      files.push({ path: '/src/', type: 'directory', description: 'Source' });
      files.push({ path: '/src/lib/', type: 'directory', description: 'Shared library' });
      files.push({ path: '/src/lib/components/', type: 'directory', description: 'Svelte components' });
      files.push({ path: '/src/lib/components/ui/', type: 'directory', description: 'UI components' });
      files.push({ path: '/src/lib/components/sections/', type: 'directory', description: 'Section components' });
      files.push({ path: '/src/routes/', type: 'directory', description: 'SvelteKit routes' });
      for (const page of pages) {
        const routePath = page.isHomepage ? '/src/routes/+page.svelte' : `/src/routes/${page.slug}/+page.svelte`;
        files.push({ path: routePath, type: 'file', description: `${page.name} page` });
      }
      files.push({ path: '/src/app.css', type: 'file', description: 'Global styles + CSS variables' });
      break;
    }
    case 'astro': {
      files.push({ path: '/src/', type: 'directory', description: 'Source' });
      files.push({ path: '/src/components/', type: 'directory', description: 'Components' });
      files.push({ path: '/src/layouts/', type: 'directory', description: 'Layout templates' });
      files.push({ path: '/src/pages/', type: 'directory', description: 'Pages' });
      for (const page of pages) {
        files.push({ path: page.isHomepage ? '/src/pages/index.astro' : `/src/pages/${page.slug}.astro`, type: 'file', description: `${page.name} page` });
      }
      files.push({ path: '/src/styles/', type: 'directory', description: 'Global styles' });
      files.push({ path: '/src/styles/global.css', type: 'file', description: 'CSS variables + base' });
      break;
    }
  }

  return files;
}

// ─── Styling Approach ───────────────────────────────────────────────────────

function resolveStylingApproach(framework: Framework): string {
  switch (framework) {
    case 'html': return 'Pure CSS3 with custom properties (no framework)';
    case 'react': return 'CSS Modules with CSS custom properties';
    case 'nextjs': return 'CSS Modules with CSS custom properties';
    case 'vue': return 'Scoped <style> in SFCs with CSS custom properties';
    case 'nuxt': return 'Scoped <style> in SFCs with CSS custom properties';
    case 'angular': return 'Component SCSS with CSS custom properties';
    case 'svelte': return 'Scoped <style> with CSS custom properties';
    case 'astro': return 'Scoped <style> with CSS custom properties';
    default: return 'Pure CSS3 with custom properties';
  }
}

function resolveBuildTool(framework: Framework): string {
  switch (framework) {
    case 'html': return 'None (opens directly in browser)';
    case 'react': return 'Vite';
    case 'nextjs': return 'Next.js built-in';
    case 'vue': return 'Vite';
    case 'nuxt': return 'Nuxt built-in';
    case 'angular': return 'Angular CLI';
    case 'svelte': return 'SvelteKit / Vite';
    case 'astro': return 'Astro built-in';
    default: return 'Vite';
  }
}

function resolveRoutingStrategy(framework: Framework, pages: PageDefinition[]): string {
  if (pages.length <= 1) return 'Single page — no routing needed';

  switch (framework) {
    case 'html': return `Separate HTML files (${pages.map(p => p.slug + '.html').join(', ')}) with shared CSS/JS. Navigation via <a href> links.`;
    case 'react': return 'React Router v6 with <BrowserRouter> and <Routes>';
    case 'nextjs': return 'Next.js App Router (file-based routing in /app directory)';
    case 'vue': return 'Vue Router with createRouter()';
    case 'nuxt': return 'Nuxt file-based routing (/pages directory)';
    case 'angular': return 'Angular Router with lazy-loaded route modules';
    case 'svelte': return 'SvelteKit file-based routing (/routes directory)';
    case 'astro': return 'Astro file-based routing (/pages directory)';
    default: return 'Separate HTML files';
  }
}

// ─── Main Tool Function ─────────────────────────────────────────────────────

export function planArchitecture(input: PlanArchitectureInput): PlanArchitectureOutput {
  const framework = (input.framework || 'html') as Framework;
  const pages = input.pages || [];

  // Build page blueprints with section details
  const pageBlueprints: PageBlueprint[] = pages.map(page => {
    const sections: SectionBlueprint[] = page.sections.map((sectionId, index) => {
      const sectionInfo = SECTION_COMPONENT_MAP[sectionId] || {
        components: [],
        layout: 'standard section layout',
        animations: ['fade-in-up on scroll'],
      };

      return {
        id: sectionId,
        name: sectionId
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        description: `${sectionId} section for ${page.name}`,
        components: sectionInfo.components,
        layout: sectionInfo.layout,
        animations: sectionInfo.animations,
        priority: index === 0 ? ('critical' as const) : index < 3 ? ('high' as const) : ('medium' as const),
      };
    });

    return {
      name: page.name,
      slug: page.slug,
      route: page.isHomepage ? '/' : `/${page.slug}`,
      isHomepage: page.isHomepage,
      sections,
      sharedComponents: ['navigation'] as ComponentCategory[],
    };
  });

  // Collect all unique components needed
  const allComponents = new Set<ComponentCategory>();
  allComponents.add('navigation');
  allComponents.add('button-primary');
  for (const page of pageBlueprints) {
    for (const section of page.sections) {
      for (const comp of section.components) {
        allComponents.add(comp);
      }
    }
  }

  // Interactivity plan
  const interactivity: InteractivityPlan = {
    scrollAnimations: [
      'Every section uses Intersection Observer for scroll-triggered entrance',
      'Staggered children animation with 100ms delay between items',
      'Animation types alternate per section: fade-up, fade-left, fade-right, scale-in',
      'Elements animate ONCE on enter, then stay visible',
    ],
    hoverEffects: [
      'Buttons: translateY(-2px) + shadow elevation + shine sweep',
      'Cards: translateY(-6px) + shadow-xl + border-color transition',
      'Links: animated underline grow from left',
      'Images: subtle scale(1.05) with overflow hidden',
    ],
    formBehaviors: [
      'Input focus: border-color transition to primary + box-shadow ring',
      'Floating labels (animate up on focus/filled)',
      'Real-time validation with animated error/success messages',
      'Submit button loading state with spinner',
    ],
    navigationBehavior: [
      'Sticky header with background blur on scroll',
      'Mobile hamburger menu with slide-in drawer',
      'Smooth scroll to sections (on same page)',
      'Active link indicator based on current page/section',
    ],
    loadingStates: [
      'Page transition fade/slide',
      'Skeleton screens for async content',
      'Button loading spinner on form submit',
      'Image lazy loading with fade-in on load',
    ],
  };

  const fileStructure = generateFileStructure(framework, pages);
  const routingStrategy = resolveRoutingStrategy(framework, pages);

  const plan: ArchitecturePlan = {
    framework,
    stylingApproach: resolveStylingApproach(framework),
    buildTool: resolveBuildTool(framework),
    pages: pageBlueprints,
    sharedLayout: {
      navbar: true,
      footer: true,
      sidebar: input.projectType === 'dashboard',
    },
    allComponentsNeeded: Array.from(allComponents),
    fileStructure,
    interactivity,
    routingStrategy,
  };

  // Build summary
  let summary = `## Architecture Plan\n\n`;
  summary += `**Framework:** ${framework}\n`;
  summary += `**Styling:** ${plan.stylingApproach}\n`;
  summary += `**Build Tool:** ${plan.buildTool}\n`;
  summary += `**Routing:** ${routingStrategy}\n\n`;

  summary += `### Pages (${pageBlueprints.length})\n`;
  for (const page of pageBlueprints) {
    summary += `\n#### ${page.name} (\`${page.route}\`)\n`;
    for (const section of page.sections) {
      const compList = section.components.length > 0 ? section.components.join(', ') : 'none';
      summary += `- **${section.name}** [${section.priority.toUpperCase()}]\n`;
      summary += `  Layout: ${section.layout}\n`;
      summary += `  Components: ${compList}\n`;
      summary += `  Animations: ${section.animations.join('; ')}\n`;
    }
  }

  summary += `\n### Components Required (${allComponents.size})\n`;
  summary += `${Array.from(allComponents)
    .map(c => `- \`${c}\``)
    .join('\n')}\n`;

  summary += `\n### File Structure\n\`\`\`\n`;
  for (const f of fileStructure) {
    const indent = (f.path.match(/\//g) || []).length - 1;
    const prefix = f.type === 'directory' ? '📁' : '📄';
    const name = f.path.split('/').pop() || f.path;
    summary += `${'  '.repeat(Math.max(0, indent))}${prefix} ${name} — ${f.description}\n`;
  }
  summary += `\`\`\`\n`;

  summary += `\n### Interactivity Plan\n`;
  summary += `**Scroll Animations:** ${interactivity.scrollAnimations.join('; ')}\n\n`;
  summary += `**Hover Effects:** ${interactivity.hoverEffects.join('; ')}\n\n`;
  summary += `**Navigation:** ${interactivity.navigationBehavior.join('; ')}\n\n`;

  summary += `---\n\n`;
  summary += `**Next step:** Run \`design_theme\` to generate the color palette and typography, then \`select_components\` to pick and adapt components for ${framework}.`;

  return { plan, summary };
}
