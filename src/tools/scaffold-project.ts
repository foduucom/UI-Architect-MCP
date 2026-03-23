/**
 * MCP Tool: scaffold_project
 *
 * Phase 5 — Generates the complete project directory structure and base files
 * for any framework (HTML, React, Next.js, Vue, Nuxt, Angular, Svelte, Astro).
 *
 * Returns a list of files to create, installation/dev commands, and descriptions.
 */

import type {
  Framework,
  DesignTokens,
} from '../engine/types.js';
import { colorsToCssVariables } from '../engine/color-engine.js';
import {
  typographyToCssVariables,
  spacingToCssVariables,
  shadowsToCssVariables,
  radiusToCssVariables,
  transitionsToCssVariables,
} from '../engine/typography-engine.js';

// ─── Types ───────────────────────────────────────────────────────────────

export interface ScaffoldProjectInput {
  framework: string;
  designTokens: DesignTokens;
  pages: Array<{
    name: string;
    slug: string;
    sections: string[];
    isHomepage: boolean;
  }>;
  projectName?: string;
}

export interface ScaffoldFile {
  path: string;
  content: string;
  description: string;
}

export interface ScaffoldProjectOutput {
  files: ScaffoldFile[];
  summary: string;
  installCommand: string;
  devCommand: string;
}

// ─── Framework Resolution ────────────────────────────────────────────────

function resolveFramework(input: string): Framework {
  const lower = input.toLowerCase().trim();

  if (lower === 'html' || lower === 'vanilla') return 'html';
  if (lower === 'react' || lower === 'reactjs') return 'react';
  if (lower === 'nextjs' || lower === 'next.js' || lower === 'next') return 'nextjs';
  if (lower === 'vue' || lower === 'vuejs') return 'vue';
  if (lower === 'nuxt' || lower === 'nuxtjs') return 'nuxt';
  if (lower === 'angular' || lower === 'ng') return 'angular';
  if (lower === 'svelte' || lower === 'sveltekit') return 'svelte';
  if (lower === 'astro') return 'astro';

  return 'html'; // safe default
}

// ─── CSS Content Generators ──────────────────────────────────────────────

function generateCssVariables(tokens: DesignTokens): string {
  return `:root {
${colorsToCssVariables(tokens.colors)}

${typographyToCssVariables(tokens.typography)}

${spacingToCssVariables(tokens.spacing)}

${shadowsToCssVariables(tokens.shadows)}

${radiusToCssVariables(tokens.radius)}

${transitionsToCssVariables(tokens.transitions)}
}`;
}

function generateCssReset(): string {
  return `/**
 * Modern CSS Reset
 * Applied before all other styles to ensure consistent baseline
 */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  min-height: 100vh;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

input, button, textarea, select {
  font: inherit;
}

p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}

a {
  color: inherit;
  text-decoration: none;
}

ul, ol {
  list-style: none;
}`;
}

function generateAnimationsCss(): string {
  return `/**
 * Animation System
 * Scroll-triggered, hover, and ambient animations
 */

/* ─── Scroll Entrance Animations ─── */

.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.animate-from-left {
  opacity: 0;
  transform: translateX(-40px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-from-left.is-visible {
  opacity: 1;
  transform: translateX(0);
}

.animate-from-right {
  opacity: 0;
  transform: translateX(40px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-from-right.is-visible {
  opacity: 1;
  transform: translateX(0);
}

.animate-scale-in {
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-scale-in.is-visible {
  opacity: 1;
  transform: scale(1);
}

/* Staggered children animation */
.stagger-children .animate-on-scroll:nth-child(1) { transition-delay: 0ms; }
.stagger-children .animate-on-scroll:nth-child(2) { transition-delay: 100ms; }
.stagger-children .animate-on-scroll:nth-child(3) { transition-delay: 200ms; }
.stagger-children .animate-on-scroll:nth-child(4) { transition-delay: 300ms; }
.stagger-children .animate-on-scroll:nth-child(5) { transition-delay: 400ms; }
.stagger-children .animate-on-scroll:nth-child(6) { transition-delay: 500ms; }

/* ─── Card Hover Animations ─── */
.card {
  transition: transform var(--transition-base),
              box-shadow var(--transition-base),
              border-color var(--transition-base);
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-primary);
}

/* ─── Button Animations ─── */
.btn {
  position: relative;
  overflow: hidden;
  transition: transform var(--transition-fast),
              box-shadow var(--transition-fast),
              background-color var(--transition-fast),
              color var(--transition-fast);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0) scale(0.97);
  box-shadow: var(--shadow-sm);
}

.btn-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 30%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  transition: transform 0.6s ease;
  pointer-events: none;
}

.btn-primary:hover::after {
  transform: translateX(100%);
}

/* ─── Link / Nav Hover Animations ─── */
.nav-link {
  position: relative;
  transition: color var(--transition-fast);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  transition: width var(--transition-base) cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-link:hover::after {
  width: 100%;
}

/* ─── Input Focus Animations ─── */
.input-field {
  transition: border-color var(--transition-fast),
              box-shadow var(--transition-fast),
              background-color var(--transition-fast);
}

.input-field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  background-color: var(--color-neutral-50);
}

/* ─── Ambient / Decorative Animations ─── */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 20px 5px rgba(59, 130, 246, 0.15); }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}`;
}

