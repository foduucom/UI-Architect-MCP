# UI Architect MCP

**The ultimate MCP server for generating production-ready, agency-quality UI.**
Any framework. No CSS framework lock-in. Never looks AI-generated.

### **Built by [FODUU](https://www.foduu.com)** — India's Leading Web Design & Development Company

**8 Tools • 61 Components • 13 Categories • 5 Styles • 8 Frameworks**

---

[Installation](#installation) | [Tools](#tools) | [Examples](#usage-examples) | [Architecture](#architecture) | [Philosophy](#design-philosophy) | [Contributing](#contributing)

---

## What is this?

UI Architect is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that gives AI assistants like Claude the ability to generate **complete, professional design systems and UI components** from a simple description like _"fintech startup targeting millennials"_.

It solves three problems with AI-generated UI:

1. **It always looks AI-generated** — purple-blue gradients, symmetric grids, generic layouts. UI Architect uses a Color Intelligence Engine with 15 industry profiles to produce palettes that match real-world business contexts.

2. **Components are inconsistent** — five different button styles on one page. UI Architect enforces a **Design Token Registry** that locks one style per component category across the entire project.

3. **It's static and lifeless** — no hover effects, no scroll animations, no micro-interactions. UI Architect ships **61 curated components** across **5 visual styles** (flat, neumorphic, glassmorphic, gradient, animated) that all have rich CSS — shine effects, spring easings, entrance reveals, focus rings, and more.

---

## Installation

### Requirements

- Node.js 18+
- An MCP-compatible client (Claude Desktop, Claude Code, Cursor, etc.)

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ui-architect": {
      "command": "npx",
      "args": ["-y", "ui-architect-mcp"]
    }
  }
}
```

### With Claude Code

```bash
claude mcp add ui-architect -- npx -y ui-architect-mcp
```

### Manual / From Source

```bash
git clone https://github.com/your-username/ui-architect-mcp.git
cd ui-architect-mcp
npm install
npm run build
```

Then add to your MCP config:

```json
{
  "mcpServers": {
    "ui-architect": {
      "command": "node",
      "args": ["/absolute/path/to/ui-architect-mcp/dist/index.js"]
    }
  }
}
```

### Development Mode

```bash
npm run dev
```

This uses `tsx` to run the TypeScript source directly without a build step.

---

## Tools

UI Architect exposes **8 MCP tools** that follow a complete web design agency pipeline. Run them in sequence for best results.

### The 8-Step Pipeline

1. **analyze_project** — Scope and requirements analysis
2. **plan_architecture** — System design and component mapping
3. **design_theme** — Color system, typography, spacing
4. **select_components** — Choose and adapt UI components
5. **generate_background** — Create background patterns
6. **scaffold_project** — Generate project directory structure
7. **generate_full_page** — Produce complete page code
8. **review_output** — QA and anti-pattern detection

---

### 1. `analyze_project` (Phase 1: Project Manager Analysis)

> Parse requirements and create project scope.

**Input:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `description` | string | Yes | User's request. e.g. "A fintech landing page for millennials" |
| `audience` | string | No | Target audience. e.g. "B2C millennials", "enterprise B2B" |
| `industry` | string | No | Business type. If omitted, inferred from description. |

**What it returns:**

- Project scope document (pages, sections, tone, complexity)
- Clarifying questions (if the request is ambiguous)
- Risk assessment (performance, compatibility, scope creep)
- Recommended framework and styling approach
- Estimated timeline and component count

**Example:**

```
Input:
  description: "Build a landing page for a healthtech startup"
  industry: "healthcare"

Output:
  {
    "pageType": "Landing page",
    "audience": "Healthcare professionals, B2B",
    "tone": "trustworthy, modern, accessible",
    "sections": ["Hero", "Features", "Pricing", "Testimonials", "CTA", "Footer"],
    "estimatedComplexity": "Medium",
    "recommendedFramework": "React or Next.js",
    "componentsNeeded": ["Hero", "Cards", "Buttons", "Forms", "Navigation"],
    "clarifyingQuestions": [
      "Do you need dark mode support?",
      "Is this a single-page landing or multi-page site?"
    ]
  }
