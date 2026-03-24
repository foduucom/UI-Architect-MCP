// for building library of components

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.resolve(__dirname, '../components');

// Mapping folder names to their component categories
const FOLDER_TO_CATEGORY: Record<string, string> = {
  'buttons': 'button-primary',
  'cards': 'card',
  'checkboxes': 'checkbox',
  'forms': 'card',
  'inputs': 'input',
  'notifications': 'card',
  'patterns': 'card', 
  'radio-buttons': 'radio',
  'toggle-switches': 'toggle',
  'tooltips': 'tooltip',
  'loaders': 'loader'
};

// Explicit variable mapping to match src/engine/local-library.ts
const VAR_NAME_MAPPING: Record<string, string> = {
  'buttons': 'BUTTON_COMPONENTS',
  'cards': 'CARD_COMPONENTS',
  'checkboxes': 'CHECKBOX_COMPONENTS',
  'forms': 'FORMS_COMPONENTS',
  'inputs': 'INPUT_COMPONENTS',
  'notifications': 'NOTIFICATIONS_COMPONENTS',
  'patterns': 'PATTERNS_COMPONENTS',
  'radio-buttons': 'RADIO_BUTTONS_COMPONENTS',
  'toggle-switches': 'TOGGLE_SWITCHES_COMPONENTS',
  'tooltips': 'TOOLTIPS_COMPONENTS',
  'loaders': 'LOADERS_COMPONENTS',
};

async function processComponents() {
  console.log('🚀 Starting local component processing...');

  const folders = fs.readdirSync(COMPONENTS_DIR).filter(f => 
    fs.statSync(path.join(COMPONENTS_DIR, f)).isDirectory()
  );

  let totalProcessed = 0;

  for (const folder of folders) {
    const category = FOLDER_TO_CATEGORY[folder] || 'card';
    const folderPath = path.join(COMPONENTS_DIR, folder);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.html'));

    if (files.length === 0) continue;

    console.log(`\n📁 Processing ${folder} (${files.length} components) -> ${category}`);

    const definitions = [];

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Basic split of HTML and CSS
      const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/i);
      const html = content.replace(/<style>[\s\S]*?<\/style>/gi, '').trim();
      const css = styleMatch ? styleMatch[1].trim() : '';

      // Extract metadata from comment if exists
      // Format: /* From Uiverse.io by 0x-Sarthak  - Tags: button, hover ... */
      const commentMatch = css.match(/\/\* From Uiverse\.io by (.*?) - Tags: (.*?) \*\//);
      const author = commentMatch ? commentMatch[1].trim() : 'Uiverse';
      const tags = commentMatch ? commentMatch[2].split(',').map(t => t.trim()) : [];

      const id = file.replace('.html', '').toLowerCase();
      const name = id.split('_').slice(1).join(' ') || id;

      definitions.push({
        id,
        category,
        style: 'animated', // Hardcoded as these are from Uiverse
        name: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: `Premium ${folder.toLowerCase()} component by ${author}`,
        tags: [...tags, folder.toLowerCase()],
        animationLevel: 'high',
        html,
        css
      });

      totalProcessed++;
    }

    // Write registry.ts for this folder (safer than JSON imports in older Node)
    const registryPath = path.join(folderPath, 'registry.ts');
    const registryContent = `import type { ComponentDefinition } from '../../engine/types.js';\n\nexport const registry: ComponentDefinition[] = ${JSON.stringify(definitions, null, 2)};\n`;
    fs.writeFileSync(registryPath, registryContent);
    
    // Create index.ts with explicit variable name
    const varName = VAR_NAME_MAPPING[folder] || (folder.toUpperCase().replace(/-/g, '_') + '_COMPONENTS');
    const indexContent = `import { registry } from './registry.js';\nexport const ${varName} = registry as any;\n`;
    fs.writeFileSync(path.join(folderPath, 'index.ts'), indexContent);
    
    console.log(`   ✅ Saved ${definitions.length} components to ${folder}/registry.json (${varName})`);
  }

  console.log(`\n✨ Successfully processed ${totalProcessed} components!`);
}

processComponents().catch(err => {
  console.error('❌ Error processing components:', err);
  process.exit(1);
});