function generateAnimationsJs(): string {
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
      entry.target.classList.add('is-visible');
      // Only animate once
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('.animate-on-scroll, .animate-from-left, .animate-from-right, .animate-scale-in').forEach(el => {
  observer.observe(el);
});`;
}

// ─── HTML Scaffold Generators ────────────────────────────────────────────

function generateHtmlPage(
  pageName: string,
  slug: string,
  isHomepage: boolean,
  tokens: DesignTokens,
  pages: Array<{ name: string; slug: string; isHomepage: boolean }>
): ScaffoldFile {
  const googleFontsUrl = tokens.typography.fonts.googleFontsUrl;
  const navLinks = pages
    .map((p) => {
      const href = p.isHomepage ? 'index.html' : `${p.slug}.html`;
      const isActive = (isHomepage && p.isHomepage) || slug === p.slug ? 'class="active"' : '';
      return `      <a href="${href}" ${isActive}>${p.name}</a>`;
    })
    .join('\n');

  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${pageName}">
  <title>${pageName}</title>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsUrl}" rel="stylesheet">

  <!-- CSS -->
  <link rel="stylesheet" href="assets/css/reset.css">
  <link rel="stylesheet" href="assets/css/variables.css">
  <link rel="stylesheet" href="assets/css/animations.css">
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/layout.css">

  <style>
    /* Page-specific styles */
  </style>
</head>
<body>
  <header>
    <nav>
${navLinks}
    </nav>
  </header>

  <main>
    <section class="hero animate-on-scroll">
      <h1>Welcome to ${pageName}</h1>
      <p>This is a scaffolded page ready for content.</p>
    </section>
  </main>

  <footer>
    <p>&copy; 2026. All rights reserved.</p>
  </footer>

  <!-- Scripts -->
  <script src="assets/js/animations.js" defer><\/script>
  <script src="assets/js/main.js" defer><\/script>
</body>
</html>`;

  return {
    path: isHomepage ? 'index.html' : `${slug}.html`,
    content,
    description: `HTML page for "${pageName}"`,
  };
}

// ─── React Scaffold Generators ───────────────────────────────────────────

function generateReactPackageJson(projectName: string): ScaffoldFile {
  return {
    path: 'package.json',
    content: `{
  "name": "${projectName || 'ui-architect-app'}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.2.12"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}`,
    description: 'React package.json with dependencies',
  };
}

function generateReactAppTsx(pages: Array<{ name: string; slug: string; isHomepage: boolean }>): ScaffoldFile {
  const routes = pages
    .map((p) => {
      const componentName = p.name.replace(/\\s+/g, '');
      const path = p.isHomepage ? '/' : `/${p.slug}`;
      return `    { path: '${path}', element: <${componentName} /> },`;
    })
    .join('\n');

  const content = `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Page components
${pages.map((p) => {
  const componentName = p.name.replace(/\\s+/g, '');
  return `import ${componentName} from './pages/${p.slug}.tsx';`;
}).join('\n')}

const routes = [
${routes}
];

export default function App() {
  return (
    <Router>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </Router>
  );
}`;

  return {
    path: 'src/App.tsx',
    content,
    description: 'React App component with routing',
  };
}