```

---

### 2. `plan_architecture` (Phase 2: System Analyst Architecture)

> Design system architecture and component hierarchy.

**Input:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `scope` | object | Yes | Project scope from `analyze_project` |
| `framework` | string | No | Target framework. Default: "html" |
| `stylingApproach` | string | No | "pure-css", "css-modules", "styled-components", "scoped-styles". Default: auto-detect. |

**What it returns:**

- Technology stack decision (framework, styling, state management, build tool)
- Complete component architecture map (hierarchical structure)
- Data flow and interactivity plan (scroll animations, navigation, form flows)
- Directory structure template (ready for scaffolding)
- File listing with dependencies

**Example:**

```
Output:
  {
    "stack": {
      "framework": "React",
      "styling": "CSS Modules",
      "animationLibrary": "Pure CSS3"
    },
    "componentMap": {
      "Layout": ["Navbar", "Footer"],
      "Sections": ["Hero", "Features", "Pricing"],
      "Components": ["Button", "Card", "Input"]
    },
    "interactivityPlan": {
      "scrollAnimations": "Intersection Observer",
      "navigation": "Smooth scroll",
      "forms": "Validation on blur/submit"
    }
  }
```

---

### 3. `design_theme` (Phase 3: Senior UI/UX Designer)

> Generate a complete design system from business context.

**Run this first.** It produces the color palette, typography, spacing, shadows, border radius, and transitions that all other tools depend on.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `industry` | string | Yes | Business type. e.g. `"fintech"`, `"healthcare"`, `"saas"`, `"restaurant"`, `"law firm"`, `"gaming studio"`, `"luxury fashion"` |
| `tone` | string | Yes | Design personality. e.g. `"modern"`, `"corporate"`, `"playful"`, `"minimal"`, `"luxury"`, `"bold"`, `"elegant"` |
| `themePreference` | `"light"` \| `"dark"` \| `"auto"` | No | Force a theme or let the engine decide based on industry. Default: `"auto"` |
| `brandColor` | string | No | Hex color to use as primary. e.g. `"#1B365D"`. If omitted, the engine picks the best color for your industry. |

**What it returns:**

- Complete CSS custom properties block (paste into your stylesheet)
- Google Fonts `<link>` tag
- Color palette with primary, secondary, accent, 7-step neutral scale, and semantic colors
- Typography scale (Display through Caption), font pairing, weights, line heights
- 8px grid spacing system
- Shadow, radius, and transition tokens
- Human-readable design summary

**How the theme engine decides:**

| Industry | Theme | Primary | Font |
|---|---|---|---|
| Fintech | Light | Navy `#0A2540` | Sora + Inter |
| Gaming | Dark | Green `#059669` | Space Grotesk + DM Sans |
| Healthcare | Light | Cyan `#06B6D4` | DM Sans |
| Luxury | Dark | Charcoal `#1C1917` | Playfair Display + Source Sans 3 |
| Restaurant | Light | Brown `#92400E` | Playfair Display + Source Sans 3 |
| SaaS | Light | Blue `#1D4ED8` | Inter |
| Law Firm | Light | Charcoal `#1C1917` | Playfair Display + Source Sans 3 |

**Sample output (CSS variables):**

```css
:root {
  --color-primary: #0A2540;
  --color-primary-light: #2280dd;
  --color-primary-dark: #02080d;
  --color-primary-rgb: 10, 37, 64;
  --color-secondary: #1B7A4A;
  --color-accent: #D4A843;
  --color-neutral-900: #171a1c;
  --color-neutral-50: #f7f7f8;
  --font-heading: 'Sora', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --space-md: 1rem;
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08);
  --radius-md: 8px;
  --transition-base: 250ms ease;
  /* ... 50+ variables total */
}
```

---

### 4. `select_components` (Phase 3.5: Component Selection)

> Select and adapt animated UI components for your framework.