function generateReactPageComponent(pageName: string, slug: string): ScaffoldFile {
  const componentName = pageName.replace(/\\s+/g, '');
  const content = `import React from 'react';
import '../styles/${slug}.css';

export default function ${componentName}() {
  return (
    <main>
      <section className="hero animate-on-scroll">
        <h1>${pageName}</h1>
        <p>Page content goes here.</p>
      </section>
    </main>
  );
}`;

  return {
    path: `src/pages/${slug}.tsx`,
    content,
    description: `React page component for "${pageName}"`,
  };
}

function generateReactIndex(): ScaffoldFile {
  return {
    path: 'src/main.tsx',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css';
import './styles/variables.css';
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`,
    description: 'React entry point',
  };
}

function generateReactIndexHtml(): ScaffoldFile {
  return {
    path: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI Architect App</title>
</head>
<body>
  <div id="root"><\/div>
  <script type="module" src="/src/main.tsx"><\/script>
</body>
</html>`,
    description: 'React HTML entry point',
  };
}

// ─── Vue Scaffold Generators ────────────────────────────────────────────

function generateVuePackageJson(projectName: string): ScaffoldFile {
  return {
    path: 'package.json',
    content: `{
  "name": "${projectName || 'ui-architect-app'}",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "@vue/tsconfig": "^0.5.0",
    "vite": "^5.2.12"
  }
}`,
    description: 'Vue package.json with dependencies',
  };
}

function generateVueAppVue(pages: Array<{ name: string; slug: string; isHomepage: boolean }>): ScaffoldFile {
  const imports = pages
    .map((p) => {
      const componentName = p.name.replace(/\\s+/g, '');
      return `import ${componentName} from './pages/${p.slug}.vue';`;
    })
    .join('\n');

  const routes = pages
    .map((p) => {
      const componentName = p.name.replace(/\\s+/g, '');
      const path = p.isHomepage ? '/' : `/${p.slug}`;
      return `    { path: '${path}', component: ${componentName} },`;
    })
    .join('\n');

  const content = `<template>
  <router-view />
</template>

<script setup lang="ts">
${imports}

// Routes
const routes = [
${routes}
];
<\/script>

<style>
@import './styles/globals.css';
@import './styles/variables.css';
@import './styles/animations.css';
</style>`;

  return {
    path: 'src/App.vue',
    content,
    description: 'Vue App component with routing',
  };
}

function generateVuePageComponent(pageName: string, slug: string): ScaffoldFile {
  const content = `<template>
  <main>
    <section class="hero animate-on-scroll">
      <h1>${pageName}</h1>
      <p>Page content goes here.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  // Initialize animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
});
<\/script>

<style scoped>
import '../styles/${slug}.css';
</style>`;

  return {
    path: `src/pages/${slug}.vue`,
    content,
    description: `Vue page component for "${pageName}"`,
  };
}

function generateVueMain(): ScaffoldFile {
  return {
    path: 'src/main.ts',
    content: `import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';

const routes = [
  // Routes configured in App.vue
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(router);
app.mount('#app');`,
    description: 'Vue entry point',
  };
}

function generateViteConfigVue(): ScaffoldFile {
  return {
    path: 'vite.config.ts',
    content: `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
  },
});`,
    description: 'Vite configuration for Vue',
  };
}

function generateVueIndexHtml(): ScaffoldFile {
  return {
    path: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI Architect App</title>
</head>
<body>
  <div id="app"><\/div>
  <script type="module" src="/src/main.ts"><\/script>
</body>
</html>`,
    description: 'Vue HTML entry point',
  };
}

// ─── Next.js Scaffold Generators ─────────────────────────────────────────

function generateNextPackageJson(projectName: string): ScaffoldFile {
  return {
    path: 'package.json',
    content: `{
  "name": "${projectName || 'ui-architect-app'}",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "typescript": "^5.4.0"
  }
}`,
    description: 'Next.js package.json',
  };
}

function generateNextLayout(tokens: DesignTokens): ScaffoldFile {
  const googleFontsUrl = tokens.typography.fonts.googleFontsUrl;
  const content = `import type { Metadata } from 'next';
import './globals.css';
import './variables.css';
import './animations.css';

export const metadata: Metadata = {
  title: 'UI Architect App',
  description: 'Generated with UI Architect MCP',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="${googleFontsUrl}" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}`;

  return {
    path: 'app/layout.tsx',
    content,
    description: 'Next.js root layout',
  };
}

function generateNextPage(): ScaffoldFile {
  return {
    path: 'app/page.tsx',
    content: `export default function Home() {
  return (
    <main>
      <section className="hero animate-on-scroll">
        <h1>Welcome</h1>
        <p>This is your Next.js app scaffolded with UI Architect.</p>
      </section>
    </main>
  );
}`,
    description: 'Next.js home page',
  };
}

function generateNextConfig(): ScaffoldFile {
  return {
    path: 'next.config.js',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;`,
    description: 'Next.js configuration',
  };
}

function generateTsConfig(): ScaffoldFile {
  return {
    path: 'tsconfig.json',
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`,
    description: 'TypeScript configuration',
  };
}

// ─── Angular Scaffold Generators ────────────────────────────────────────

function generateAngularPackageJson(projectName: string): ScaffoldFile {
  return {
    path: 'package.json',
    content: `{
  "name": "${projectName || 'ui-architect-app'}",
  "version": "0.1.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^18.0.0",
    "@angular/common": "^18.0.0",
    "@angular/compiler": "^18.0.0",
    "@angular/core": "^18.0.0",
    "@angular/forms": "^18.0.0",
    "@angular/platform-browser": "^18.0.0",
    "@angular/platform-browser-dynamic": "^18.0.0",
    "@angular/router": "^18.0.0",
    "rxjs": "^7.8.0",
    "tslib": "^2.6.0",
    "zone.js": "^0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^18.0.0",
    "@angular/cli": "^18.0.0",
    "@angular/compiler-cli": "^18.0.0",
    "typescript": "~5.4.0"
  }
}`,
    description: 'Angular package.json',
  };
}

function generateAngularModuleTs(): ScaffoldFile {
  return {
    path: 'src/app/app.module.ts',
    content: `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}`,
    description: 'Angular root module',
  };
}

function generateAngularRoutingModule(): ScaffoldFile {
  return {
    path: 'src/app/app-routing.module.ts',
    content: `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}`,
    description: 'Angular routing module',
  };
}

function generateAngularComponentTs(): ScaffoldFile {
  return {
    path: 'src/app/app.component.ts',
    content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'ui-architect-app';
}`,
    description: 'Angular root component',
  };
}

function generateAngularComponentHtml(): ScaffoldFile {
  return {
    path: 'src/app/app.component.html',
    content: `<router-outlet><\/router-outlet>`,
    description: 'Angular root component template',
  };
}

// ─── Svelte Scaffold Generators ─────────────────────────────────────────

function generateSveltePackageJson(projectName: string): ScaffoldFile {
  return {
    path: 'package.json',
    content: `{
  "name": "${projectName || 'ui-architect-app'}",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.1.0",
    "svelte": "^4.2.0",
    "vite": "^5.2.0"
  },
  "dependencies": {
    "svelte-spa-router": "^3.3.0"
  }
}`,
    description: 'Svelte package.json',
  };
}

function generateSvelteAppSvelte(): ScaffoldFile {
  return {
    path: 'src/App.svelte',
    content: `<script>
  import { currentLocation } from 'svelte-spa-router';

  let location = '';
  $: location = $currentLocation;
<\/script>

<main>
  <h1>Welcome to UI Architect Svelte</h1>
  <p>Current location: {location}</p>
</main>

<style>
  @import './styles/globals.css';
  @import './styles/variables.css';
  @import './styles/animations.css';
</style>`,
    description: 'Svelte root component',
  };
}

function generateSvelteMain(): ScaffoldFile {
  return {
    path: 'src/main.ts',
    content: `import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;`,
    description: 'Svelte entry point',
  };
}

function generateSvelteViteConfig(): ScaffoldFile {
  return {
    path: 'vite.config.ts',
    content: `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
  },
});`,
    description: 'Svelte Vite configuration',
  };
}