**Run this after `design_theme`.** It picks the best component for each category from the built-in library, adapts it to your framework, and locks it in the Design Token Registry.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `componentTypes` | string[] | Yes | Categories to select. See below. |
| `framework` | string | Yes | Target: `"html"`, `"react"`, `"nextjs"`, `"vue"`, `"nuxt"`, `"angular"`, `"svelte"`, `"astro"` |
| `animationPreference` | `"low"` \| `"medium"` \| `"high"` | No | Animation richness. Default: `"high"` |
| `style` | `"flat"` \| `"neumorphic"` \| `"glassmorphic"` \| `"gradient"` \| `"animated"` | No | Component visual style. If omitted, auto-resolved from your industry + tone. |

**Component visual styles (5 variants per category):**

| Style | Best For | Description |
|---|---|---|
| `flat` | Corporate, Finance, Healthcare, Legal | Clean, minimal borders, subtle shadows |
| `neumorphic` | Real Estate, Food, Elegant brands | Soft raised/inset shadows, light backgrounds |
| `glassmorphic` | Luxury, Creative, Startup | Backdrop blur, transparency, frosted glass |
| `gradient` | Gaming, Creative, Startup, Bold brands | Gradient fills, bold colors, high energy |
| `animated` | Technology, E-commerce, Modern | Heavy CSS animation focus, rich interactivity |

Style is automatically resolved from your industry and tone if not specified:

| Industry | Auto-Selected Style |
|---|---|
| Corporate, Finance, Legal, Healthcare | `flat` |
| Real Estate, Food | `neumorphic` |
| Luxury | `glassmorphic` |
| Technology, E-commerce | `animated` |
| Gaming, Startup, Creative | `gradient` |

**Component categories (13 categories × up to 5 styles = 61 components):**

| Category | ID | What You Get |
|---|---|---|
| Primary Button | `button-primary` | Filled button with shine/ripple hover, translateY lift, scale on active |
| Secondary Button | `button-secondary` | Outlined button with border fill transition, hover glow |
| Card | `card` | Shadow lift, border-color transition, accent top-border on hover |
| Text Input | `input` | Floating label, animated focus ring, border color transitions |
| Checkbox | `checkbox` | Bouncy checkmark with spring easing |
| Toggle Switch | `toggle` | Smooth sliding knob, track color transition |
| Radio Button | `radio` | Inner dot scale-in with spring easing |
| Tooltip | `tooltip` | Fade + slide-up entrance, delayed appearance |
| Modal | `modal` | Scale + fade entrance, backdrop animation |
| Loader | `loader` | Pulsing concentric rings |
| Badge | `badge` | Pill shape with semantic color variants (success/warning/error/info) |
| Dropdown | `dropdown` | Slide-down + fade, item hover highlights |
| Navigation | `navigation` | Animated underline that grows on hover |

**Presets (shorthand for common sets):**

| Preset | Components Included | Count |
|---|---|---|
| `"all"` | Every component | 13 |
| `"landing"` | button-primary, button-secondary, card, navigation, badge | 5 |
| `"form"` | input, checkbox, toggle, radio, button-primary, button-secondary | 6 |
| `"dashboard"` | button-primary, button-secondary, card, input, toggle, badge, dropdown, navigation, modal, loader | 10 |
| `"minimal"` | button-primary, card, input, navigation | 4 |

**What it returns:**

- Production-ready code for each component (HTML/CSS, JSX, Vue SFC, Angular, or Svelte)
- Separate CSS with zero hardcoded colors — everything uses your design tokens
- A locked Design Token Registry (guarantees consistency)
- Accessibility notes per component

---

### 5. `generate_background` (Phase 4: Background & Pattern Engine)

> Generate subtle CSS background patterns matched to your industry.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `industry` | string | Yes | Business type for automatic pattern selection |
| `theme` | `"light"` \| `"dark"` \| `"auto"` | Yes | Theme mode |
| `style` | string | No | Override: `"geometric"`, `"gradient"`, `"noise"`, `"organic"`, `"blob"` |

**Pattern types:**