function generateSvelteIndex(): ScaffoldFile {
  return {
    path: 'index.html',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UI Architect Svelte</title>
  </head>
  <body>
    <div id="app"><\/div>
    <script type="module" src="/src/main.ts"><\/script>
  </body>
</html>`,
    description: 'Svelte HTML entry point',
  };
}

// ─── Astro Scaffold Generators ──────────────────────────────────────────

function generateAstroPackageJson(projectName: string): ScaffoldFile {
  return {
    path: 'package.json',
    content: `{
  "name": "${projectName || 'ui-architect-app'}",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^4.4.0"
  },
  "devDependencies": {}
}`,
    description: 'Astro package.json',
  };
}

function generateAstroConfig(): ScaffoldFile {
  return {
    path: 'astro.config.mjs',
    content: `import { defineConfig } from 'astro/config';

export default defineConfig({
  // ...
});`,
    description: 'Astro configuration',
  };
}

function generateAstroIndexPage(): ScaffoldFile {
  return {
    path: 'src/pages/index.astro',
    content: `---
// Welcome to Astro
import '../styles/globals.css';
import '../styles/variables.css';
import '../styles/animations.css';
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width" />
    <title>Welcome to Astro</title>
  </head>
  <body>
    <h1>Welcome to UI Architect Astro</h1>
    <p>Scaffolded with the UI Architect MCP.</p>
  </body>
</html>`,
    description: 'Astro home page',
  };
}

// ─── Nuxt Scaffold Generators ───────────────────────────────────────────

function generateNuxtPackageJson(projectName: string): ScaffoldFile {
  return {
    path: 'package.json',
    content: `{
  "name": "${projectName || 'ui-architect-app'}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "devDependencies": {
    "@nuxt/devtools": "latest",
    "nuxt": "^3.11.0",
    "vue": "^3.4.0"
  }
}`,
    description: 'Nuxt package.json',
  };
}

function generateNuxtConfig(): ScaffoldFile {
  return {
    path: 'nuxt.config.ts',
    content: `export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/globals.css', '~/assets/css/variables.css', '~/assets/css/animations.css'],
});`,
    description: 'Nuxt configuration',
  };
}

function generateNuxtAppVue(): ScaffoldFile {
  return {
    path: 'app.vue',
    content: `<template>
  <NuxtPage />
</template>`,
    description: 'Nuxt root App component',
  };
}

function generateNuxtIndexPage(): ScaffoldFile {
  return {
    path: 'pages/index.vue',
    content: `<template>
  <main>
    <section class="hero animate-on-scroll">
      <h1>Welcome to Nuxt</h1>
      <p>This is your Nuxt app scaffolded with UI Architect.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
});
<\/script>`,
    description: 'Nuxt home page',
  };
}

// ─── Shared Base Files ───────────────────────────────────────────────────

function generateBaseCSS(tokens: DesignTokens): string {
  return `/**
 * Base Styles
 * Applied to all elements after reset
 */

body {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--color-neutral-900);
  background-color: var(--color-neutral-50);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  line-height: var(--lh-heading);
  font-weight: var(--fw-semibold);
  color: var(--color-neutral-900);
}

h1 {
  font-size: var(--fs-h1);
}

h2 {
  font-size: var(--fs-h2);
  margin-top: var(--space-3xl);
  margin-bottom: var(--space-lg);
}

h3 {
  font-size: var(--fs-h3);
}

h4 {
  font-size: var(--fs-h4);
}

p {
  margin-bottom: var(--space-md);
  color: var(--color-neutral-700);
}

a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-primary-dark);
}`;
}

function generateLayoutCSS(): string {
  return `/**
 * Layout Utilities
 * Grid, flexbox, and container styles
 */

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
}

header {
  background-color: var(--color-neutral-50);
  border-bottom: 1px solid var(--color-neutral-100);
  padding: var(--space-md) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

nav {
  display: flex;
  gap: var(--space-lg);
  align-items: center;
}

nav a {
  font-weight: var(--fw-medium);
  transition: color var(--transition-fast);
}

nav a:hover {
  color: var(--color-primary);
}

nav a.active {
  color: var(--color-primary);
}

main {
  min-height: calc(100vh - 200px);
  padding: var(--space-4xl) var(--space-lg);
}

footer {
  background-color: var(--color-neutral-100);
  padding: var(--space-3xl) var(--space-lg);
  text-align: center;
  color: var(--color-neutral-700);
  margin-top: var(--space-5xl);
}

section {
  margin-bottom: var(--space-4xl);
}

.hero {
  text-align: center;
  padding: var(--space-5xl) var(--space-lg);
}

.hero h1 {
  font-size: var(--fs-display);
  margin-bottom: var(--space-lg);
}

.hero p {
  font-size: var(--fs-h4);
  color: var(--color-neutral-700);
}

@media (max-width: 768px) {
  nav {
    flex-direction: column;
  }

  main {
    padding: var(--space-2xl) var(--space-md);
  }

  .hero {
    padding: var(--space-3xl) var(--space-md);
  }

  .hero h1 {
    font-size: var(--fs-h1);
  }
}`;
}

function generateReadme(framework: Framework, projectName: string): ScaffoldFile {
  const commands = {
    html: {
      install: 'No installation needed — just open index.html in a browser',
      dev: 'Open index.html in your browser or use a local server',
    },
    react: {
      install: 'npm install',
      dev: 'npm run dev',
    },
    nextjs: {
      install: 'npm install',
      dev: 'npm run dev',
    },
    vue: {
      install: 'npm install',
      dev: 'npm run dev',
    },
    nuxt: {
      install: 'npm install',
      dev: 'npm run dev',
    },
    angular: {
      install: 'npm install',
      dev: 'ng serve',
    },
    svelte: {
      install: 'npm install',
      dev: 'npm run dev',
    },
    astro: {
      install: 'npm install',
      dev: 'npm run dev',
    },
  };

  const cmds = commands[framework];

  return {
    path: 'README.md',
    content: `# ${projectName || 'UI Architect Project'}

## Quick Start

### Installation
\`\`\`bash
${cmds.install}
\`\`\`

### Development
\`\`\`bash
${cmds.dev}
\`\`\`

## Project Structure

This project was scaffolded using the **UI Architect MCP Server**, which generates production-ready, professional web pages with:

- **Design System**: Complete color, typography, spacing, and animation tokens
- **Responsive Layout**: Mobile-first CSS with proper breakpoints
- **Animations**: Scroll-triggered entrances, hover effects, and micro-interactions
- **Accessibility**: Semantic HTML, keyboard navigation, WCAG AA compliance
- **Framework**: Built with ${framework.charAt(0).toUpperCase() + framework.slice(1)}

## Design System

All styles use CSS custom properties defined in \`variables.css\`. Customize colors, spacing, and typography through the design token system.

## Key Files

- \`css/variables.css\` — Design tokens (colors, typography, spacing)
- \`css/reset.css\` — Modern CSS reset
- \`css/animations.css\` — Scroll and interaction animations
- \`css/base.css\` — Base element styles
- \`css/layout.css\` — Layout utilities and structural styles

## Adding Content

Each page is scaffolded with a hero section and main area. Add content within the \`<main>\` element and use the \`animate-on-scroll\` class to enable entrance animations.

---

**Generated by UI Architect MCP** — Production-ready UI scaffolding for modern web projects.`,
    description: 'Project README',
  };
}

// ─── Main Tool Function ──────────────────────────────────────────────────