| Style | Best For | What It Looks Like |
|---|---|---|
| `geometric` | Tech, SaaS, Corporate | Dot grids, line grids, diagonal stripes |
| `gradient` | Startup, Creative, Modern | Soft radial gradient meshes using your palette |
| `noise` | Luxury, Editorial, Artisan | SVG fractal noise texture overlay |
| `organic` | Health, Education, Nature | Wave clip-paths for section dividers |
| `blob` | Creative, Playful, SaaS | Animated morphing blob shapes |

---

### 6. `scaffold_project` (Phase 5: Project Scaffolding)

> Generate complete project directory structure with base files and boilerplate.

**Input:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `framework` | string | Yes | Target: `"html"`, `"react"`, `"nextjs"`, `"vue"`, `"nuxt"`, `"angular"`, `"svelte"`, `"astro"` |
| `designTokens` | object | Yes | Output from `design_theme` |
| `sections` | string[] | Yes | Page sections to scaffold. e.g. `["hero", "features", "pricing", "footer"]` |
| `includeTests` | boolean | No | Generate test files. Default: false |

**What it returns:**

- Complete directory tree with all folders
- CSS variables file (from design tokens)
- CSS reset and base styles
- HTML/component templates for each section
- Navigation and layout scaffolding
- Animation utility classes
- Ready to run — just fill in content

**Example output structure for React:**

```
src/
├── components/
│   ├── ui/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   └── ...
│   └── sections/
│       ├── Hero/
│       ├── Features/
│       └── ...
├── styles/
│   ├── variables.css
│   ├── base.css
│   └── animations.css
└── pages/
    └── page.tsx
```

---

### 7. `generate_full_page` (Phase 6: Code Generation)

> Generate complete, production-ready page code with all components, animations, and styling.

**Input:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `architecture` | object | Yes | Output from `plan_architecture` |
| `designSystem` | object | Yes | Output from `design_theme` + `select_components` |
| `framework` | string | Yes | Target framework |
| `sections` | object[] | No | Section content. Each: `{ name, title, content, imageUrl }` |
| `includeAnimations` | boolean | No | Include scroll entrance animations. Default: true |
| `darkModeSupport` | boolean | No | Generate dark theme variant. Default: false |

**What it returns:**

- **Complete page code** — ready to copy-paste and run
- Semantic HTML (or JSX/Vue/Angular templates)
- All components integrated
- All animations (hover, focus, scroll-triggered)
- Responsive design at all breakpoints
- Accessibility attributes (ARIA, keyboard nav, contrast validated)
- Zero hardcoded colors — all CSS variables
- Zero console errors

**Generated code includes:**

- Header/navigation with animated underlines
- Hero section with entrance animations
- Feature cards with staggered reveals
- Pricing tables with hover effects
- Testimonial carousels
- Footer with organized links
- Mobile menu hamburger with animation
- Fully functional form validation (if sections include forms)

---

### 8. `review_output` (Phase 7: QA Review)

> Automated QA against design philosophy and anti-pattern detection.

**Input:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `code` | string | Yes | Generated code to review |
| `scope` | object | Yes | Original project scope from `analyze_project` |
| `designTokens` | object | No | Design tokens for validation |

**What it returns:**

- **QA Report** with pass/fail on 30+ checks
- Visual review checklist (design, hierarchy, animations)
- Technical review checklist (accessibility, performance, HTML validity)
- Business alignment check
- Anti-pattern detection (purple-blue gradients, AI tells, inconsistent components)
- Specific remediation suggestions
- Overall quality score (1-10)
- Ready-to-fix action items

**Checks include:**

| Category | Examples |
|---|---|
| **Design** | Colors cohesive? Hierarchy clear? Animations smooth? Feels AI-generated? |
| **Component Consistency** | All buttons match? Cards all same style? Colors use CSS variables? |
| **Accessibility** | WCAG AA contrast? Keyboard nav works? Alt text present? Focus rings visible? |
| **Performance** | Images optimized? No layout thrashing? Animations GPU-accelerated? |
| **HTML Quality** | Valid semantic HTML? No unused classes? Proper nesting? |
| **Business Alignment** | Does it match the business context? CTA clear? Information hierarchy logical? |