export function scaffoldProject(input: ScaffoldProjectInput): ScaffoldProjectOutput {
  const framework = resolveFramework(input.framework);
  const projectName = input.projectName || 'UI Architect Project';
  const { designTokens, pages } = input;

  const files: ScaffoldFile[] = [];

  // === Determine asset prefix based on framework ===
  // Vanilla HTML: assets/ folder at root (professional structure)
  // Frameworks: src/ based structure
  const isVanilla = framework === 'html';
  const cssPrefix = isVanilla ? 'assets/css' : 'css';
  const jsPrefix = isVanilla ? 'assets/js' : 'js';

  // === Shared CSS Files (all frameworks) ===
  files.push({
    path: `${cssPrefix}/variables.css`,
    content: generateCssVariables(designTokens),
    description: 'CSS custom properties / design tokens',
  });

  files.push({
    path: `${cssPrefix}/reset.css`,
    content: generateCssReset(),
    description: 'Modern CSS reset',
  });

  files.push({
    path: `${cssPrefix}/animations.css`,
    content: generateAnimationsCss(),
    description: 'Scroll and interaction animations',
  });

  files.push({
    path: `${cssPrefix}/base.css`,
    content: generateBaseCSS(designTokens),
    description: 'Base element styles',
  });

  files.push({
    path: `${cssPrefix}/layout.css`,
    content: generateLayoutCSS(),
    description: 'Layout utilities',
  });

  files.push({
    path: `${jsPrefix}/animations.js`,
    content: generateAnimationsJs(),
    description: 'Animation initialization script',
  });

  files.push({
    path: `${jsPrefix}/main.js`,
    content: '// Main application code here\nconsole.log("App ready!");',
    description: 'Main application file',
  });

  // === Vanilla HTML: Create asset directories with placeholder files ===
  if (isVanilla) {
    files.push({
      path: 'assets/images/.gitkeep',
      content: '',
      description: 'Image assets directory placeholder',
    });
    files.push({
      path: 'assets/fonts/.gitkeep',
      content: '',
      description: 'Font assets directory placeholder',
    });
  }

  // === Framework-Specific Files ===
  if (framework === 'html') {
    // Generate HTML pages
    pages.forEach((page) => {
      files.push(generateHtmlPage(page.name, page.slug, page.isHomepage, designTokens, pages));
    });
  } else if (framework === 'react') {
    files.push(generateReactPackageJson(projectName));
    files.push(generateReactIndex());
    files.push(generateReactIndexHtml());
    files.push(generateReactAppTsx(pages));
    files.push(generateTsConfig());
    pages.forEach((page) => {
      files.push(generateReactPageComponent(page.name, page.slug));
    });
    files.push({
      path: 'src/App.css',
      content: '/* App styles */',
      description: 'App component styles',
    });
  } else if (framework === 'nextjs') {
    files.push(generateNextPackageJson(projectName));
    files.push(generateNextConfig());
    files.push(generateTsConfig());
    files.push(generateNextLayout(designTokens));
    files.push(generateNextPage());
    files.push({
      path: 'app/globals.css',
      content: '/* Global styles */',
      description: 'Global styles',
    });
  } else if (framework === 'vue') {
    files.push(generateVuePackageJson(projectName));
    files.push(generateViteConfigVue());
    files.push(generateVueIndexHtml());
    files.push(generateVueMain());
    files.push(generateVueAppVue(pages));
    files.push(generateTsConfig());
    pages.forEach((page) => {
      files.push(generateVuePageComponent(page.name, page.slug));
    });
    files.push({
      path: 'src/styles/globals.css',
      content: '/* Global styles */',
      description: 'Global Vue styles',
    });
  } else if (framework === 'nuxt') {
    files.push(generateNuxtPackageJson(projectName));
    files.push(generateNuxtConfig());
    files.push(generateNuxtAppVue());
    files.push(generateNuxtIndexPage());
    files.push(generateTsConfig());
    files.push({
      path: 'assets/css/globals.css',
      content: '/* Global styles */',
      description: 'Global Nuxt styles',
    });
  } else if (framework === 'angular') {
    files.push(generateAngularPackageJson(projectName));
    files.push(generateAngularModuleTs());
    files.push(generateAngularRoutingModule());
    files.push(generateAngularComponentTs());
    files.push(generateAngularComponentHtml());
    files.push(generateTsConfig());
    files.push({
      path: 'src/styles.css',
      content: '/* Global styles */',
      description: 'Global Angular styles',
    });
  } else if (framework === 'svelte') {
    files.push(generateSveltePackageJson(projectName));
    files.push(generateSvelteViteConfig());
    files.push(generateSvelteIndex());
    files.push(generateSvelteMain());
    files.push(generateSvelteAppSvelte());
    files.push(generateTsConfig());
    files.push({
      path: 'src/styles/globals.css',
      content: '/* Global styles */',
      description: 'Global Svelte styles',
    });
  } else if (framework === 'astro') {
    files.push(generateAstroPackageJson(projectName));
    files.push(generateAstroConfig());
    files.push(generateAstroIndexPage());
    files.push({
      path: 'src/styles/globals.css',
      content: '/* Global styles */',
      description: 'Global Astro styles',
    });
  }

  // === Add README and license ===
  files.push(generateReadme(framework, projectName));
  files.push({
    path: '.gitignore',
    content: `node_modules/
dist/
build/
.env.local
.env.*.local
*.log
.DS_Store`,
    description: 'Git ignore file',
  });

  // === Build summary ===
  const installCommand =
    framework === 'html'
      ? 'Open index.html in your browser'
      : 'npm install';

  const devCommand =
    framework === 'html'
      ? 'Open index.html in your browser or use a local server'
      : framework === 'nextjs'
        ? 'npm run dev'
        : framework === 'angular'
          ? 'ng serve'
          : 'npm run dev';

  const summary = buildScaffoldSummary(framework, pages, projectName);

  return {
    files,
    summary,
    installCommand,
    devCommand,
  };
}

// ─── Summary Builder ─────────────────────────────────────────────────────

function buildScaffoldSummary(framework: Framework, pages: Array<{ name: string; slug: string }>, projectName: string): string {
  return `## Project Scaffolded

**Framework:** ${framework.toUpperCase()}
**Project Name:** ${projectName}
**Pages:** ${pages.length} (${pages.map((p) => p.name).join(', ')})

### Files Generated

#### Shared CSS
- \`css/variables.css\` — Design tokens (colors, typography, spacing, shadows, etc.)
- \`css/reset.css\` — Modern CSS reset
- \`css/animations.css\` — Scroll and interaction animations
- \`css/base.css\` — Base element styles
- \`css/layout.css\` — Layout utilities and structural styles

#### JavaScript
- \`js/animations.js\` — Intersection Observer for scroll animations
- \`js/main.js\` — Application entry point

#### Framework-Specific
${getFrameworkFilesSummary(framework)}

### Next Steps

1. **Install dependencies** (if needed):
   \`\`\`bash
   ${framework === 'html' ? '# No installation needed' : 'npm install'}
   \`\`\`

2. **Start development server**:
   \`\`\`bash
   ${getDevCommand(framework)}
   \`\`\`

3. **Add content** to your pages
4. **Customize colors & typography** in \`css/variables.css\`
5. **Enable animations** by adding \`animate-on-scroll\`, \`animate-from-left\`, etc. classes

### Design System

All styles use CSS custom properties:
- **Colors**: \`var(--color-primary)\`, \`var(--color-neutral-700)\`, etc.
- **Typography**: \`var(--font-heading)\`, \`var(--fs-h1)\`, etc.
- **Spacing**: \`var(--space-lg)\`, \`var(--space-2xl)\`, etc.
- **Animations**: \`var(--transition-base)\`, \`var(--ease-spring)\`, etc.

### Animations

The project includes production-ready animations:
- **Scroll entrances**: Fade-in-up, fade-from-left, fade-from-right, scale-in
- **Hover effects**: Card lift, button glow, link underline
- **State changes**: Focus rings, active states
- **Ambient**: Float, pulse-glow, gradient-shift

Use the \`is-visible\` class (added by \`js/animations.js\`) or add animation classes to elements.`;
}

function getFrameworkFilesSummary(framework: Framework): string {
  const summaries: Record<Framework, string> = {
    html: `- \`index.html\` — Home page
- Additional \`.html\` files for each page`,
    react: `- \`package.json\` — Dependencies (React, React Router)
- \`src/main.tsx\` — Entry point
- \`src/App.tsx\` — Root component with routing
- \`src/pages/*.tsx\` — Page components
- \`tsconfig.json\` — TypeScript configuration`,
    nextjs: `- \`package.json\` — Dependencies (Next.js, React)
- \`next.config.js\` — Next.js configuration
- \`app/layout.tsx\` — Root layout
- \`app/page.tsx\` — Home page
- \`tsconfig.json\` — TypeScript configuration`,
    vue: `- \`package.json\` — Dependencies (Vue, Vue Router)
- \`vite.config.ts\` — Vite configuration
- \`src/main.ts\` — Entry point
- \`src/App.vue\` — Root component
- \`src/pages/*.vue\` — Page components`,
    nuxt: `- \`package.json\` — Dependencies
- \`nuxt.config.ts\` — Nuxt configuration
- \`app.vue\` — Root component
- \`pages/*.vue\` — Page components (auto-routed)`,
    angular: `- \`package.json\` — Dependencies
- \`src/app/app.module.ts\` — Root module
- \`src/app/app-routing.module.ts\` — Routing
- \`src/app/app.component.ts\` — Root component
- \`tsconfig.json\` — TypeScript configuration`,
    svelte: `- \`package.json\` — Dependencies
- \`vite.config.ts\` — Vite configuration
- \`src/main.ts\` — Entry point
- \`src/App.svelte\` — Root component`,
    astro: `- \`package.json\` — Dependencies
- \`astro.config.mjs\` — Astro configuration
- \`src/pages/index.astro\` — Home page
- Astro pages auto-route from \`src/pages/\``,
  };

  return summaries[framework];
}

function getDevCommand(framework: Framework): string {
  const commands: Record<Framework, string> = {
    html: 'open index.html',
    react: 'npm run dev',
    nextjs: 'npm run dev',
    vue: 'npm run dev',
    nuxt: 'npm run dev',
    angular: 'ng serve',
    svelte: 'npm run dev',
    astro: 'npm run dev',
  };

  return commands[framework];
}