**Example report:**

```
QA REPORT — Fintech Landing Page
═════════════════════════════════════

✅ Design Quality: PASS
✅ Component Consistency: PASS
✅ Accessibility (WCAG AA): PASS
✅ Performance: PASS
⚠️  Animation Density: WARNING — Hero section lacks scroll animation
❌ Business Alignment: FAIL — CTA button not prominent enough

Overall Score: 8/10

Recommendations:
1. Add fade-in-up animation to hero headline
2. Increase CTA button size by 20%
3. Verify pricing section contrast ratio on hover states
```

---

## Usage Examples

### Example 1: "Build me a fintech landing page in React"

```
You: Build me a fintech landing page for a startup that offers budgeting tools.
     Include hero, features, pricing, and CTA sections. React + modern tone.

Claude uses pipeline:
1. analyze_project → scope: landing page, fintech, millennials, modern tone
2. plan_architecture → React + CSS Modules, component hierarchy
3. design_theme → light theme, navy primary, gold accent, Sora + Inter
4. select_components → ["landing"], framework: "react"
5. generate_background → geometric dot-grid pattern
6. scaffold_project → complete React project structure
7. generate_full_page → full landing page with all sections + animations
8. review_output → QA report, validate against design philosophy

Result: Complete, production-ready React landing page with:
  - Light theme, navy #0A2540 primary, gold accent
  - 5 animated React components (button, card, nav, badge)
  - Scroll-triggered entrance animations on all sections
  - Responsive at 375px, 768px, 1024px, 1440px
  - WCAG AA accessible, keyboard navigable
  - Dot-grid background pattern on hero
  - Zero hardcoded colors (all CSS variables)
```

### Example 2: "I need a full dashboard in Vue with components"

```
You: I'm building an admin dashboard for healthcare SaaS. Need 10 Vue components
     with animations. Corporate, trustworthy tone.

Claude uses:
1. analyze_project → dashboard, healthcare, B2B doctors, corporate tone
2. plan_architecture → Vue + Scoped CSS, admin panel hierarchy
3. design_theme → light theme, teal primary, clean typography
4. select_components → ["dashboard"], framework: "vue"
5. generate_background → subtle organic wave pattern
6. scaffold_project → complete Nuxt project with component structure
7. generate_full_page → dashboard layout + 10 components
8. review_output → validate component consistency, animation density

Result: 10 Vue Single File Components (buttons, cards, inputs, toggles, modals,
loaders, dropdowns) with scoped styles, all using the design token system.
```

### Example 3: "Just give me components for my Angular project"

```
You: I need button-primary, card, and input components for Angular.
     Corporate style, flat design.

Claude uses:
1. design_theme → corporate, light, navy primary, 4px radii
2. select_components → ["button-primary", "card", "input"], framework: "angular"
3. review_output → validate component code quality

Result: 3 production Angular components with separate HTML + SCSS,
hover lift animations, focus rings, zero hardcoded colors.
```

---

## Architecture

```
ui-architect-mcp/
├── src/
│   ├── index.ts                    # MCP server entry point (stdio transport)
│   ├── engine/
│   │   ├── types.ts                # All TypeScript type definitions
│   │   ├── color-engine.ts         # Color Intelligence Engine (15 industry profiles)
│   │   ├── typography-engine.ts    # Font pairing, type scale, spacing, shadows
│   │   ├── pattern-engine.ts       # Background pattern generator (5 styles)
│   │   ├── component-library.ts    # 61 curated components (13 categories × 5 styles)
│   │   ├── components-part2.ts     # Toggle, radio, loader components
│   │   ├── components-part3.ts     # Badge, tooltip, nav, modal, dropdown components
│   │   └── component-adapter.ts    # Framework adapters + Design Token Registry
│   └── tools/
│       ├── design-theme.ts         # design_theme tool implementation
│       ├── select-components.ts    # select_components tool implementation
│       └── generate-background.ts  # generate_background tool implementation
├── CLAUDE.md                       # AI instruction file (1,278 lines of design rules)
├── package.json
├── tsconfig.json
└── README.md
```

**6,000+ lines of TypeScript** across 12 source files.

### How the engines work

**Color Intelligence Engine** (`color-engine.ts`)
- 15 industry color profiles with curated primary/secondary/accent palettes
- Industry-aware theme selection (gaming → dark, healthcare → light, etc.)
- Tinted neutral scale generation (warm primary → warm grays)
- WCAG AA contrast validation on all text/background combos
- Seeded randomness for deterministic palette generation
- Never produces the purple-blue AI gradient

**Typography Engine** (`typography-engine.ts`)
- 10 Google Font pairings scored by industry + tone match
- Modular type scale (1.25 ratio, Display through Caption)
- Tone-aware border radius (corporate → sharp 2-4px, playful → rounded 10-14px)
- Complete CSS variable generation for every subsystem

**Component Library** (`component-library.ts` + `components-part2.ts` + `components-part3.ts`)
- 61 curated components across 13 categories and 5 visual styles
- Styles: flat, neumorphic, glassmorphic, gradient, animated
- CSS keyframes, spring easings, hover transforms, focus rings across all variants
- Zero hardcoded colors — all use CSS custom property references
- ARIA attributes baked into HTML templates

**Component Adapter** (`component-adapter.ts`)
- Converts raw HTML/CSS into React JSX, Vue SFC, Angular components, Svelte, or vanilla HTML
- Builds the Design Token Registry (locks one style per category)
- Auto-resolves component style from industry + tone (e.g., corporate → flat, gaming → gradient)
- Generates accessibility audit notes per component

---

## Design Philosophy

These are the core rules baked into every output:

### Never Looks AI-Generated

| AI Tell | How We Avoid It |
|---|---|
| Purple-blue gradients | 15 industry-specific palettes, purple-blue is blocked |
| Symmetric 3x2 card grids | Design Token Registry enforces hierarchy, not repetition |
| Dark theme for everything | Business-context algorithm (fintech=light, gaming=dark) |
| Static, lifeless pages | Every component ships with hover, focus, entrance, ambient animations |
| Inconsistent component styles | Design Token Registry locks ONE style per category |
| Hardcoded colors | Zero hex values in components — everything is `var(--color-*)` |

### Design Token Registry

The registry guarantees visual consistency:

- **Buttons:** Maximum 2 variants (primary filled + secondary outlined)
- **Cards:** 1 style, vary only size/content
- **Inputs:** 1 style for all field types
- **Every other component:** 1 locked style per category

This mirrors how real design systems work (Material UI, Chakra, Ant Design).

### High Animation by Default

Every component includes:
- Hover transforms (translateY, scale, shadow elevation)
- Focus rings with primary color glow
- Active states (press-down scale)
- Entrance animations for scroll-triggered reveals
- Ambient effects (floating, pulsing, gradient shifting)
- Spring easings (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for playful interactions
- Expo curves (`cubic-bezier(0.16, 1, 0.3, 1)`) for smooth entrances

### WCAG AA Accessible

- All text/background combos pass 4.5:1 contrast ratio
- No pure black `#000` or pure white `#FFF` — neutrals are tinted toward the primary hue
- ARIA attributes in every component template
- Keyboard-navigable interactive elements
- Focus indicators on all focusable elements

---

## Supported Frameworks

| Framework | Output Format | Styling |
|---|---|---|
| HTML/CSS/JS | Semantic HTML + separate CSS | Pure CSS with custom properties |
| React | Functional components + CSS file | CSS Modules compatible |
| Next.js | Same as React (compatible with App Router) | CSS Modules compatible |
| Vue | Single File Components `<script setup>` | `<style scoped>` |
| Nuxt | Same as Vue | `<style scoped>` |
| Angular | Component class + template + stylesheet | Component CSS |
| Svelte | `.svelte` SFC with scoped styles | Scoped `<style>` |
| Astro | HTML output (same as vanilla) | Pure CSS |

---

## Supported Industries

The Color Intelligence Engine has curated profiles for:

| Industry | Example Inputs |
|---|---|
| Finance / Banking | `"fintech"`, `"banking"`, `"insurance"` |
| Healthcare / Medical | `"healthcare"`, `"medical"`, `"pharma"` |
| Technology / SaaS | `"saas"`, `"tech"`, `"software"`, `"ai"`, `"devtools"` |
| E-commerce / Retail | `"ecommerce"`, `"shop"`, `"store"`, `"marketplace"` |
| Education | `"education"`, `"edtech"`, `"school"`, `"university"` |
| Food / Restaurant | `"restaurant"`, `"cafe"`, `"bakery"`, `"food"` |
| Real Estate | `"realestate"`, `"property"`, `"housing"` |
| Legal | `"legal"`, `"law"`, `"attorney"` |
| Creative / Design | `"creative"`, `"agency"`, `"design"`, `"photography"`, `"portfolio"` |
| Environmental | `"environmental"`, `"eco"`, `"sustainability"`, `"climate"` |
| Gaming / Entertainment | `"gaming"`, `"esports"`, `"entertainment"` |
| Nonprofit / NGO | `"nonprofit"`, `"ngo"`, `"charity"`, `"foundation"` |
| Luxury / Fashion | `"luxury"`, `"fashion"`, `"jewelry"`, `"premium"` |
| Startup | `"startup"` |
| Corporate / B2B | `"corporate"`, `"enterprise"`, `"b2b"`, `"consulting"` |

Any unrecognized input defaults to Technology with a Modern tone.

---

## Roadmap

**Core Pipeline (Complete):**
- [x] `analyze_project` — Phase 1 requirement analysis
- [x] `plan_architecture` — Phase 2 system design
- [x] `design_theme` — Phase 3 design system generation
- [x] `select_components` — Phase 3.5 component selection
- [x] `generate_background` — Phase 4 pattern generation
- [x] `scaffold_project` — Phase 5 project scaffolding
- [x] `generate_full_page` — Phase 6 code generation
- [x] `review_output` — Phase 7 QA review

**Future Enhancements:**
- [ ] Live fetch from UIverse.io (hybrid: built-in library + live updates)
- [ ] `generate_section` tool — individual section code generation
- [ ] Dark mode toggle variant generation
- [ ] Component theming preview (HTML output you can open in browser)
- [ ] Figma export and design token sync
- [ ] Storybook integration for component documentation
- [ ] Lighthouse performance scoring in review_output

---

## Contributing

Contributions are welcome. The project is structured so you can add new components, industry profiles, or framework adapters independently.

**To add a new component:**

1. Add a `ComponentDefinition` entry to `src/engine/component-library.ts` (or `components-part2.ts` / `components-part3.ts`)
2. Choose one of the 5 styles (`flat`, `neumorphic`, `glassmorphic`, `gradient`, `animated`) and an existing category, or add a new `ComponentCategory` in `src/engine/types.ts`
3. Ensure all colors use `var(--color-*)` references (zero hardcoded hex values)
4. Set `animationLevel: 'high'` and include hover/focus/active/entrance animations
5. Add ARIA attributes to the HTML template
6. Run `npm run build` and test

**To add a new industry profile:**

1. Add an entry to `INDUSTRY_PROFILES` in `src/engine/color-engine.ts`
2. Add font pairing entries in `src/engine/typography-engine.ts`
3. Add pattern mapping in `src/engine/pattern-engine.ts`
4. Add aliases in `src/tools/design-theme.ts`

**To add a new framework adapter:**

1. Add a new adapter function in `src/engine/component-adapter.ts`
2. Add the framework to the `Framework` type in `src/engine/types.ts`
3. Handle it in the `adaptComponent` switch statement

---

## License

MIT — use it, fork it, ship it.

---

---

**[FODUU](https://www.foduu.com)** — Web Design & Development Company, India

Open-sourced by the **FODUU** team | Developed by **Nehul**

Inspired by [UIverse.io](https://uiverse.io) and the open-source design community
